import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AircraftConfig } from '../models/Aircraft';
import {
  FieldConditions,
  GrassCondition,
  PerformanceStatus,
  PhasePerformance,
} from '../models/Performance';
import {
  calculatePerformance,
  createDefaultFieldConditions,
} from '../services/performanceCalculator';
import {
  loadPerformanceConfig,
  savePerformanceConfig,
} from '../services/performanceStorage';
import { loadAircraftConfig } from '../services/aircraftStorage';
import { colors } from '../theme/colors';

interface PerformanceScreenProps {
  aircraft: AircraftConfig;
  onBack: () => void;
}

interface EditingTarget {
  scope: 'departure' | 'arrival' | 'weights';
  prop: string;
  label: string;
  unit: string;
  min: number;
  max: number;
}

const TAKEOFF_GRASS_OPTIONS: { value: GrassCondition; label: string }[] = [
  { value: 'dry-short', label: 'Dry ≤5 cm' },
  { value: 'dry-medium', label: 'Dry 5-10 cm' },
  { value: 'dry-long', label: 'Dry ~25 cm' },
  { value: 'wet-short', label: 'Wet ≤5 cm' },
  { value: 'wet-medium', label: 'Wet 5-10 cm' },
  { value: 'wet-long', label: 'Wet ~25 cm' },
  { value: 'too-high', label: '>25 cm' },
];

const LANDING_GRASS_OPTIONS: { value: GrassCondition; label: string }[] = [
  { value: 'dry-short', label: 'Dry ≤5 cm' },
  { value: 'dry-long', label: 'Dry >5 cm' },
  { value: 'wet', label: 'Wet / Soft' },
];

const metersToFeet = (m: number): number => m * 3.28084;

