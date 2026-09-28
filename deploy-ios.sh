#!/bin/bash

# deploy-ios.sh
# Build and deploy M&B (Mass & Balance Calculator) to a paired iPhone.
#
# Produces a standalone Release build with the JS bundle embedded in the app,
# so the app runs on the iPhone without Metro or any Mac connection.
#
# Usage:
#   ./deploy-ios.sh                # detect device, build, install, launch
#   ./deploy-ios.sh --list         # only list paired iPhones
#   ./deploy-ios.sh --device UDID  # deploy to a specific device (udid/name)
#   ./deploy-ios.sh --clean        # clean build before deploying
#   ./deploy-ios.sh --no-launch    # install but do not launch
#
# NOTE: with a free personal Apple team, the app stops launching ~7 days
# after signing. Re-run this script to renew. The script prints the exact
# expiry date on every deploy.

set -euo pipefail

# --- Configuration ---
SCHEME="MB"
WORKSPACE="ios/MB.xcworkspace"
BUNDLE_ID="com.massbalance.app"
BUILD_CONFIG="Release"
DERIVED_DATA="ios/build"
APP_NAME="MB.app"

CLEAN=false
LAUNCH=true
LIST_ONLY=false
DEVICE_QUERY=""

# --- Output helpers ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status()  { echo -e "${BLUE}[*]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error()   { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
die() { print_error "$1"; exit 1; }

usage() {
  grep '^#' "$0" | sed -n '2,20p' | sed 's/^# \{0,1\}//'
}

# --- Arguments ---
while [ $# -gt 0 ]; do
  case "$1" in
    --clean)     CLEAN=true ;;
    --no-launch) LAUNCH=false ;;
    --list)      LIST_ONLY=true ;;
    --device)    shift; DEVICE_QUERY="${1:-}"; [ -n "$DEVICE_QUERY" ] || die "--device requires an argument (udid or name)" ;;
    -h|--help)   usage; exit 0 ;;
    *)           die "Unknown option: $1 (try --help)" ;;
  esac
  shift
done

cd "$(dirname "$0")"

# --- Preflight ---
check_requirements() {
  print_status "Checking requirements..."

  command -v xcodebuild >/dev/null 2>&1 || die "xcodebuild not found. Install Xcode."
  command -v xcrun      >/dev/null 2>&1 || die "xcrun not found. Install Xcode Command Line Tools."
  command -v python3    >/dev/null 2>&1 || die "python3 not found."
  command -v node       >/dev/null 2>&1 || die "node not found (needed for JS bundling)."

  [ -d "$WORKSPACE" ] || die "iOS workspace not found at $WORKSPACE"

  print_success "All requirements met"
}

# --- Device detection ---
# Prints "idx|name|udid|model|os_version|transport" for every paired physical iPhone.
PY_DEVICE_FILTER='
import sys, json

data = json.load(sys.stdin)
devices = data.get("result", {}).get("devices", [])

rows = []
for d in devices:
    hp = d.get("hardwareProperties") or {}
    dp = d.get("deviceProperties") or {}
    cp = d.get("connectionProperties") or {}

    if hp.get("platform") != "iOS":
        continue
    if cp.get("pairingState") != "paired":
        continue
    if hp.get("reality") != "physical":
        continue

    udid = hp.get("udid") or d.get("identifier") or ""
    if not udid:
        continue
    name = dp.get("name") or "Unknown iPhone"
    model = hp.get("marketingName") or hp.get("productType") or "iPhone"
    osver = dp.get("osVersionNumber") or "?"
    transport = cp.get("transportType") or "?"

    rows.append(f"{name}|{udid}|{model}|{osver}|{transport}")

for i, row in enumerate(rows):
    print(f"{i}|{row}")
'

detect_devices() {
  local json
  json=$(xcrun devicectl list devices --json-output - 2>/dev/null) || return 1
  echo "$json" | python3 -c "$PY_DEVICE_FILTER"
}

