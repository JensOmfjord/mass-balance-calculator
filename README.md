# Mass & Balance Calculator

A professional React Native mass and balance calculator app for aviation, supporting multiple aircraft with real-time weight and balance calculations and visual CG envelope charts.

## Overview

This mobile application helps pilots calculate weight and balance for aircraft operations. It provides:
- Real-time mass and balance calculations
- Visual CG envelope charts showing safe operating limits
- Support for multiple aircraft configurations
- Interactive weight input with hybrid slider/direct input interface
- Fuel weight calculations with aircraft-specific fuel densities

## Supported Aircraft

### Tecnam P2002JF
- **SE-LJO**: Empty weight 371 kg
- **SE-LRO**: Empty weight 381 kg
- **Fuel**: Avgas 100LL (0.72 kg/L)
- **Capacity**: 100 liters
- **MTOW**: 620 kg

### Diamond DA40 NG
- **LN-FTS**: Empty weight 929.3 kg
- **LN-FTM**: Empty weight 900 kg
- **Fuel**: Jet-A (0.8 kg/L at 15°C)
- **Capacity**: 155.2 liters
- **MTOW**: 1310 kg

## Project Structure

```
my-app/
├── src/
│   ├── components/
│   │   └── CGEnvelopeChart.tsx       # Visual CG envelope visualization
│   ├── data/
│   │   ├── tecnam2002jf/
│   │   │   ├── aircraft/              # Aircraft configurations
│   │   │   └── base/                  # Shared envelope & stations
│   │   └── da40ng/
│   │       ├── aircraft/              # Aircraft configurations
│   │       └── base/                  # Shared envelope & stations
│   ├── models/
│   │   ├── Aircraft.ts                # Aircraft configuration types
│   │   ├── CGEnvelope.ts              # CG envelope types
│   │   ├── MassBalanceResult.ts       # Calculation result types
│   │   └── Station.ts                 # Loading station types
│   ├── screens/
│   │   ├── AircraftSelectionScreen.tsx
│   │   └── CalculatorScreen.tsx       # Main calculator interface
│   ├── services/
│   │   └── massBalanceCalculator.ts   # Core calculation logic
│   └── utils/
│       ├── constants.ts               # Fuel densities & constants
│       └── units.ts                   # Unit conversion utilities
├── ios/                               # iOS native project
├── android/                           # Android native project (not configured)
└── app.json                           # Expo configuration
```

## Key Features

### 1. Aircraft-Specific Fuel Density
The app correctly handles different fuel types:
- **Tecnam P2002JF**: Uses Avgas 100LL (0.72 kg/L)
- **Diamond DA40 NG**: Uses Jet-A (0.8 kg/L)

### 2. Visual CG Envelope Chart
- Real-time visualization of weight and CG position
- Green polygon shows safe envelope limits
- Current position marked with color-coded dot (blue=safe, red=unsafe)
- Grid lines and crosshairs for precise reading
- Displays CG position in meters, weight in kg

### 3. Hybrid Input Interface
- Sliders for quick weight adjustment
- Tap value to enter precise numbers via keyboard
- Displays max fuel capacity with calculated weight

### 4. Safety Warnings
- Real-time validation against MTOW
- CG envelope limit checking
- Clear visual warnings when limits exceeded

## Technology Stack

- **Framework**: React Native 0.81.4 with Expo
- **Language**: TypeScript
- **UI Components**: React Native core components
- **Charts**: react-native-svg for CG envelope visualization
- **Navigation**: Custom stack-based navigation
- **Storage**: @react-native-async-storage/async-storage
- **Platform**: iOS (primary), Android (not configured)

## Deployment

### Preferred Method: Direct iOS Build

The preferred way to deploy this app is to build directly to a connected iPhone device without using Expo Go or EAS Build.

#### Prerequisites
- macOS with Xcode installed
- iPhone connected via USB
- Apple Developer account configured in Xcode
- CocoaPods installed (`sudo gem install cocoapods`)

#### Build & Deploy Steps

1. **Install Dependencies**
   ```bash
   npm install
   cd ios && pod install && cd ..
   ```

2. **Check Connected Device**
   ```bash
   xcrun devicectl list devices
   ```
   Note the device ID (e.g., `00008120-00161D0E2639A01E`)

3. **Build for Release**
   ```bash
   xcodebuild -workspace /Users/jens.omfjord/dev/claude/ofk/my-app/ios/MB.xcworkspace \
     -scheme MB \
     -configuration Release \
     -destination 'platform=iOS,id=YOUR_DEVICE_ID' \
     -allowProvisioningUpdates \
     clean build
   ```

4. **Install to Device**
   ```bash
   xcrun devicectl device install app \
     --device YOUR_DEVICE_ID \
     /Users/jens.omfjord/Library/Developer/Xcode/DerivedData/MB-*/Build/Products/Release-iphoneos/MB.app
   ```

5. **Launch on Device**
   ```bash
   xcrun devicectl device process launch \
     --device YOUR_DEVICE_ID \
     com.massbalance.app
   ```

### Why This Method?

- **Standalone**: App runs without dev server connection
- **Fast**: Direct build is faster than EAS Build
- **Production-Ready**: Uses Release configuration
- **No Internet Required**: Works offline after installation
- **Real Performance**: Tests actual production performance

### Alternative: Development Mode

For development with hot reload:
```bash
npx expo run:ios --device
```

Note: This requires the Metro bundler to be running and is not suitable for standalone use.

## Configuration

### Bundle Identifier
- **iOS**: `com.massbalance.app`
- **App Name**: M&B
- **Slug**: mass-and-balance-calculator

### Adding New Aircraft

1. Create aircraft configuration in `src/data/[model-type]/aircraft/`
2. Define envelope data in `src/data/[model-type]/base/envelope.ts`
3. Define loading stations in `src/data/[model-type]/base/stations.ts`
4. Export aircraft in main data index
5. Set correct fuel type and density in aircraft config

Example:
```typescript
export const MY_AIRCRAFT: AircraftConfig = {
  registration: 'LN-XXX',
  model: 'Aircraft Model',
  modelType: 'custom-model',
  manufacturer: 'Manufacturer',
  emptyWeight: 500,
  emptyCG: 85.0,
  stations: customStations,
  envelope: customEnvelope,
  maxTakeoffWeight: 800,
  fuelCapacity: 120,
  fuelArm: 95.0,
  fuelType: 'avgas', // or 'jet-a'
  fuelDensity: FUEL_DENSITY_AVGAS_KG_PER_LITER,
  defaultUnit: 'kg',
};
```

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

## Recent Changes

### v1.0.0 (Current)
- Initial release with Tecnam P2002JF and Diamond DA40 NG support
- Aircraft-specific fuel density support (Avgas vs Jet-A)
- CG envelope visualization chart
- Hybrid slider/input interface
- Metric units (kg, meters, liters)

## License

Private - For personal/organizational use

## Contact

For questions or issues, contact the development team.
