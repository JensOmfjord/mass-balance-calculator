import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen, CalculatorScreen } from './src/screens';
import { AircraftConfig } from './src/models/Aircraft';

export default function App() {
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftConfig | null>(null);

  const handleSelectAircraft = (aircraft: AircraftConfig) => {
    setSelectedAircraft(aircraft);
  };

  const handleBack = () => {
    setSelectedAircraft(null);
  };

  return (
    <>
      {selectedAircraft ? (
        <CalculatorScreen aircraft={selectedAircraft} onBack={handleBack} />
      ) : (
        <HomeScreen onSelectAircraft={handleSelectAircraft} />
      )}
      <StatusBar style="auto" />
    </>
  );
}
