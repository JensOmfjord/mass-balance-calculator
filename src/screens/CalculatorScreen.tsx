import React, { useState, useEffect } from 'react';
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
import Slider from '@react-native-community/slider';
import { AircraftConfig } from '../models/Aircraft';
import { calculateMassBalance } from '../services/massBalanceCalculator';
import { MassBalanceResult } from '../models/MassBalanceResult';
import { CGEnvelopeChart } from '../components/CGEnvelopeChart';
import { inchesToMeters, kgToLbs, litersToGallons, metersToInches } from '../utils/units';
import { saveAircraftConfig, loadAircraftConfig } from '../services/aircraftStorage';
import { colors, gradients } from '../theme/colors';

interface CalculatorScreenProps {
  aircraft: AircraftConfig;
  onBack: () => void;
}

export const CalculatorScreen: React.FC<CalculatorScreenProps> = ({ aircraft, onBack }) => {
  const [stationWeights, setStationWeights] = useState<Record<string, number>>({});
  const [fuelVolume, setFuelVolume] = useState<number>(0);
  const [fuelBurn, setFuelBurn] = useState<number>(0);
  const [result, setResult] = useState<MassBalanceResult | null>(null);
  const [landingResult, setLandingResult] = useState<MassBalanceResult | null>(null);
  const [editingStation, setEditingStation] = useState<string | null>(null);
  const [editingFuel, setEditingFuel] = useState(false);
  const [editingFuelBurn, setEditingFuelBurn] = useState(false);
  const [tempValue, setTempValue] = useState<string>('');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Load saved configuration on mount
  useEffect(() => {
    const loadSavedConfig = async () => {
      const savedConfig = await loadAircraftConfig(aircraft.registration);

      if (savedConfig) {
        // Load saved values
        setStationWeights(savedConfig.stationWeights);
        setFuelVolume(savedConfig.fuelVolume);
        setFuelBurn(savedConfig.fuelBurn);
      } else {
        // Initialize to zeros if no saved config
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
    const fuelWeight = fuelVolume * aircraft.fuelDensity; // Convert liters to kg using aircraft-specific density
    const hasValues = Object.values(stationWeights).some(w => w > 0) || fuelVolume > 0;

    if (hasValues) {
      // Takeoff calculation
      const calculationResult = calculateMassBalance(aircraft, stationWeights, fuelWeight);
      setResult(calculationResult);

      // Landing calculation (with fuel burn)
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

    // Only save if we have initialized values (avoid saving during initial load)
    if (Object.keys(stationWeights).length > 0) {
      saveConfig();
    }
  }, [stationWeights, fuelVolume, fuelBurn, aircraft.registration]);

  const handleSliderChange = (stationId: string, value: number) => {
    const roundedValue = Math.round(value);
    setStationWeights(prev => ({ ...prev, [stationId]: roundedValue }));
  };

  const handleFuelSliderChange = (value: number) => {
    const roundedValue = Math.round(value);
    setFuelVolume(roundedValue);
  };

  const handleFuelBurnSliderChange = (value: number) => {
    const roundedValue = Math.round(value);
    setFuelBurn(roundedValue);
  };

  const openEditor = (stationId: string) => {
    setEditingStation(stationId);
    setTempValue(stationWeights[stationId]?.toString() || '0');
  };

  const openFuelEditor = () => {
    setEditingFuel(true);
    setTempValue(fuelVolume.toString());
  };

  const openFuelBurnEditor = () => {
    setEditingFuelBurn(true);
    setTempValue(fuelBurn.toString());
  };

  const saveStationValue = () => {
    if (editingStation) {
      const value = parseFloat(tempValue) || 0;
      const station = aircraft.stations.find(s => s.id === editingStation);
      const maxValue = station?.maxWeight || 200;
      setStationWeights(prev => ({
        ...prev,
        [editingStation]: Math.min(Math.max(0, value), maxValue)
      }));
    }
    setEditingStation(null);
    setTempValue('');
  };

  const saveFuelValue = () => {
    const value = parseFloat(tempValue) || 0;
    setFuelVolume(Math.min(Math.max(0, value), aircraft.fuelCapacity));
    setEditingFuel(false);
    setTempValue('');
  };

  const saveFuelBurnValue = () => {
    const value = parseFloat(tempValue) || 0;
    setFuelBurn(Math.min(Math.max(0, value), fuelVolume));
    setEditingFuelBurn(false);
    setTempValue('');
  };

  const clearAll = () => {
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

  const getSliderColor = (value: number, max: number) => {
    if (value === 0) return colors.gray300;
    if (value > max) return colors.error;
    if (value > max * 0.9) return colors.warning;
    return colors.success;
  };

  // Helper functions for unit conversion display
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
    setUnitSystem(prev => prev === 'metric' ? 'imperial' : 'metric');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={gradients.header}
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
            <Text style={styles.model}>{aircraft.model}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleUnitSystem} style={styles.unitToggle}>
              <Text style={styles.unitToggleText}>{unitSystem === 'metric' ? 'kg/L' : 'lbs/gal'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* CG Envelope Chart - Always visible at top */}
      <View style={styles.chartContainerTop}>
        <CGEnvelopeChart
          aircraft={aircraft}
          currentWeight={result?.totalWeight || 0}
          currentCG={result?.cgPosition || 0}
          isWithinEnvelope={result ? result.isWithinEnvelope : true}
          landingWeight={landingResult?.totalWeight}
          landingCG={landingResult?.cgPosition}
          landingIsWithinEnvelope={landingResult ? landingResult.isWithinEnvelope : true}
        />
      </View>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Station Inputs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weight & Balance</Text>

          {aircraft.stations.map(station => {
            const value = stationWeights[station.id] || 0;
            const sliderColor = getSliderColor(value, station.maxWeight);

            return (
              <View key={station.id} style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <Text style={styles.inputLabelText}>{station.name}</Text>
                  <Text style={styles.inputLabelSubtext}>Max: {displayWeight(station.maxWeight, 0)} {weightUnit}</Text>
                </View>

                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={station.maxWeight}
                    value={value}
                    onValueChange={(val) => handleSliderChange(station.id, val)}
                    minimumTrackTintColor={sliderColor}
                    maximumTrackTintColor={colors.gray200}
                    thumbTintColor={sliderColor}
                    step={1}
                  />
                  <TouchableOpacity
                    style={[styles.valueDisplay, { borderColor: sliderColor }]}
                    onPress={() => openEditor(station.id)}
                  >
                    <Text style={[styles.valueText, { color: sliderColor }]}>
                      {displayWeight(value, 0)}
                    </Text>
                    <Text style={styles.unitText}>{weightUnit}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Fuel Input */}
          <View style={styles.inputRow}>
            <View style={styles.labelContainer}>
              <Text style={styles.inputLabelText}>Fuel</Text>
              <Text style={styles.inputLabelSubtext}>
                Max: {displayVolume(aircraft.fuelCapacity, 0)} {volumeUnit} ({displayWeight(aircraft.fuelCapacity * aircraft.fuelDensity)} {weightUnit})
              </Text>
            </View>

            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={aircraft.fuelCapacity}
                value={fuelVolume}
                onValueChange={handleFuelSliderChange}
                minimumTrackTintColor={getSliderColor(fuelVolume, aircraft.fuelCapacity)}
                maximumTrackTintColor={colors.gray200}
                thumbTintColor={getSliderColor(fuelVolume, aircraft.fuelCapacity)}
                step={1}
              />
              <TouchableOpacity
                style={[styles.valueDisplay, { borderColor: getSliderColor(fuelVolume, aircraft.fuelCapacity) }]}
                onPress={openFuelEditor}
              >
                <Text style={[styles.valueText, { color: getSliderColor(fuelVolume, aircraft.fuelCapacity) }]}>
                  {displayVolume(fuelVolume, 0)}
                </Text>
                <Text style={styles.unitText}>{volumeUnit}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Fuel Burn Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimated Fuel Burn</Text>

          <View style={styles.inputRow}>
            <View style={styles.labelContainer}>
              <Text style={styles.inputLabelText}>Fuel to Burn</Text>
              <Text style={styles.inputLabelSubtext}>
                Max: {fuelVolume > 0 ? displayVolume(fuelVolume, 0) : 0} {volumeUnit} ({fuelVolume > 0 ? displayWeight(fuelVolume * aircraft.fuelDensity) : '0.0'} {weightUnit})
              </Text>
            </View>

            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={fuelVolume > 0 ? fuelVolume : 100}
                value={fuelBurn}
                onValueChange={handleFuelBurnSliderChange}
                minimumTrackTintColor={getSliderColor(fuelBurn, fuelVolume > 0 ? fuelVolume : 100)}
                maximumTrackTintColor={colors.gray200}
                thumbTintColor={getSliderColor(fuelBurn, fuelVolume > 0 ? fuelVolume : 100)}
                step={1}
                disabled={fuelVolume === 0}
              />
              <TouchableOpacity
                style={[styles.valueDisplay, {
                  borderColor: getSliderColor(fuelBurn, fuelVolume > 0 ? fuelVolume : 100),
                  opacity: fuelVolume === 0 ? 0.5 : 1
                }]}
                onPress={fuelVolume > 0 ? openFuelBurnEditor : undefined}
                disabled={fuelVolume === 0}
              >
                <Text style={[styles.valueText, { color: getSliderColor(fuelBurn, fuelVolume > 0 ? fuelVolume : 100) }]}>
                  {displayVolume(fuelBurn, 0)}
                </Text>
                <Text style={styles.unitText}>{volumeUnit}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Results */}
        {result && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Takeoff Configuration</Text>

            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Weight:</Text>
                <Text style={styles.resultValue}>{displayWeight(result.totalWeight)} {weightUnit}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>CG Position:</Text>
                <Text style={styles.resultValue}>{displayDistance(inchesToMeters(result.cgPosition))} {distanceUnit}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Max Takeoff Weight:</Text>
                <Text style={styles.resultValue}>{displayWeight(aircraft.maxTakeoffWeight, 0)} {weightUnit}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusBadge,
                  result.exceedsMaxWeight ? styles.statusError : styles.statusSuccess
                ]}>
                  <Text style={[styles.statusText, { color: result.exceedsMaxWeight ? colors.error : colors.success }]}>
                    {result.exceedsMaxWeight ? '⚠️ OVERWEIGHT' : '✓ Weight OK'}
                  </Text>
                </View>

                <View style={[
                  styles.statusBadge,
                  !result.isWithinEnvelope ? styles.statusError : styles.statusSuccess
                ]}>
                  <Text style={[styles.statusText, { color: !result.isWithinEnvelope ? colors.error : colors.success }]}>
                    {result.isWithinEnvelope ? '✓ CG OK' : '⚠️ CG OUT OF LIMITS'}
                  </Text>
                </View>
              </View>

              {(!result.isWithinEnvelope || result.exceedsMaxWeight) && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ Aircraft is not safe to fly in this configuration
                  </Text>
                </View>
              )}
            </View>

            {/* Landing Configuration */}
            {landingResult && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Landing Configuration</Text>
                <View style={styles.resultCard}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Fuel Burned:</Text>
                    <Text style={styles.resultValue}>{displayVolume(fuelBurn, 0)} {volumeUnit} ({displayWeight(fuelBurn * aircraft.fuelDensity)} {weightUnit})</Text>
                  </View>

                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Landing Weight:</Text>
                    <Text style={styles.resultValue}>{displayWeight(landingResult.totalWeight)} {weightUnit}</Text>
                  </View>

                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Max Landing Weight:</Text>
                    <Text style={styles.resultValue}>{displayWeight(aircraft.maxLandingWeight || aircraft.maxTakeoffWeight, 0)} {weightUnit}</Text>
                  </View>

                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Landing CG:</Text>
                    <Text style={styles.resultValue}>{displayDistance(inchesToMeters(landingResult.cgPosition))} {distanceUnit}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusBadge,
                      landingResult.totalWeight > (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight) ? styles.statusError : styles.statusSuccess
                    ]}>
                      <Text style={[styles.statusText, { color: landingResult.totalWeight > (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight) ? colors.error : colors.success }]}>
                        {landingResult.totalWeight > (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight) ? '⚠️ OVERWEIGHT' : '✓ Weight OK'}
                      </Text>
                    </View>

                    <View style={[
                      styles.statusBadge,
                      !landingResult.isWithinEnvelope ? styles.statusError : styles.statusSuccess
                    ]}>
                      <Text style={[styles.statusText, { color: !landingResult.isWithinEnvelope ? colors.error : colors.success }]}>
                        {landingResult.isWithinEnvelope ? '✓ CG OK' : '⚠️ CG OUT OF LIMITS'}
                      </Text>
                    </View>
                  </View>

                  {(!landingResult.isWithinEnvelope || landingResult.totalWeight > (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight)) && (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningText}>
                        ⚠️ Landing configuration is not safe
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Edit Modal for Station Weight */}
      <Modal
        visible={editingStation !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingStation(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditingStation(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingStation && aircraft.stations.find(s => s.id === editingStation)?.name}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={tempValue}
              onChangeText={setTempValue}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditingStation(null)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveStationValue}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal for Fuel */}
      <Modal
        visible={editingFuel}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingFuel(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditingFuel(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Fuel Volume</Text>
            <TextInput
              style={styles.modalInput}
              value={tempValue}
              onChangeText={setTempValue}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditingFuel(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveFuelValue}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal for Fuel Burn */}
      <Modal
        visible={editingFuelBurn}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingFuelBurn(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditingFuelBurn(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Fuel Burn</Text>
            <TextInput
              style={styles.modalInput}
              value={tempValue}
              onChangeText={setTempValue}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditingFuelBurn(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveFuelBurnValue}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>Save</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    padding: 5,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  unitToggle: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10,
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
  inputRow: {
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
  labelContainer: {
    marginBottom: 12,
  },
  inputLabelText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  inputLabelSubtext: {
    fontSize: 13,
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
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 70,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 20,
    fontWeight: '700',
  },
  unitText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 18,
  },
  statusContainer: {
    gap: 12,
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
  statusError: {
    backgroundColor: '#FCE8E8',
    borderColor: colors.error,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 18,
    borderRadius: 12,
    marginTop: 18,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningText: {
    fontSize: 15,
    color: '#E65100',
    fontWeight: '700',
    lineHeight: 22,
  },
  chartContainerTop: {
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingVertical: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: 20,
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
  landingPreview: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  landingPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 10,
  },
  landingPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  landingPreviewLabel: {
    fontSize: 13,
    color: '#666',
  },
  landingPreviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusOk: {
    color: '#34C759',
  },
});