select_device() {
  local rows="$1"

  if [ -n "$DEVICE_QUERY" ]; then
    local match
    match=$(echo "$rows" | grep -i "$DEVICE_QUERY" | head -n 1 || true)
    [ -n "$match" ] || die "No paired device matching '$DEVICE_QUERY'"
    parse_row "$match"
    return
  fi

  local count
  count=$(echo "$rows" | grep -c . || true)

  if [ "$count" -eq 0 ]; then
    print_error "No paired iPhone found."
    echo "  Make sure:" >&2
    echo "  - The iPhone is connected via USB (or on the same Wi-Fi network if wirelessly paired)" >&2
    echo "  - You have trusted this computer on the iPhone" >&2
    echo "  - The iPhone is unlocked" >&2
    echo "  - Developer mode is enabled (Settings > Privacy & Security > Developer Mode)" >&2
    echo "  - The device is paired in Xcode (Window > Devices and Simulators)" >&2
    exit 1
  fi

  if [ "$count" -eq 1 ]; then
    parse_row "$rows"
    return
  fi

  echo ""
  echo "Paired iPhones:"
  while IFS= read -r row; do
    parse_row "$row"
    echo "  [$idx] $name ($model, iOS $os_version, $transport)"
  done <<< "$rows"
  echo ""

  read -r -p "Enter device number: " selection
  local chosen
  chosen=$(echo "$rows" | grep "^${selection}|" | head -n 1 || true)
  [ -n "$chosen" ] || die "Invalid selection"
  parse_row "$chosen"
}

parse_row() {
  IFS='|' read -r _idx name udid model os_version transport <<< "$1"
  export DEVICE_NAME="$name" DEVICE_UDID="$udid" DEVICE_MODEL="$model" DEVICE_OS="$os_version" DEVICE_TRANSPORT="$transport"
}

# --- CocoaPods ---
install_pods() {
  if [ -f "ios/Pods/Manifest.lock" ] && diff -q ios/Podfile.lock ios/Pods/Manifest.lock >/dev/null 2>&1; then
    print_status "CocoaPods dependencies up to date"
    return
  fi

  print_status "Installing CocoaPods dependencies..."
  command -v pod >/dev/null 2>&1 || die "CocoaPods not found. Install with: sudo gem install cocoapods"
  (cd ios && pod install --repo-update 2>&1 | grep -E '(Installing|Using|Downloading|Generating|error|Error)' || true)
  print_success "Pods installed"
}

# --- Build ---
build_app() {
  local udid="$1"
  local log
  log=$(mktemp "${TMPDIR:-/tmp}/mb-xcodebuild.XXXXXX").log

  local args=(-workspace "$WORKSPACE"
              -scheme "$SCHEME"
              -configuration "$BUILD_CONFIG"
              -destination "id=$udid"
              -derivedDataPath "$DERIVED_DATA"
              -allowProvisioningUpdates
              -allowProvisioningDeviceRegistration
              -quiet)
  if [ "$CLEAN" = true ]; then
    args+=(clean)
  fi
  args+=(build)

  print_status "Building $BUILD_CONFIG for $DEVICE_NAME ($udid)..."
  if [ "$CLEAN" = true ]; then
    print_warning "Clean build - this can take several minutes"
  else
    echo "    (output logged to $log)"
  fi

  if ! xcodebuild "${args[@]}" 2>&1 | tee "$log"; then
    print_error "Build failed. Last 60 lines:"
    tail -n 60 "$log"
    exit 1
  fi
  print_success "Build succeeded"
}

# --- Bundle verification ---
# The app must contain main.jsbundle to run without Metro/Mac.
ensure_js_bundle() {
  APP_PATH="$DERIVED_DATA/Build/Products/${BUILD_CONFIG}-iphoneos/$APP_NAME"
  [ -d "$APP_PATH" ] || die "Built app not found at $APP_PATH"

  if [ -f "$APP_PATH/main.jsbundle" ]; then
    local size
    size=$(ls -lh "$APP_PATH/main.jsbundle" | awk '{print $5}')
    print_success "JS bundle embedded in app: $size"
    return
  fi

  print_warning "main.jsbundle missing from build - bundling manually..."

  local entry
  entry=$(node -e "require('expo/scripts/resolveAppEntry')" "$PWD" ios absolute | tail -n 1)
  [ -n "$entry" ] || die "Could not resolve JS entry file"

  npx expo export:embed \
    --platform ios \
    --dev false \
    --entry-file "$entry" \
    --bundle-output "$APP_PATH/main.jsbundle" \
    --assets-dest "$APP_PATH" 2>&1 | grep -Ev '(ExperimentalWarning|trace-warnings|Starting Metro|Bundled |Writing bundle|Done writing|^\s*$)' || true

  [ -f "$APP_PATH/main.jsbundle" ] || die "Bundling failed. Run './deploy-ios.sh --clean' and try again."

  # Adding resources invalidated the signature - re-sign with the same identity.
  local identity
  identity=$(security find-identity -v -p codesigning 2>/dev/null | grep "Apple Development" | head -n 1 | sed -E 's/.*"(.*)"$/\1/')
  [ -n "$identity" ] || die "No Apple Development signing identity found"

  local ent_file
  ent_file=$(mktemp "${TMPDIR:-/tmp}/mb-entitlements.XXXXXX").plist
  codesign -d --entitlements :- "$APP_PATH" > "$ent_file" 2>/dev/null || true
  if [ -s "$ent_file" ]; then
    codesign --force --sign "$identity" --entitlements "$ent_file" "$APP_PATH" 2>/dev/null
  else
    codesign --force --sign "$identity" "$APP_PATH" 2>/dev/null
  fi
  rm -f "$ent_file"

  local size
  size=$(ls -lh "$APP_PATH/main.jsbundle" | awk '{print $5}')
  print_success "JS bundle embedded and app re-signed: $size"
}

