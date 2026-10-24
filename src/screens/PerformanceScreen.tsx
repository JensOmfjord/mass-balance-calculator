import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  GestureResponderEvent,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../components/PressableScale';
import { ValueEditSheet, EditAnchor } from '../components/ValueEditSheet';
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
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout, list } from '../theme/spacing';
import { useDeviceType } from '../utils/useDeviceType';
import { hapticTap, hapticSuccess, hapticWarning, hapticError } from '../utils/haptics';
type PerformanceScreenProps = NativeStackScreenProps<RootStackParamList, 'Performance'>;

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

export const PerformanceScreen: React.FC<PerformanceScreenProps> = ({ route }) => {
  const aircraft: AircraftConfig = route.params.aircraft;
  const insets = useSafeAreaInsets();
  const { isTablet, isWide } = useDeviceType();

  const [sameField, setSameField] = useState(true);
  const [departure, setDeparture] = useState<FieldConditions>(createDefaultFieldConditions());
  const [arrival, setArrival] = useState<FieldConditions>(createDefaultFieldConditions());
  const [towKg, setTowKg] = useState(0);
  const [lwKg, setLwKg] = useState(0);
  const [distanceUnit, setDistanceUnit] = useState<'metric' | 'imperial'>('metric');
  const [editing, setEditing] = useState<EditingTarget | null>(null);
  const [editAnchor, setEditAnchor] = useState<EditAnchor | null>(null);
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

  // Haptic feedback on Go / No-Go status transitions
  const overallStatus =
    takeoffResult?.status === 'unsafe' || landingResult?.status === 'unsafe'
      ? 'unsafe'
      : takeoffResult?.status === 'caution' || landingResult?.status === 'caution'
      ? 'caution'
      : takeoffResult && landingResult
      ? 'ok'
      : null;

  useEffect(() => {
    if (!overallStatus) return;
    if (overallStatus === 'unsafe') hapticError();
    else if (overallStatus === 'caution') hapticWarning();
    else hapticSuccess();
    // Fire only when the overall verdict changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overallStatus]);

  const updateConditions = (scope: 'departure' | 'arrival', patch: Partial<FieldConditions>) => {
    hapticTap();
    if (scope === 'departure') {
      setDeparture(prev => ({ ...prev, ...patch }));
    } else {
      setArrival(prev => ({ ...prev, ...patch }));
    }
  };

  const openEditor = (target: EditingTarget) => {
    hapticTap();
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

  // Capture the pressed row's position so the editor presents as an
  // anchored popover on iPad.
  const openEditorAt = (event: GestureResponderEvent, target: EditingTarget) => {
    event.currentTarget.measureInWindow((px, py, pw, ph) => {
      setEditAnchor({ x: px + pw / 2, y: py + ph });
      openEditor(target);
    });
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
    <PressableScale
      key={label}
      style={[styles.chip, selected && (danger ? styles.chipDanger : styles.chipSelected)]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </PressableScale>
  );

  const renderToggleRow = (label: string, value: boolean, onToggle: () => void) => (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={() => {
          hapticTap();
          onToggle();
        }}
        trackColor={{ false: colors.fill, true: colors.primary }}
        thumbTintColor={colors.white}
      />
    </View>
  );

  const renderEditRow = (
    label: string,
    value: string,
    target: EditingTarget
  ) => (
    <PressableScale
      style={styles.editRow}
      onPress={event => openEditorAt(event, target)}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${label}`}
    >
      <Text style={styles.editLabel}>{label}</Text>
      <View style={styles.editValueContainer}>
        <Text style={styles.editValue}>{value}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </PressableScale>
  );

  const renderFieldSection = (
    scope: 'departure' | 'arrival',
    title: string,
    runwayLabel: string,
    isTakeoff: boolean
  ) => {
    const conditions = scope === 'departure' ? departure : arrival;
    const grassOptions = isTakeoff ? TAKEOFF_GRASS_OPTIONS : LANDING_GRASS_OPTIONS;

    return (
      <>
        <Text style={styles.sectionHeader}>{title}</Text>
        <View style={styles.section}>
          <View style={styles.inputCard}>
            {renderEditRow('Elevation', `${conditions.elevationFt.toFixed(0)} ft`, {
              scope,
              prop: 'elevationFt',
              label: 'Field Elevation',
              unit: 'ft',
              min: -1000,
              max: 15000,
            })}

            {renderEditRow('QNH', `${conditions.qnhHpa.toFixed(0)} hPa`, {
              scope,
              prop: 'qnhHpa',
              label: 'QNH',
              unit: 'hPa',
              min: 950,
              max: 1050,
            })}

            {renderEditRow('OAT', `${conditions.oatC.toFixed(0)} °C`, {
              scope,
              prop: 'oatC',
              label: 'Outside Air Temperature',
              unit: '°C',
              min: -40,
              max: 60,
            })}

            {renderEditRow('Wind', displayWind(conditions.windKts), {
              scope,
              prop: 'windKts',
              label: 'Wind Component (+head / -tail)',
              unit: 'kt',
              min: -50,
              max: 50,
            })}

            {renderEditRow('Slope', displaySlope(conditions.slopePercent), {
              scope,
              prop: 'slopePercent',
              label: 'Runway Slope (+up / -down)',
              unit: '%',
              min: -10,
              max: 10,
            })}

            {renderEditRow(runwayLabel, displayDistance(conditions.runwayLengthM), {
              scope,
              prop: 'runwayLengthM',
              label: runwayLabel,
              unit: 'm',
              min: 0,
              max: 5000,
            })}

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
                <Switch
                  value={conditions.pavedWet}
                  onValueChange={() =>
                    updateConditions(scope, { pavedWet: !conditions.pavedWet })
                  }
                  trackColor={{ false: colors.fill, true: colors.primary }}
                  thumbTintColor={colors.white}
                />
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
      </>
    );
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
          <Text style={styles.resultConditions}>
            {result.speeds.map(s => `${s.label} ${s.kias} kt`).join(' / ')} IAS
          </Text>
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
            {result.status === 'unsafe'
              ? 'No-Go'
              : result.status === 'caution'
              ? `Marginal  ${displayMargin(result.marginM)}`
              : `Go  ${displayMargin(result.marginM)}`}
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

  // Layout sections — composed as a single column (phones / narrow windows)
  // or two columns (wide tablets).
  const weightsSection = (
    <>
      <Text style={styles.sectionHeader}>Weights</Text>
      <View style={styles.section}>
        <View style={styles.inputCard}>
          {renderEditRow('Takeoff Weight', `${towKg.toFixed(0)} kg`, {
            scope: 'weights',
            prop: 'tow',
            label: 'Takeoff Weight',
            unit: 'kg',
            min: 0,
            max: aircraft.maxTakeoffWeight,
          })}

          {renderEditRow('Landing Weight', `${lwKg.toFixed(0)} kg`, {
            scope: 'weights',
            prop: 'lw',
            label: 'Landing Weight',
            unit: 'kg',
            min: 0,
            max: aircraft.maxLandingWeight || aircraft.maxTakeoffWeight,
          })}

          <Text style={styles.hintText}>Defaults from Weight & Balance — tap to adjust</Text>
        </View>
      </View>
    </>
  );

  const resultsSection = hasPerformance && takeoffResult ? (
    <>
      <Text style={styles.sectionHeader}>Results</Text>
      <View style={isWide ? [styles.section, styles.columns, styles.resultsRow] : styles.section}>
        <View style={isWide ? styles.resultColumn : undefined}>
          {renderResultCard(takeoffResult, 'Take-off', true)}
        </View>
        {landingResult && (
          <View style={isWide ? styles.resultColumn : undefined}>
            {renderResultCard(landingResult, 'Landing', false)}
          </View>
        )}
      </View>
    </>
  ) : null;

  const afmSection =
    hasPerformance && perf ? (
      <>
        <Text style={styles.sectionHeader}>AFM Reference</Text>
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Take-off conditions</Text>
            <Text style={styles.infoText}>{perf.takeoff.conditions}</Text>
            <Text style={styles.infoTitle}>Landing conditions</Text>
            <Text style={styles.infoText}>{perf.landing.conditions}</Text>
            <Text style={styles.infoTitle}>Cautions</Text>
            {[...perf.takeoff.cautions, ...perf.landing.cautions].map((caution, index) => (
              <Text key={index} style={styles.infoText}>
                • {caution}
              </Text>
            ))}
            <Text style={styles.infoSource}>{perf.source}</Text>
          </View>
        </View>
      </>
    ) : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[isTablet && styles.scrollContentTablet]}
      >        {!hasPerformance && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              No performance data available for this aircraft model
            </Text>
          </View>
        )}

        <View style={[styles.section, styles.sameFieldCard]}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Same field for departure and arrival</Text>
            <Switch
              value={sameField}
              onValueChange={() => {
                hapticTap();
                setSameField(prev => !prev);
              }}
              trackColor={{ false: colors.fill, true: colors.primary }}
              thumbTintColor={colors.white}
            />
          </View>
        </View>

        {isWide ? (
          <>
            {sameField ? (
              renderFieldSection('departure', 'Departure', 'Runway Length (TORA)', true)
            ) : (
              <View style={styles.columns}>
                <View style={styles.column}>
                  {renderFieldSection('departure', 'Departure', 'Runway Length (TORA)', true)}
                </View>
                <View style={styles.column}>
                  {renderFieldSection('arrival', 'Arrival', 'Runway Length (LDA)', false)}
                </View>
              </View>
            )}

            {weightsSection}

            {resultsSection}

            {afmSection}
          </>
        ) : (
          <>
            {renderFieldSection('departure', 'Departure', 'Runway Length (TORA)', true)}

            {!sameField && renderFieldSection('arrival', 'Arrival', 'Runway Length (LDA)', false)}

            {weightsSection}

            {resultsSection}

            {afmSection}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom action bar — oval pill, iOS settings search-bar style */}
      <View style={[styles.toolbarOuter, { paddingBottom: 10 + insets.bottom }]}>
        <View style={styles.toolbar}>
          <PressableScale
            style={styles.toolbarButton}
            onPress={() => {
              hapticTap();
              setDistanceUnit(prev => (prev === 'metric' ? 'imperial' : 'metric'));
            }}
            accessibilityRole="button"
            accessibilityLabel="Toggle distance units"
          >
            <Text style={styles.toolbarButtonText} numberOfLines={1}>
              {distanceUnit === 'metric' ? 'Meters' : 'Feet'}
            </Text>
          </PressableScale>
        </View>
      </View>

      <ValueEditSheet
        visible={editing !== null}
        title={editing?.label || ''}
        value={tempValue}
        onChangeText={setTempValue}
        keyboardType="numbers-and-punctuation"
        anchor={editing ? editAnchor : null}
        hint={
          editing
            ? `${editing.unit}${
                editing.prop === 'windKts' ? ' (negative = tailwind)' : ''
              }${editing.prop === 'slopePercent' ? ' (negative = downhill)' : ''}`
            : undefined
        }
        onCancel={() => {
          setEditing(null);
          setTempValue('');
        }}
        onSave={saveEditing}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentTablet: {
    width: '100%',
    paddingHorizontal: 24,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
  resultColumn: {
    width: '48.5%',
    overflow: 'hidden',
  },
  resultsRow: {
    justifyContent: 'space-between',
  },
  section: {
    paddingHorizontal: list.insetHorizontal,
    marginBottom: list.cardGap,
  },
  sectionHeader: {
    ...typography.footnote,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: list.insetHorizontal + list.cardGap,
    paddingTop: list.section,
    paddingBottom: 8,
  },
  inputCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    padding: list.xl,
    marginBottom: list.cardGap,
    borderRadius: list.cardRadius,
  },
  sameFieldCard: {
    paddingTop: list.cardGap,
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  editLabel: {
    ...typography.callout,
    color: colors.textPrimary,
  },
  editValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editValue: {
    ...typography.value,
    color: colors.textSecondary,
  },
  chevron: {
    ...typography.title3,
    color: colors.gray300,
    marginLeft: 8,
    fontWeight: '400',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginVertical: 12,
  },
  choiceLabel: {
    ...typography.footnote,
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
    borderRadius: 16,
    backgroundColor: colors.fill,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipDanger: {
    backgroundColor: colors.errorFill,
  },
  chipText: {
    ...typography.subhead,
    color: colors.primary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    ...typography.callout,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: 12,
  },
  hintText: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: 10,
  },
  resultCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    padding: list.xl,
    borderRadius: list.cardRadius,
    marginBottom: list.cardGap,
  },
  resultHeader: {
    marginBottom: 12,
  },
  resultTitle: {
    ...typography.title2,
    color: colors.textPrimary,
  },
  resultConditions: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginTop: 4,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  resultLabel: {
    ...typography.subhead,
    color: colors.textSecondary,
    flex: 1,
  },
  resultValue: {
    ...typography.value,
    color: colors.textPrimary,
  },
  resultValueBold: {
    ...typography.value,
    color: colors.primary,
  },
  statusBadge: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusSuccess: {
    backgroundColor: colors.successFill,
  },
  statusWarning: {
    backgroundColor: colors.warningFill,
  },
  statusError: {
    backgroundColor: colors.errorFill,
  },
  statusText: {
    ...typography.headline,
  },
  notesBox: {
    backgroundColor: colors.fill,
    padding: 14,
    borderRadius: 10,
    marginTop: 14,
  },
  noteText: {
    ...typography.footnote,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  warningBox: {
    backgroundColor: colors.errorFill,
    padding: list.xl,
    borderRadius: list.cardRadius,
    marginTop: list.cardGap,
    marginHorizontal: list.insetHorizontal,
  },
  warningText: {
    ...typography.subhead,
    color: colors.error,
    fontWeight: '600',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    padding: list.xl,
    borderRadius: list.cardRadius,
  },
  infoTitle: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 8,
  },
  infoText: {
    ...typography.footnote,
    color: colors.textPrimary,
    lineHeight: 19,
    marginBottom: 4,
  },
  infoSource: {
    ...typography.caption1,
    color: colors.textLight,
    marginTop: 10,
    fontStyle: 'italic',
  },
  toolbarOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: list.insetHorizontal,
    paddingTop: 8,
  },
  toolbar: {
    backgroundColor: colors.gray200,
    borderRadius: 26,
    padding: 4,
    maxWidth: layout.toolbarMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  toolbarButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 22,
  },
  toolbarButtonText: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  headerInfoButton: {
    ...typography.title3,
    fontWeight: '600',
    color: colors.primary,
  },
  bottomPadding: {
    height: 110,
  },
});
