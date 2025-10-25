import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { aircraftRegistry } from '../data/aircraftRegistry';
import { AircraftConfig } from '../models/Aircraft';

interface HomeScreenProps {
  onSelectAircraft: (aircraft: AircraftConfig) => void;
  onViewDetails: (aircraft: AircraftConfig) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectAircraft, onViewDetails }) => {
  const handleSelectAircraft = (aircraft: AircraftConfig) => {
    onSelectAircraft(aircraft);
  };

  const handleViewDetails = (aircraft: AircraftConfig, event: any) => {
    event.stopPropagation();
    onViewDetails(aircraft);
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
            <View style={styles.cardHeader}>
              <View style={styles.cardMain}>
                <Text style={styles.registration}>{item.registration}</Text>
                <Text style={styles.model}>{item.model}</Text>
                <Text style={styles.details}>
                  Empty Weight: {item.emptyWeight} kg • Max TO: {item.maxTakeoffWeight} kg
                </Text>
              </View>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={(e) => handleViewDetails(item, e)}
              >
                <Text style={styles.infoButtonText}>ℹ️</Text>
              </TouchableOpacity>
            </View>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMain: {
    flex: 1,
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
  infoButton: {
    padding: 8,
    marginLeft: 12,
  },
  infoButtonText: {
    fontSize: 28,
  },
});
