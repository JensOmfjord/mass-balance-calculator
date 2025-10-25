import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { aircraftRegistry } from '../data/aircraftRegistry';
import { AircraftConfig } from '../models/Aircraft';
import { colors, gradients } from '../theme/colors';

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
      <LinearGradient
        colors={gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.title}>Mass & Balance Calculator</Text>
        <Text style={styles.subtitle}>Select Aircraft</Text>
      </LinearGradient>

      <FlatList
        data={aircraftRegistry}
        keyExtractor={(item) => item.registration}
        contentContainerStyle={styles.listContent}
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
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.white,
    opacity: 0.9,
  },
  listContent: {
    padding: 20,
  },
  aircraftCard: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
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
    color: colors.primary,
  },
  model: {
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 4,
  },
  details: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  infoButton: {
    padding: 8,
    marginLeft: 12,
    backgroundColor: colors.gray100,
    borderRadius: 8,
  },
  infoButtonText: {
    fontSize: 24,
  },
});
