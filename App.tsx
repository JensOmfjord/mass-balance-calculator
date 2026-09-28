import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen, CalculatorScreen } from './src/screens';
import { AircraftDetailsScreen } from './src/screens/AircraftDetailsScreen';
import { PerformanceScreen } from './src/screens/PerformanceScreen';
import { AircraftConfig } from './src/models/Aircraft';

type Screen = 'home' | 'calculator' | 'details' | 'performance';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftConfig | null>(null);
  const [performanceReturn, setPerformanceReturn] = useState<Screen>('home');

  const handleSelectAircraft = (aircraft: AircraftConfig) => {
    setSelectedAircraft(aircraft);
    setCurrentScreen('calculator');
  };

  const handleViewDetails = (aircraft: AircraftConfig) => {
    setSelectedAircraft(aircraft);
    setCurrentScreen('details');
  };

  const handleOpenPerformanceFromHome = (aircraft: AircraftConfig) => {
    setSelectedAircraft(aircraft);
    setPerformanceReturn('home');
    setCurrentScreen('performance');
  };

  const handleOpenPerformanceFromCalculator = () => {
    setPerformanceReturn('calculator');
    setCurrentScreen('performance');
  };

  const handleBack = () => {
    setCurrentScreen('home');
    setSelectedAircraft(null);
  };

  const handlePerformanceBack = () => {
    setCurrentScreen(performanceReturn);
    if (performanceReturn === 'home') {
      setSelectedAircraft(null);
    }
  };

  return (
    <>
      {currentScreen === 'home' && (
        <HomeScreen
          onSelectAircraft={handleSelectAircraft}
          onViewDetails={handleViewDetails}
          onOpenPerformance={handleOpenPerformanceFromHome}
        />
      )}
      {currentScreen === 'calculator' && selectedAircraft && (
        <CalculatorScreen
          aircraft={selectedAircraft}
          onBack={handleBack}
          onOpenPerformance={handleOpenPerformanceFromCalculator}
        />
      )}
      {currentScreen === 'details' && selectedAircraft && (
        <AircraftDetailsScreen aircraft={selectedAircraft} onBack={handleBack} />
      )}
      {currentScreen === 'performance' && selectedAircraft && (
        <PerformanceScreen aircraft={selectedAircraft} onBack={handlePerformanceBack} />
      )}
      <StatusBar style="auto" />
    </>
  );
}