export const PerformanceScreen: React.FC<PerformanceScreenProps> = ({ aircraft, onBack }) => {
  const [sameField, setSameField] = useState(true);
  const [departure, setDeparture] = useState<FieldConditions>(createDefaultFieldConditions());
  const [arrival, setArrival] = useState<FieldConditions>(createDefaultFieldConditions());
  const [towKg, setTowKg] = useState(0);
  const [lwKg, setLwKg] = useState(0);
  const [distanceUnit, setDistanceUnit] = useState<'metric' | 'imperial'>('metric');
  const [editing, setEditing] = useState<EditingTarget | null>(null);
  const [tempValue, setTempValue] = useState('');
  const loadedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      loadedRef.current = false;

      const saved = await loadPerformanceConfig(aircraft.registration);
      if (saved) {
        setSameField(saved.sameField);
        setDeparture({ ...createDefaultFieldConditions(), ...saved.departure });
        setArrival({ ...createDefaultFieldConditions(), ...saved.arrival });
      } else {
        setSameField(true);
        setDeparture(createDefaultFieldConditions());
        setArrival(createDefaultFieldConditions());
      }

      const wb = await loadAircraftConfig(aircraft.registration);
      if (wb) {
        const stationTotal = Object.values(wb.stationWeights).reduce((sum, w) => sum + w, 0);
        const tow = aircraft.emptyWeight + stationTotal + wb.fuelVolume * aircraft.fuelDensity;
        const lw = tow - wb.fuelBurn * aircraft.fuelDensity;
        setTowKg(Math.round(tow));
        setLwKg(Math.round(lw));
      } else {
        setTowKg(aircraft.maxTakeoffWeight);
        setLwKg(aircraft.maxLandingWeight || aircraft.maxTakeoffWeight);
      }

      loadedRef.current = true;
    };

    load();
  }, [aircraft.registration]);

  useEffect(() => {
    if (!loadedRef.current) return;
    savePerformanceConfig({
      registration: aircraft.registration,
      sameField,
      departure,
      arrival,
      lastUpdated: Date.now(),
    });
  }, [sameField, departure, arrival, aircraft.registration]);

  const landingField = sameField ? departure : arrival;

  const takeoffResult = useMemo<PhasePerformance | null>(() => {
    if (!aircraft.performance) return null;
    return calculatePerformance(aircraft.performance, {
      phase: 'takeoff',
      weightKg: towKg,
      field: departure,
    });
  }, [aircraft, departure, towKg]);

  const landingResult = useMemo<PhasePerformance | null>(() => {
    if (!aircraft.performance) return null;
    return calculatePerformance(aircraft.performance, {
      phase: 'landing',
      weightKg: lwKg,
      field: landingField,
    });
  }, [aircraft, landingField, lwKg]);

  const updateConditions = (scope: 'departure' | 'arrival', patch: Partial<FieldConditions>) => {
    if (scope === 'departure') {
      setDeparture(prev => ({ ...prev, ...patch }));
    } else {
      setArrival(prev => ({ ...prev, ...patch }));
    }
  };

  const openEditor = (target: EditingTarget) => {
    let value = 0;
    if (target.scope === 'weights') {
      value = target.prop === 'tow' ? towKg : lwKg;
    } else {
      const conditions = target.scope === 'departure' ? departure : arrival;
      value = (conditions as any)[target.prop];
    }
    setEditing(target);
    setTempValue(value.toString());
  };

  const saveEditing = () => {
    if (editing) {
      const value = parseFloat(tempValue);
      if (!isNaN(value)) {
        const clamped = Math.min(Math.max(value, editing.min), editing.max);
        if (editing.scope === 'weights') {
          if (editing.prop === 'tow') setTowKg(clamped);
          else setLwKg(clamped);
        } else {
          updateConditions(editing.scope, { [editing.prop]: clamped } as Partial<FieldConditions>);
        }
      }
    }
    setEditing(null);
    setTempValue('');
  };

  const displayDistance = (meters: number, decimals: number = 0): string => {
    return distanceUnit === 'metric'
      ? `${meters.toFixed(decimals)} m`
      : `${metersToFeet(meters).toFixed(decimals)} ft`;
  };

  const displayMargin = (meters: number): string => {
    const sign = meters >= 0 ? '+' : '';
    return distanceUnit === 'metric'
      ? `${sign}${meters.toFixed(0)} m`
      : `${sign}${metersToFeet(meters).toFixed(0)} ft`;
  };

  const displayWind = (kts: number): string => {
    if (kts > 0) return `${kts} kt HW`;
    if (kts < 0) return `${-kts} kt TW`;
    return 'Calm';
  };

  const displaySlope = (slope: number): string => {
    if (slope > 0) return `+${slope.toFixed(1)}% up`;
    if (slope < 0) return `${slope.toFixed(1)}% down`;
    return 'Level';
  };

  const renderChip = (
    label: string,
    selected: boolean,
    onPress: () => void,
    danger: boolean = false
  ) => (
    <TouchableOpacity
      key={label}
      style={[
        styles.chip,
        selected && (danger ? styles.chipDanger : styles.chipSelected),
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderToggleRow = (
    label: string,
    value: boolean,
    onToggle: () => void
  ) => (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.toggleChip, value ? styles.toggleOn : styles.toggleOff]}
        onPress={onToggle}
      >
        <Text style={[styles.toggleText, value ? styles.toggleTextOn : styles.toggleTextOff]}>
          {value ? 'YES' : 'NO'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFieldSection = (
    scope: 'departure' | 'arrival',
    title: string,
    runwayLabel: string,
    isTakeoff: boolean
  ) => {
    const conditions = scope === 'departure' ? departure : arrival;
    const prefix = scope === 'departure' ? 'dep' : 'arr';
    const grassOptions = isTakeoff ? TAKEOFF_GRASS_OPTIONS : LANDING_GRASS_OPTIONS;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>

        <View style={styles.inputCard}>
          <TouchableOpacity
            style={styles.editRow}
            onPress={() =>
              openEditor({
                scope,
                prop: 'elevationFt',
                label: 'Field Elevation',
                unit: 'ft',
                min: -1000,
                max: 15000,
              })
            }
          >
            <Text style={styles.editLabel}>Elevation</Text>
            <Text style={styles.editValue}>{conditions.elevationFt.toFixed(0)} ft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editRow}
            onPress={() =>
              openEditor({
                scope,
                prop: 'qnhHpa',
                label: 'QNH',
                unit: 'hPa',
                min: 950,
                max: 1050,
              })
            }
          >
            <Text style={styles.editLabel}>QNH</Text>
            <Text style={styles.editValue}>{conditions.qnhHpa.toFixed(0)} hPa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editRow}
            onPress={() =>
              openEditor({
                scope,
                prop: 'oatC',
                label: 'Outside Air Temperature',
                unit: '°C',
                min: -40,
                max: 60,
              })
            }
          >
            <Text style={styles.editLabel}>OAT</Text>
            <Text style={styles.editValue}>{conditions.oatC.toFixed(0)} °C</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editRow}
            onPress={() =>
              openEditor({
                scope,
                prop: 'windKts',
                label: 'Wind Component (+head / -tail)',
                unit: 'kt',
                min: -50,
                max: 50,
              })
            }
          >
            <Text style={styles.editLabel}>Wind</Text>
            <Text style={styles.editValue}>{displayWind(conditions.windKts)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editRow}
            onPress={() =>
              openEditor({
                scope,
                prop: 'slopePercent',
                label: 'Runway Slope (+up / -down)',
                unit: '%',
                min: -10,
                max: 10,
              })
            }
          >
            <Text style={styles.editLabel}>Slope</Text>
            <Text style={styles.editValue}>{displaySlope(conditions.slopePercent)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editRow}
            onPress={() =>
              openEditor({
                scope,
                prop: 'runwayLengthM',
                label: runwayLabel,
                unit: 'm',
                min: 0,
                max: 5000,
              })
            }
          >
            <Text style={styles.editLabel}>{runwayLabel}</Text>
            <Text style={styles.editValue}>{displayDistance(conditions.runwayLengthM)}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.choiceLabel}>Surface</Text>
          <View style={styles.chipRow}>
            {renderChip('Paved', conditions.surface === 'paved', () =>
              updateConditions(scope, { surface: 'paved' })
            )}
            {renderChip('Grass', conditions.surface === 'grass', () =>
              updateConditions(scope, { surface: 'grass' })
            )}
          </View>

          {conditions.surface === 'paved' && (
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Runway wet</Text>
              <TouchableOpacity
                style={[
                  styles.toggleChip,
                  conditions.pavedWet ? styles.toggleOn : styles.toggleOff,
                ]}
                onPress={() => updateConditions(scope, { pavedWet: !conditions.pavedWet })}
              >
                <Text
                  style={[
                    styles.toggleText,
                    conditions.pavedWet ? styles.toggleTextOn : styles.toggleTextOff,
                  ]}
                >
                  {conditions.pavedWet ? 'YES' : 'NO'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {conditions.surface === 'grass' && (
            <>
              <Text style={styles.choiceLabel}>Grass Condition</Text>
              <View style={styles.chipRow}>
                {grassOptions.map(option =>
                  renderChip(
                    option.label,
                    conditions.grassCondition === option.value,
                    () => updateConditions(scope, { grassCondition: option.value }),
                    option.value === 'too-high'
                  )
                )}
              </View>
            </>
          )}

          {renderToggleRow('Soft ground', conditions.softGround, () =>
            updateConditions(scope, { softGround: !conditions.softGround })
          )}

          {isTakeoff &&
            renderToggleRow('Wheel fairings installed', conditions.wheelFairings, () =>
              updateConditions(scope, { wheelFairings: !conditions.wheelFairings })
            )}
        </View>
      </View>
    );
  };

  const statusLabel = (status: PerformanceStatus, margin: number): string => {
    if (status === 'unsafe') return '✕ NO-GO';
    if (status === 'caution') return '⚠️ MARGINAL';
    return `✓ GO  ${displayMargin(margin)}`;
  };

  const renderResultCard = (result: PhasePerformance, title: string, isTakeoff: boolean) => {
    const statusStyle =
      result.status === 'unsafe'
        ? styles.statusError
        : result.status === 'caution'
        ? styles.statusWarning
        : styles.statusSuccess;
    const statusColor =
      result.status === 'unsafe'
        ? colors.error
        : result.status === 'caution'
        ? colors.warning
        : colors.success;

    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{title}</Text>
          <Text style={styles.resultConditions}>{result.speeds.map(s => `${s.label} ${s.kias} kt`).join(' / ')} IAS</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>PA / DA</Text>
          <Text style={styles.resultValue}>
            {result.pressureAltitudeFt.toFixed(0)} ft / {result.densityAltitudeFt.toFixed(0)} ft
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>AFM Ground Roll</Text>
          <Text style={styles.resultValue}>{displayDistance(result.referenceGroundRollM)}</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>
            {isTakeoff ? 'AFM Distance over 50 ft' : 'AFM Total Landing Distance'}
          </Text>
          <Text style={styles.resultValue}>{displayDistance(result.referenceDistanceM)}</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Corrected Ground Roll</Text>
          <Text style={styles.resultValue}>{displayDistance(result.correctedGroundRollM)}</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>
            {isTakeoff ? 'Corrected Distance over 50 ft' : 'Corrected Landing Distance'}
          </Text>
          <Text style={styles.resultValue}>{displayDistance(result.correctedDistanceM)}</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>
            Factored (×{isTakeoff ? '1.25' : '1.43'})
          </Text>
          <Text style={styles.resultValueBold}>{displayDistance(result.factoredDistanceM)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.statusBadge, statusStyle]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel(result.status, result.marginM)}
          </Text>
        </View>

        {result.notes.length > 0 && (
          <View style={styles.notesBox}>
            {result.notes.map((note, index) => (
              <Text key={index} style={styles.noteText}>
                • {note}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const hasPerformance = !!aircraft.performance;
  const perf = aircraft.performance;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.registration}>{aircraft.registration}</Text>
            <Text style={styles.model}>Performance</Text>
          </View>
          <TouchableOpacity
            onPress={() => setDistanceUnit(prev => (prev === 'metric' ? 'imperial' : 'metric'))}
            style={styles.unitToggle}
          >
            <Text style={styles.unitToggleText}>{distanceUnit === 'metric' ? 'm' : 'ft'}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {!hasPerformance && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              No performance data available for this aircraft model
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sameFieldCard}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Same field for departure and arrival</Text>
              <TouchableOpacity
                style={[styles.toggleChip, sameField ? styles.toggleOn : styles.toggleOff]}
                onPress={() => setSameField(prev => !prev)}
              >
                <Text style={[styles.toggleText, sameField ? styles.toggleTextOn : styles.toggleTextOff]}>
                  {sameField ? 'YES' : 'NO'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {renderFieldSection('departure', 'Departure', 'Runway Length (TORA)', true)}

        {!sameField && renderFieldSection('arrival', 'Arrival', 'Runway Length (LDA)', false)}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weights</Text>
          <View style={styles.inputCard}>
            <TouchableOpacity
              style={styles.editRow}
              onPress={() =>
                openEditor({
                  scope: 'weights',
                  prop: 'tow',
                  label: 'Takeoff Weight',
                  unit: 'kg',
                  min: 0,
                  max: aircraft.maxTakeoffWeight,
                })
              }
            >
              <Text style={styles.editLabel}>Takeoff Weight</Text>
              <Text style={styles.editValue}>{towKg.toFixed(0)} kg</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editRow}
              onPress={() =>
                openEditor({
                  scope: 'weights',
                  prop: 'lw',
                  label: 'Landing Weight',
                  unit: 'kg',
                  min: 0,
                  max: aircraft.maxLandingWeight || aircraft.maxTakeoffWeight,
                })
              }
            >
              <Text style={styles.editLabel}>Landing Weight</Text>
              <Text style={styles.editValue}>{lwKg.toFixed(0)} kg</Text>
            </TouchableOpacity>

            <Text style={styles.hintText}>Defaults from Weight & Balance - tap to adjust</Text>
          </View>
        </View>

        {hasPerformance && takeoffResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Results</Text>
            {renderResultCard(takeoffResult, 'Take-off', true)}
            {landingResult && renderResultCard(landingResult, 'Landing', false)}
          </View>
        )}

        {hasPerformance && perf && (
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>AFM Reference Conditions</Text>
              <Text style={styles.infoText}>Take-off: {perf.takeoff.conditions}</Text>
              <Text style={styles.infoText}>Landing: {perf.landing.conditions}</Text>
              <Text style={styles.infoTitle}>Cautions</Text>
              {[...perf.takeoff.cautions, ...perf.landing.cautions].map((caution, index) => (
                <Text key={index} style={styles.infoText}>
                  • {caution}
                </Text>
              ))}
              <Text style={styles.infoSource}>{perf.source}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditing(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing?.label}</Text>
            <TextInput
              style={styles.modalInput}
              value={tempValue}
              onChangeText={setTempValue}
              keyboardType="numbers-and-punctuation"
              autoFocus
              selectTextOnFocus
            />
            <Text style={styles.modalHint}>
              {editing?.unit}
              {editing?.prop === 'windKts' ? ' (negative = tailwind)' : ''}
              {editing?.prop === 'slopePercent' ? ' (negative = downhill)' : ''}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditing(null)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveEditing}
              >
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  registration: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  model: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  unitToggle: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unitToggleText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  inputCard: {
    backgroundColor: colors.cardBackground,
    padding: 18,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  sameFieldCard: {
    backgroundColor: colors.cardBackground,
    padding: 18,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  editLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  editValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 14,
  },
  choiceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipDanger: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  chipText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  toggleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  toggleOn: {
    backgroundColor: colors.primary,
  },
  toggleOff: {
    backgroundColor: colors.gray200,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleTextOn: {
    color: colors.white,
  },
  toggleTextOff: {
    color: colors.textSecondary,
  },
  hintText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
  },
  resultCard: {
    backgroundColor: colors.cardBackground,
    padding: 24,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray100,
    marginBottom: 16,
  },
  resultHeader: {
    marginBottom: 14,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resultConditions: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  resultValue: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  resultValueBold: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
  },
  statusBadge: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  statusSuccess: {
    backgroundColor: '#E8F8F5',
    borderColor: colors.success,
  },
  statusWarning: {
    backgroundColor: '#FFF3E0',
    borderColor: colors.warning,
  },
  statusError: {
    backgroundColor: '#FCE8E8',
    borderColor: colors.error,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  notesBox: {
    backgroundColor: colors.gray50,
    padding: 14,
    borderRadius: 10,
    marginTop: 14,
  },
  noteText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 18,
    borderRadius: 12,
    marginTop: 24,
    marginHorizontal: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningText: {
    fontSize: 15,
    color: '#E65100',
    fontWeight: '700',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 4,
  },
  infoSource: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 10,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#E0E0E0',
  },
  modalButtonSave: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalButtonTextSave: {
    color: '#fff',
  },
});