# --- Install & launch ---
install_app() {
  print_status "Installing on $DEVICE_NAME..."
  xcrun devicectl device install app --device "$DEVICE_UDID" "$APP_PATH" 2>&1 | grep -Ev '^\s*$'
  print_success "App installed"
}

launch_app() {
  [ "$LAUNCH" = true ] || return 0
  print_status "Launching $BUNDLE_ID..."
  local launch_err
  launch_err=$(mktemp "${TMPDIR:-/tmp}/mb-launch.XXXXXX")
  if xcrun devicectl device process launch --device "$DEVICE_UDID" "$BUNDLE_ID" > "$launch_err" 2>&1; then
    print_success "App launched on $DEVICE_NAME"
  elif grep -q "not been explicitly trusted\|invalid code signature" "$launch_err"; then
    print_warning "Install succeeded, but iOS blocked the first launch."
    echo "  One-time step on the iPhone:" >&2
    echo "  Settings > General > VPN & Device Management > Apple Development: ... > Trust" >&2
    echo "  Then launch the app manually (repeat after every 7-day renewal)." >&2
  else
    print_warning "Could not launch (is the device unlocked?). Install succeeded."
  fi
  rm -f "$launch_err"
}

# --- Signing expiry ---
report_expiry() {
  local profile="$APP_PATH/embedded.mobileprovision"
  [ -f "$profile" ] || return 0

  local result
  result=$(python3 - "$profile" <<'PYEOF'
import sys, plistlib, datetime

data = open(sys.argv[1], 'rb').read()
start = data.find(b'<?xml')
end = data.find(b'</plist>') + len(b'</plist>')
pl = plistlib.loads(data[start:end])

exp = pl.get('ExpirationDate')
now = datetime.datetime.now(exp.tzinfo)
days = (exp - now).days
print(f"{exp.strftime('%Y-%m-%d')}|{days}")
PYEOF
)
  [ -n "$result" ] || return 0

  local expiry days
  expiry=$(echo "$result" | cut -d'|' -f1)
  days=$(echo "$result" | cut -d'|' -f2)

  if [ "$days" -le 0 ]; then
    print_error "Signing profile EXPIRED - the app will not launch until you re-deploy."
  elif [ "$days" -le 10 ]; then
    print_warning "App stops launching $expiry (in $days days) - re-run this script before then."
  else
    print_success "App runs standalone until $expiry ($days days), then needs a re-deploy"
  fi
}

# --- Main ---
main() {
  echo ""
  echo "========================================"
  echo "  M&B iOS Deploy (standalone Release)"
  echo "========================================"
  echo ""

  check_requirements

  print_status "Detecting paired iPhones..."
  local rows
  rows=$(detect_devices)

  if [ "$LIST_ONLY" = true ]; then
    if [ -z "$rows" ]; then
      print_warning "No paired iPhones found"
    else
      echo "Paired iPhones:"
      while IFS= read -r row; do
        parse_row "$row"
        echo "  $name | udid: $udid | $model | iOS $os_version | $transport"
      done <<< "$rows"
    fi
    exit 0
  fi

  select_device "$rows"
  print_success "Target: $DEVICE_NAME ($DEVICE_MODEL, iOS $DEVICE_OS, $DEVICE_TRANSPORT)"

  echo ""
  install_pods
  echo ""
  build_app "$DEVICE_UDID"
  echo ""
  ensure_js_bundle
  echo ""
  install_app
  launch_app
  echo ""
  report_expiry

  echo ""
  print_success "Deployment complete - no Mac needed to run the app"
  echo ""
}

main
