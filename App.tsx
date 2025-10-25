import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen, CalculatorScreen } from './src/screens';
import { AircraftDetailsScreen } from './src/screens/AircraftDetailsScreen';
import { AircraftConfig } from './src/models/Aircraft';

type Screen = 'home' | 'calculator' | 'details';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftConfig | null>(null);

  const handleSelectAircraft = (aircraft: AircraftConfig) => {
    setSelectedAircraft(aircraft);
    setCurrentScreen('calculator');
  };

  const handleViewDetails = (aircraft: AircraftConfig) => {
    setSelectedAircraft(aircraft);
    setCurrentScreen('details');
  };

  const handleBack = () => {
    setCurrentScreen('home');
    setSelectedAircraft(null);
  };

  return (
    <>
      {currentScreen === 'home' && (
        <HomeScreen
          onSelectAircraft={handleSelectAircraft}
          onViewDetails={handleViewDetails}
        />
      )}
      {currentScreen === 'calculator' && selectedAircraft && (
        <CalculatorScreen aircraft={selectedAircraft} onBack={handleBack} />
      )}
      {currentScreen === 'details' && selectedAircraft && (
        <AircraftDetailsScreen aircraft={selectedAircraft} onBack={handleBack} />
      )}
      <StatusBar style="auto" />
    </>
  );
}
