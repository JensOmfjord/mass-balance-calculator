import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AircraftConfig } from '../models/Aircraft';
import { RootStackParamList } from '../navigation/types';
import { inchesToMeters } from '../utils/units';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { list, layout } from '../theme/spacing';
import { useDeviceType } from '../utils/useDeviceType';

type AircraftDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'Details'>;

export const AircraftDetailsScreen: React.FC<AircraftDetailsScreenProps> = ({ route }) => {
  const aircraft: AircraftConfig = route.params.aircraft;
  const { isTablet } = useDeviceType();

  const renderRow = (label: string, value: React.ReactNode, key?: string) => (
    <View style={styles.detailRow} key={key || label}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, isTablet && styles.contentContainerTablet]}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Basic Specifications */}
      <Text style={styles.sectionHeader}>Aircraft Specifications</Text>
      <View style={styles.card}>
        {renderRow('Manufacturer', aircraft.manufacturer)}
        {renderRow('Model', aircraft.model)}
        {renderRow('Registration', aircraft.registration)}
        <View style={styles.divider} />
        {renderRow('Empty Weight', `${aircraft.emptyWeight} kg`)}
        {renderRow(
          'Empty CG',
          `${aircraft.emptyCG.toFixed(2)} in (${inchesToMeters(aircraft.emptyCG).toFixed(3)} m)`
        )}
        {renderRow('Max Takeoff Weight', `${aircraft.maxTakeoffWeight} kg`)}
        {aircraft.maxLandingWeight &&
          renderRow('Max Landing Weight', `${aircraft.maxLandingWeight} kg`)}
      </View>

      {/* Fuel Specifications */}
      <Text style={styles.sectionHeader}>Fuel Specifications</Text>
      <View style={styles.card}>
        {renderRow(
          'Fuel Type',
          aircraft.fuelType === 'jet-a' ? 'Jet-A' : aircraft.fuelType === 'ul91' ? 'UL91' : 'Avgas'
        )}
        {renderRow('Fuel Capacity', `${aircraft.fuelCapacity} L`)}
        {renderRow('Fuel Density', `${aircraft.fuelDensity.toFixed(2)} kg/L`)}
        {renderRow(
          'Fuel Arm',
          `${aircraft.fuelArm.toFixed(2)} in (${inchesToMeters(aircraft.fuelArm).toFixed(3)} m)`
        )}
      </View>

      {/* Loading Stations */}
      <Text style={styles.sectionHeader}>Loading Stations</Text>
      {aircraft.stations.map((station, index) => (
        <View style={styles.card} key={station.id}>
          {renderRow('Station', station.name, `station-name-${index}`)}
          {renderRow('Max Weight', `${station.maxWeight} kg`, `station-max-${index}`)}
          {renderRow(
            'Arm',
            `${station.arm.toFixed(2)} in (${inchesToMeters(station.arm).toFixed(3)} m)`,
            `station-arm-${index}`
          )}
        </View>
      ))}

      {/* CG Envelope */}
      <Text style={styles.sectionHeader}>CG Envelope Limits</Text>
      <View style={styles.card}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Weight (kg)</Text>
          <Text style={styles.tableHeaderText}>CG Min</Text>
          <Text style={styles.tableHeaderText}>CG Max</Text>
        </View>
        {aircraft.envelope.map((point, index) => (
          <View style={styles.tableRow} key={index}>
            <Text style={styles.tableCell}>{point.weight}</Text>
            <Text style={styles.tableCell}>
              {inchesToMeters(point.cgMin).toFixed(3)}
              {'\n'}
              <Text style={styles.tableCellSecondary}>({point.cgMin.toFixed(2)} in)</Text>
            </Text>
            <Text style={styles.tableCell}>
              {inchesToMeters(point.cgMax).toFixed(3)}
              {'\n'}
              <Text style={styles.tableCellSecondary}>({point.cgMax.toFixed(2)} in)</Text>
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.systemGroupedBackground,
  },
  contentContainer: {
    paddingTop: list.cardGap,
    paddingBottom: list.bottomPadding,
  },
  contentContainerTablet: {
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  sectionHeader: {
    ...typography.footnote,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: list.insetHorizontal + list.cardGap,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: list.cardRadius,
    marginHorizontal: list.insetHorizontal,
    marginBottom: list.cardGap,
    paddingHorizontal: list.xl,
    paddingVertical: list.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    ...typography.callout,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginVertical: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  tableHeaderText: {
    flex: 1,
    ...typography.footnote,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  tableCell: {
    flex: 1,
    ...typography.footnote,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tableCellSecondary: {
    ...typography.caption2,
    color: colors.textLight,
  },
  bottomPadding: {
    height: list.bottomPadding,
  },
});
