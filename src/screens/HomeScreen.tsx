import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { aircraftRegistry } from '../data/aircraftRegistry';
import { AircraftConfig } from '../models/Aircraft';

interface HomeScreenProps {
  onSelectAircraft: (aircraft: AircraftConfig) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectAircraft }) => {
  const handleSelectAircraft = (aircraft: AircraftConfig) => {
    onSelectAircraft(aircraft);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mass & Balance Calculator</Text>
      <Text style={styles.subtitle}>Select Aircraft</Text>

      <FlatList
        data={aircraftRegistry}
        keyExtractor={(item) => item.registration}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.aircraftCard}
            onPress={() => handleSelectAircraft(item)}
          >
            <Text style={styles.registration}>{item.registration}</Text>
            <Text style={styles.model}>{item.model}</Text>
            <Text style={styles.details}>
              Empty Weight: {item.emptyWeight} kg • Max TO: {item.maxTakeoffWeight} kg
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  aircraftCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registration: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  model: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
