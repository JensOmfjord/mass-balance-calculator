import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { aircraftRegistry, getAircraftByRegistration } from '../data/aircraftRegistry';
import { calculateMassBalance } from '../services/massBalanceCalculator';

export const HomeScreen: React.FC = () => {
  const handleSelectAircraft = (registration: string) => {
    console.log('Selected aircraft:', registration);

    // Run test calculation
    const aircraft = getAircraftByRegistration(registration);
    if (aircraft) {
      // Test scenario: 2 people (75 kg each), 50 liters fuel
      const testWeights: Record<string, number> = {};

      if (aircraft.modelType === 'tecnam-2002jf') {
        testWeights['pilot'] = 75;
        testWeights['copilot'] = 75;
        testWeights['baggage'] = 10;
      } else {
        testWeights['frontSeats'] = 150; // 2 people
        testWeights['rearSeats'] = 0;
        testWeights['baggageStandard'] = 10;
      }

      const fuelWeight = 50 * 0.72; // 50 liters * 0.72 kg/liter
      const result = calculateMassBalance(aircraft, testWeights, fuelWeight);

      console.log('=== TEST CALCULATION ===');
      console.log('Aircraft:', registration);
      console.log('Total Weight:', result.totalWeight.toFixed(1), 'kg');
      console.log('CG Position:', result.cgPosition.toFixed(2), 'inches');
      console.log('Within Envelope:', result.isWithinEnvelope);
      console.log('Exceeds Max Weight:', result.exceedsMaxWeight);
      console.log('=======================');
    }
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
            onPress={() => handleSelectAircraft(item.registration)}
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
