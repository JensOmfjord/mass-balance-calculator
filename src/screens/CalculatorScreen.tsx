import React, { useState, useEffect } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CGEnvelopeChart } from '../components/CGEnvelopeChart';
import { PressableScale } from '../components/PressableScale';
import { ValueEditSheet } from '../components/ValueEditSheet';
import { AircraftConfig } from '../models/Aircraft';
import { MassBalanceResult } from '../models/MassBalanceResult';
import { RootStackParamList } from '../navigation/types';
import { saveAircraftConfig, loadAircraftConfig } from '../services/aircraftStorage';
import { calculateMassBalance } from '../services/massBalanceCalculator';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { list } from '../theme/spacing';
import { inchesToMeters, kgToLbs, litersToGallons, metersToInches } from '../utils/units';
import { hapticTap, hapticSuccess, hapticError } from '../utils/haptics';

// Enable layout animations on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CalculatorScreenProps = NativeStackScreenProps<RootStackParamList, 'Calculator'>;

type EditTarget =
  | { kind: 'station'; stationId: string; title: string; max: number }
  | { kind: 'fuel'; title: string; max: number }
  | { kind: 'fuelBurn'; title: string; max: number };

export const CalculatorScreen: React.FC<CalculatorScreenProps> = ({ route, navigation }) => {
  const aircraft: AircraftConfig = route.params.aircraft;
  const insets = useSafeAreaInsets();

  // "i" button in the nav bar → aircraft details page
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <PressableScale
          style={styles.headerInfoButton}
          hitSlop={12}
          onPress={() => {
            hapticTap();
            navigation.navigate('Details', { aircraft });
          }}
          accessibilityRole="button"
          accessibilityLabel={`Details for ${aircraft.registration}`}
        >
          <Text style={styles.headerInfoButtonText}>i</Text>
        </PressableScale>
      ),
    });
  }, [aircraft, navigation]);

  const [stationWeights, setStationWeights] = useState<Record<string, number>>({});
  const [fuelVolume, setFuelVolume] = useState<number>(0);
  const [fuelBurn, setFuelBurn] = useState<number>(0);
  const [result, setResult] = useState<MassBalanceResult | null>(null);
  const [landingResult, setLandingResult] = useState<MassBalanceResult | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Load saved configuration on mount
  useEffect(() => {
    const loadSavedConfig = async () => {
      const savedConfig = await loadAircraftConfig(aircraft.registration);

      if (savedConfig) {
        setStationWeights(savedConfig.stationWeights);
        setFuelVolume(savedConfig.fuelVolume);
        setFuelBurn(savedConfig.fuelBurn);
      } else {
        const initialWeights: Record<string, number> = {};
        aircraft.stations.forEach(station => {
          initialWeights[station.id] = 0;
        });
        setStationWeights(initialWeights);
        setFuelVolume(0);
        setFuelBurn(0);
      }
    };

    loadSavedConfig();
  }, [aircraft.registration]);

  // Calculate whenever inputs change
  useEffect(() => {
    const fuelWeight = fuelVolume * aircraft.fuelDensity;
    const hasValues = Object.values(stationWeights).some(w => w > 0) || fuelVolume > 0;

    if (hasValues) {
      const calculationResult = calculateMassBalance(aircraft, stationWeights, fuelWeight);
      setResult(calculationResult);

      if (fuelBurn > 0 && fuelBurn <= fuelVolume) {
        const landingFuelWeight = (fuelVolume - fuelBurn) * aircraft.fuelDensity;
        const landingCalculation = calculateMassBalance(aircraft, stationWeights, landingFuelWeight);
        setLandingResult(landingCalculation);
      } else {
        setLandingResult(null);
      }
    } else {
      setResult(null);
      setLandingResult(null);
    }
  }, [stationWeights, fuelVolume, fuelBurn, aircraft]);

  // Haptic feedback on envelope status transitions
  useEffect(() => {
    if (!result) return;
    if (result.exceedsMaxWeight || !result.isWithinEnvelope) {
      hapticError();
    } else {
      hapticSuccess();
    }
    // Fire only when the overall safety verdict changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.exceedsMaxWeight, result?.isWithinEnvelope]);

  // Save configuration whenever it changes
  useEffect(() => {
    const saveConfig = async () => {
      await saveAircraftConfig({
        registration: aircraft.registration,
        stationWeights,
        fuelVolume,
        fuelBurn,
        lastUpdated: Date.now(),
      });
    };

    if (Object.keys(stationWeights).length > 0) {
      saveConfig();
    }
  }, [stationWeights, fuelVolume, fuelBurn, aircraft.registration]);

  const animateLayout = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
  };

  const handleSliderChange = (stationId: string, value: number) => {
    const roundedValue = Math.round(value);
    setStationWeights(prev => ({ ...prev, [stationId]: roundedValue }));
  };

  const handleFuelSliderChange = (value: number) => {
    setFuelVolume(Math.round(value));
  };

  const handleFuelBurnSliderChange = (value: number) => {
    setFuelBurn(Math.round(value));
  };

  const openEditor = (target: EditTarget, currentValue: number) => {
    hapticTap();
    setEditTarget(target);
    setTempValue(currentValue.toString());
  };

  const saveEditValue = () => {
    if (!editTarget) return;
    const value = parseFloat(tempValue) || 0;

    if (editTarget.kind === 'station') {
      const station = aircraft.stations.find(s => s.id === editTarget.stationId);
      const maxValue = station?.maxWeight || 200;
      setStationWeights(prev => ({
        ...prev,
        [editTarget.stationId]: Math.min(Math.max(0, value), maxValue),
      }));
    } else if (editTarget.kind === 'fuel') {
      setFuelVolume(Math.min(Math.max(0, value), aircraft.fuelCapacity));
    } else {
      setFuelBurn(Math.min(Math.max(0, value), fuelVolume));
    }

    setEditTarget(null);
    setTempValue('');
  };

  const clearAll = () => {
    hapticTap();
    animateLayout();
    const cleared: Record<string, number> = {};
    aircraft.stations.forEach(station => {
      cleared[station.id] = 0;
    });
    setStationWeights(cleared);
    setFuelVolume(0);
    setFuelBurn(0);
    setResult(null);
    setLandingResult(null);
  };

  // Destructive actions confirm first — clear only happens on explicit confirmation
  const confirmClear = () => {
    const hasValues =
      Object.values(stationWeights).some(w => w > 0) || fuelVolume > 0 || fuelBurn > 0;
    if (!hasValues) {
      clearAll();
      return;
    }
    Alert.alert('Clear All Values?', 'This resets all weights and fuel to zero for this aircraft.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearAll },
    ]);
  };

  const getSliderColor = (value: number, max: number) => {
    if (value === 0) return colors.gray300;
    if (value > max) return colors.error;
    if (value > max * 0.9) return colors.warning;
    return colors.success;
  };

  // Unit conversion display helpers
  const displayWeight = (kg: number, decimals: number = 1): string => {
    return unitSystem === 'metric' ? kg.toFixed(decimals) : kgToLbs(kg).toFixed(decimals);
  };

  const displayVolume = (liters: number, decimals: number = 1): string => {
    return unitSystem === 'metric' ? liters.toFixed(decimals) : litersToGallons(liters).toFixed(decimals);
  };

  const displayDistance = (meters: number, decimals: number = 3): string => {
    return unitSystem === 'metric' ? meters.toFixed(decimals) : metersToInches(meters).toFixed(decimals);
  };

  const weightUnit = unitSystem === 'metric' ? 'kg' : 'lbs';
  const volumeUnit = unitSystem === 'metric' ? 'L' : 'gal';
  const distanceUnit = unitSystem === 'metric' ? 'm' : 'in';

  const toggleUnitSystem = () => {
    hapticTap();
    setUnitSystem(prev => (prev === 'metric' ? 'imperial' : 'metric'));
  };

  const editHint =
    editTarget?.kind === 'fuelBurn'
      ? `${volumeUnit} (max ${fuelVolume})`
      : undefined;

  // Slider row: label + slider + tappable value chip
  const renderSliderRow = (
    label: string,
    subtext: string,
    value: number,
    max: number,
    displayText: string,
    unit: string,
    onValueChange: (value: number) => void,
    editSheet: EditTarget,
    disabled: boolean = false
  ) => {
    const sliderColor = getSliderColor(value, max);

    return (
      <View style={styles.inputCard}>
        <View style={styles.labelContainer}>
          <Text style={styles.inputLabelText}>{label}</Text>
          <Text style={styles.inputLabelSubtext}>{subtext}</Text>
        </View>

        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={max}
            value={value}
            onValueChange={onValueChange}
            minimumTrackTintColor={sliderColor}
            maximumTrackTintColor={colors.fill}
            thumbTintColor={sliderColor}
            step={1}
            disabled={disabled}
          />
          <PressableScale
            style={[styles.valueDisplay, { opacity: disabled ? 0.5 : 1 }]}
            onPress={disabled ? undefined : () => openEditor(editSheet, value)}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${label}`}
          >
            <Text style={[styles.valueText, { color: sliderColor }]}>{displayText}</Text>
            <Text style={styles.unitText}>{unit}</Text>
          </PressableScale>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* CG Envelope Chart */}
        <CGEnvelopeChart
          aircraft={aircraft}
          currentWeight={result?.totalWeight || 0}
          currentCG={result?.cgPosition || 0}
          isWithinEnvelope={result ? result.isWithinEnvelope : true}
          landingWeight={landingResult?.totalWeight}
          landingCG={landingResult?.cgPosition}
          landingIsWithinEnvelope={landingResult ? landingResult.isWithinEnvelope : true}
        />

        {/* Station Inputs */}
        <Text style={styles.sectionTitle}>Weight & Balance</Text>
        <View style={styles.section}>
          {aircraft.stations.map(station => {
            const value = stationWeights[station.id] || 0;
            return renderSliderRow(
              station.name,
              `Max: ${displayWeight(station.maxWeight, 0)} ${weightUnit}`,
              value,
              station.maxWeight,
              displayWeight(value, 0),
              weightUnit,
              val => handleSliderChange(station.id, val),
              {
                kind: 'station',
                stationId: station.id,
                title: station.name,
                max: station.maxWeight,
              }
            );
          })}

          {renderSliderRow(
            'Fuel',
            `Max: ${displayVolume(aircraft.fuelCapacity, 0)} ${volumeUnit} (${displayWeight(aircraft.fuelCapacity * aircraft.fuelDensity)} ${weightUnit})`,
            fuelVolume,
            aircraft.fuelCapacity,
            displayVolume(fuelVolume, 0),
            volumeUnit,
            handleFuelSliderChange,
            { kind: 'fuel', title: 'Fuel Volume', max: aircraft.fuelCapacity }
          )}
        </View>

        {/* Fuel Burn */}
        <Text style={styles.sectionTitle}>Estimated Fuel Burn</Text>
        <View style={styles.section}>
          {renderSliderRow(
            'Fuel to Burn',
            `Max: ${fuelVolume > 0 ? displayVolume(fuelVolume, 0) : 0} ${volumeUnit} (${fuelVolume > 0 ? displayWeight(fuelVolume * aircraft.fuelDensity) : '0.0'} ${weightUnit})`,
            fuelBurn,
            fuelVolume > 0 ? fuelVolume : 100,
            displayVolume(fuelBurn, 0),
            volumeUnit,
            handleFuelBurnSliderChange,
            { kind: 'fuelBurn', title: 'Fuel Burn', max: fuelVolume },
            fuelVolume === 0
          )}
        </View>

        {/* Results */}
        {result && (
          <>
            <Text style={styles.sectionTitle}>Takeoff Configuration</Text>
            <View style={styles.section}>
              {renderResultCard(
                [
                  ['Total Weight', `${displayWeight(result.totalWeight)} ${weightUnit}`],
                  ['CG Position', `${displayDistance(inchesToMeters(result.cgPosition))} ${distanceUnit}`],
                  ['Max Takeoff Weight', `${displayWeight(aircraft.maxTakeoffWeight, 0)} ${weightUnit}`],
                ],
                [
                  [!result.exceedsMaxWeight, 'Weight OK', 'Overweight'],
                  [result.isWithinEnvelope, 'CG OK', 'CG Out of Limits'],
                ],
                'Aircraft is not safe to fly in this configuration'
              )}

              {/* Landing Configuration */}
              {landingResult && (
                <>
                  <Text style={styles.sectionTitle}>Landing Configuration</Text>
                  {renderResultCard(
                    [
                      ['Fuel Burned', `${displayVolume(fuelBurn, 0)} ${volumeUnit} (${displayWeight(fuelBurn * aircraft.fuelDensity)} ${weightUnit})`],
                      ['Landing Weight', `${displayWeight(landingResult.totalWeight)} ${weightUnit}`],
                      ['Max Landing Weight', `${displayWeight(aircraft.maxLandingWeight || aircraft.maxTakeoffWeight, 0)} ${weightUnit}`],
                      ['Landing CG', `${displayDistance(inchesToMeters(landingResult.cgPosition))} ${distanceUnit}`],
                    ],
                    [
                      [
                        landingResult.totalWeight <= (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight),
                        'Weight OK',
                        'Overweight',
                      ],
                      [landingResult.isWithinEnvelope, 'CG OK', 'CG Out of Limits'],
                    ],
                    'Landing configuration is not safe'
                  )}
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom action bar — oval pill, iOS settings search-bar style */}
      <View style={[styles.toolbarOuter, { paddingBottom: 10 + insets.bottom }]}>
        <View style={styles.toolbar}>
          <PressableScale
            style={styles.toolbarSideButtonLeft}
            onPress={() => navigation.navigate('Performance', { aircraft })}
            accessibilityRole="button"
          >
            <Text style={styles.toolbarButtonText} numberOfLines={1}>Performance</Text>
          </PressableScale>
          <PressableScale style={styles.toolbarSideButtonRight} onPress={confirmClear} accessibilityRole="button">
            <Text style={[styles.toolbarButtonText, { color: colors.error }]} numberOfLines={1}>Clear</Text>
          </PressableScale>

          {/* Unit toggle — absolutely centered in the oval so its label is the true center */}
          <View style={styles.toolbarCenter} pointerEvents="box-none">
            <PressableScale
              style={styles.toolbarButton}
              onPress={toggleUnitSystem}
              accessibilityRole="button"
              accessibilityLabel="Toggle units"
            >
              <Text style={styles.toolbarButtonText} numberOfLines={1}>
                {unitSystem === 'metric' ? 'kg / L' : 'lbs / gal'}
              </Text>
            </PressableScale>
          </View>
        </View>
      </View>

      {/* Single reusable value-edit sheet */}
      <ValueEditSheet
        visible={editTarget !== null}
        title={editTarget?.title || ''}
        value={tempValue}
        onChangeText={setTempValue}
        hint={editHint}
        onCancel={() => {
          setEditTarget(null);
          setTempValue('');
        }}
        onSave={saveEditValue}
      />
    </View>
  );

  function renderResultCard(
    rows: [string, string][],
    badges: [boolean, string, string][],
    warningText: string
  ) {
    return (
      <View style={styles.resultCard}>
        {rows.map(([label, value]) => (
          <View style={styles.resultRow} key={label}>
            <Text style={styles.resultLabel}>{label}</Text>
            <Text style={styles.resultValue}>{value}</Text>
          </View>
        ))}

        <View style={styles.statusContainer}>
          {badges.map(([safe, okText, failText]) => (
            <View
              key={okText}
              style={[styles.statusBadge, safe ? styles.statusSuccess : styles.statusError]}
            >
              <Text
                style={[styles.statusText, { color: safe ? colors.success : colors.error }]}
              >
                {safe ? okText : failText}
              </Text>
            </View>
          ))}
        </View>

        {!badges.every(([safe]) => safe) && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>{warningText}</Text>
          </View>
        )}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  section: {
    paddingHorizontal: list.insetHorizontal,
    marginBottom: list.cardGap,
  },
  sectionTitle: {
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
  labelContainer: {
    marginBottom: list.md,
  },
  inputLabelText: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  inputLabelSubtext: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  valueDisplay: {
    marginLeft: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.fill,
    minWidth: 70,
    alignItems: 'center',
  },
  valueText: {
    ...typography.valueLarge,
  },
  unitText: {
    ...typography.caption1,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    padding: list.xl,
    borderRadius: list.cardRadius,
    marginBottom: list.cardGap,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  resultLabel: {
    ...typography.subhead,
    color: colors.textSecondary,
  },
  resultValue: {
    ...typography.value,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  statusContainer: {
    gap: 8,
    marginTop: 10,
  },
  statusBadge: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusSuccess: {
    backgroundColor: colors.successFill,
  },
  statusError: {
    backgroundColor: colors.errorFill,
  },
  statusText: {
    ...typography.headline,
  },
  warningBox: {
    backgroundColor: colors.warningFill,
    padding: list.xl,
    borderRadius: list.cardRadius,
    marginTop: 10,
    alignItems: 'center',
  },
  warningText: {
    ...typography.subhead,
    color: colors.error,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.gray200,
    borderRadius: 26,
    padding: 4,
  },
  toolbarButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 22,
  },
  toolbarCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarSideButtonLeft: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingLeft: 12,
    borderRadius: 22,
  },
  toolbarSideButtonRight: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: 10,
    paddingRight: 12,
    borderRadius: 22,
  },
  toolbarButtonText: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  headerInfoButton: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  headerInfoButtonText: {
    ...typography.title3,
    fontWeight: '600',
    color: colors.primary,
  },
});
