import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AircraftConfig } from '../models/Aircraft';
import { inchesToMeters } from '../utils/units';

interface AircraftDetailsScreenProps {
  aircraft: AircraftConfig;
  onBack: () => void;
}

export const AircraftDetailsScreen: React.FC<AircraftDetailsScreenProps> = ({ aircraft, onBack }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.registration}>{aircraft.registration}</Text>
          <Text style={styles.model}>{aircraft.model}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Basic Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aircraft Specifications</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Manufacturer:</Text>
              <Text style={styles.detailValue}>{aircraft.manufacturer}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Model:</Text>
              <Text style={styles.detailValue}>{aircraft.model}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Registration:</Text>
              <Text style={styles.detailValue}>{aircraft.registration}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Empty Weight:</Text>
              <Text style={styles.detailValue}>{aircraft.emptyWeight} kg</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Empty CG:</Text>
              <Text style={styles.detailValue}>{aircraft.emptyCG.toFixed(2)} in ({inchesToMeters(aircraft.emptyCG).toFixed(3)} m)</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Max Takeoff Weight:</Text>
              <Text style={styles.detailValue}>{aircraft.maxTakeoffWeight} kg</Text>
            </View>
            {aircraft.maxLandingWeight && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Max Landing Weight:</Text>
                <Text style={styles.detailValue}>{aircraft.maxLandingWeight} kg</Text>
              </View>
            )}
          </View>
        </View>

        {/* Fuel Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fuel Specifications</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fuel Type:</Text>
              <Text style={styles.detailValue}>
                {aircraft.fuelType === 'jet-a' ? 'Jet-A' : aircraft.fuelType === 'ul91' ? 'UL91' : 'Avgas'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fuel Capacity:</Text>
              <Text style={styles.detailValue}>{aircraft.fuelCapacity} L</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fuel Density:</Text>
              <Text style={styles.detailValue}>{aircraft.fuelDensity.toFixed(2)} kg/L</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fuel Arm:</Text>
              <Text style={styles.detailValue}>{aircraft.fuelArm.toFixed(2)} in ({inchesToMeters(aircraft.fuelArm).toFixed(3)} m)</Text>
            </View>
          </View>
        </View>

        {/* Loading Stations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loading Stations</Text>
          {aircraft.stations.map((station, index) => (
            <View key={station.id} style={styles.card}>
              <Text style={styles.stationName}>{station.name}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Max Weight:</Text>
                <Text style={styles.detailValue}>{station.maxWeight} kg</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Arm:</Text>
                <Text style={styles.detailValue}>{station.arm.toFixed(2)} in ({inchesToMeters(station.arm).toFixed(3)} m)</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CG Envelope */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CG Envelope Limits</Text>
          <View style={styles.card}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Weight (kg)</Text>
              <Text style={styles.tableHeaderText}>CG Min (m)</Text>
              <Text style={styles.tableHeaderText}>CG Max (m)</Text>
            </View>
            {aircraft.envelope.map((point, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{point.weight}</Text>
                <Text style={styles.tableCell}>
                  {inchesToMeters(point.cgMin).toFixed(3)}{'\n'}
                  <Text style={styles.tableCellSecondary}>({point.cgMin.toFixed(2)} in)</Text>
                </Text>
                <Text style={styles.tableCell}>
                  {inchesToMeters(point.cgMax).toFixed(3)}{'\n'}
                  <Text style={styles.tableCellSecondary}>({point.cgMax.toFixed(2)} in)</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  registration: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  model: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  tableCellSecondary: {
    fontSize: 11,
    color: '#999',
  },
  bottomPadding: {
    height: 40,
  },
});
