#!/bin/bash

# deploy-ios.sh
# Build and deploy Mass & Balance Calculator to iPhone via USB

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCHEME="MB"
PROJECT_PATH="ios/MB.xcodeproj"
WORKSPACE_PATH="ios/MB.xcworkspace"
BUILD_CONFIG="Release"  # Release bundles JS for standalone operation
BUNDLE_ID="com.massbalance.app"

# Print colored output
print_status() {
    echo -e "${BLUE}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check for required tools
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v xcodebuild &> /dev/null; then
        print_error "xcodebuild not found. Please install Xcode Command Line Tools."
        exit 1
    fi
    
    if ! command -v xcrun &> /dev/null; then
        print_error "xcrun not found. Please install Xcode Command Line Tools."
        exit 1
    fi
    
    if ! command -v pod &> /dev/null; then
        print_error "CocoaPods not found. Please install it: sudo gem install cocoapods"
        exit 1
    fi
    
    if [ ! -d "$PROJECT_PATH" ]; then
        print_error "iOS project not found at $PROJECT_PATH"
        exit 1
    fi
    
    print_success "All requirements met"
}

# Install CocoaPods dependencies
install_pods() {
    if [ ! -d "ios/Pods" ]; then
        print_status "Installing CocoaPods dependencies..."
        cd ios
        pod install --repo-update 2>&1 | grep -E '(Installing|Using|Downloading|Analyzing|error|warning)' || true
        cd ..
        print_success "Pods installed"
    else
        print_status "CocoaPods already installed"
    fi
}

# Get list of connected iOS devices
get_connected_devices() {
    print_status "Detecting connected iOS devices..." >&2
    
    # Use xcrun devicectl to list devices - redirect stderr to filter out table output
    local device_output
    device_output=$(xcrun devicectl list devices --json-output - 2>/dev/null) || {
        print_error "Failed to list devices. Make sure you have Xcode 15+ installed." >&2
        exit 1
    }
    
    # Parse JSON to get physical iOS devices only (filter by platform and wired connection)
    # The output format: {"result": {"devices": [...]}}
    local devices
    devices=$(echo "$device_output" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    devices = data.get('result', {}).get('devices', [])
    
    # Filter for iOS devices connected via USB (wired)
    ios_devices = []
    for d in devices:
        hw_props = d.get('hardwareProperties', {})
        conn_props = d.get('connectionProperties', {})
        dev_props = d.get('deviceProperties', {})
        
        platform = hw_props.get('platform', '')
        transport = conn_props.get('transportType', '')
        pairing_state = conn_props.get('pairingState', '')
        
        # Only include iOS devices that are wired and paired
        if platform == 'iOS' and transport == 'wired' and pairing_state == 'paired':
            ios_devices.append(d)
    
    # Output device info in pipe-delimited format
    for idx, device in enumerate(ios_devices):
        name = device.get('deviceProperties', {}).get('name', 'Unknown Device')
        udid = device.get('hardwareProperties', {}).get('udid', '')
        product_type = device.get('hardwareProperties', {}).get('productType', 'Unknown Model')
        marketing_name = device.get('hardwareProperties', {}).get('marketingName', product_type)
        os_version = device.get('deviceProperties', {}).get('osVersionNumber', 'Unknown')
        
        if udid:
            print(f'{idx}|{name}|{udid}|{marketing_name}|{os_version}')
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    sys.exit(1)
" 2>&1)
    
    if [ -z "$devices" ] || [[ "$devices" == ERROR:* ]]; then
        print_error "No iOS devices connected via USB." >&2
        print_warning "Make sure:" >&2
        echo "  - Your iPhone is connected via USB cable" >&2
        echo "  - You have trusted this computer on your iPhone" >&2
        echo "  - Your iPhone is unlocked" >&2
        echo "  - Developer mode is enabled (iOS 16+)" >&2
        exit 1
    fi
    
    echo "$devices"
}

# Let user select a device
select_device() {
    local devices="$1"
    
    # Count non-empty lines
    local device_count=$(echo "$devices" | grep -c '^' | tr -d ' ')
    
    if [ "$device_count" -eq 0 ]; then
        print_error "No devices found"
        exit 1
    fi
    
    if [ "$device_count" -eq 1 ]; then
        # Only one device, auto-select
        IFS='|' read -r idx name udid model os_version <<< "$devices"
        DEVICE_NAME="$name"
        DEVICE_UDID="$udid"
        print_success "Auto-selected device: $DEVICE_NAME (iOS $os_version)"
    else
        # Multiple devices, show menu
        echo ""
        echo "Select a device:"
        while IFS='|' read -r idx name udid model os_version; do
            echo "  [$idx] $name ($model, iOS $os_version)"
        done <<< "$devices"
        echo ""
        
        read -p "Enter device number: " selection
        
        # Find the selected device line
        local selected_device=$(echo "$devices" | grep "^${selection}|")
        if [ -z "$selected_device" ]; then
            print_error "Invalid selection"
            exit 1
        fi
        
        IFS='|' read -r idx name udid model os_version <<< "$selected_device"
        DEVICE_NAME="$name"
        DEVICE_UDID="$udid"
        print_success "Selected device: $DEVICE_NAME (iOS $os_version)"
    fi
}

# Build the app
build_and_deploy() {
    print_status "Building and deploying app..."
    echo ""
    
    # Use Expo's built-in build and deploy which handles bundling correctly
    print_status "Using Expo CLI to build Release version with embedded bundle..."
    print_status "Target device: $DEVICE_NAME ($DEVICE_UDID)"
    
    # Expo run:ios handles:
    # - JS bundling for standalone operation
    # - Code signing
    # - Building
    # - Installing to device
    EXPO_NO_DOTENV=1 npx expo run:ios --device "$DEVICE_UDID" --configuration Release --no-bundler 2>&1 | \
        grep -v "Parsing iOS .xcworkspace" | \
        grep -E '(Building|Installing|Successfully|Installed|error|Failed|bundl)' || true
    
    local build_status=${PIPESTATUS[0]}
    
    if [ $build_status -ne 0 ]; then
        print_error "Build/deployment failed"
        exit 1
    fi
    
    # Find the built app to verify
    APP_PATH=$(find ios/build -name "*.app" -type d -path "*/Build/Products/Release-iphoneos/*.app" 2>/dev/null | head -n 1)
    
    if [ -z "$APP_PATH" ]; then
        # Try DerivedData location
        APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "MB.app" -path "*/Build/Products/Release-iphoneos/MB.app" 2>/dev/null | head -n 1)
    fi
    
    if [ -n "$APP_PATH" ]; then
        # Verify JS bundle exists
        if [ -f "$APP_PATH/main.jsbundle" ]; then
            local bundle_size=$(ls -lh "$APP_PATH/main.jsbundle" | awk '{print $5}')
            print_success "JS bundle included: $bundle_size"
        else
            print_warning "JS bundle not found - app may not work standalone"
        fi
        print_success "Build completed: $APP_PATH"
    fi
}

# Main execution
main() {
    echo ""
    echo "========================================"
    echo "  iOS Build & Deploy Script"
    echo "  Mass & Balance Calculator"
    echo "========================================"
    echo ""
    
    check_requirements
    
    local devices=$(get_connected_devices)
    select_device "$devices"
    
    echo ""
    install_pods
    
    echo ""
    build_and_deploy
    
    echo ""
    print_success "Deployment complete!"
    print_status "App is now installed and can run without connection to laptop"
    echo ""
}

# Run main function
main
