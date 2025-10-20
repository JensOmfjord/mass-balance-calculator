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
import Slider from '@react-native-community/slider';
import { AircraftConfig } from '../models/Aircraft';
import { calculateMassBalance } from '../services/massBalanceCalculator';
import { MassBalanceResult } from '../models/MassBalanceResult';

interface CalculatorScreenProps {
  aircraft: AircraftConfig;
  onBack: () => void;
}

export const CalculatorScreen: React.FC<CalculatorScreenProps> = ({ aircraft, onBack }) => {
  const [stationWeights, setStationWeights] = useState<Record<string, number>>({});
  const [fuelVolume, setFuelVolume] = useState<number>(0);
  const [result, setResult] = useState<MassBalanceResult | null>(null);
  const [editingStation, setEditingStation] = useState<string | null>(null);
  const [editingFuel, setEditingFuel] = useState(false);
  const [tempValue, setTempValue] = useState<string>('');

  // Initialize station weights to 0
  useEffect(() => {
    const initialWeights: Record<string, number> = {};
    aircraft.stations.forEach(station => {
      initialWeights[station.id] = 0;
    });
    setStationWeights(initialWeights);
  }, [aircraft]);

  // Calculate whenever inputs change
  useEffect(() => {
    const fuelWeight = fuelVolume * aircraft.fuelDensity; // Convert liters to kg using aircraft-specific density
    const hasValues = Object.values(stationWeights).some(w => w > 0) || fuelVolume > 0;

    if (hasValues) {
      const calculationResult = calculateMassBalance(aircraft, stationWeights, fuelWeight);
      setResult(calculationResult);
    } else {
      setResult(null);
    }
  }, [stationWeights, fuelVolume, aircraft]);

  const handleSliderChange = (stationId: string, value: number) => {
    setStationWeights(prev => ({ ...prev, [stationId]: Math.round(value) }));
  };

  const handleFuelSliderChange = (value: number) => {
    setFuelVolume(Math.round(value));
  };

  const openEditor = (stationId: string) => {
    setEditingStation(stationId);
    setTempValue(stationWeights[stationId]?.toString() || '0');
  };

  const openFuelEditor = () => {
    setEditingFuel(true);
    setTempValue(fuelVolume.toString());
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

  const clearAll = () => {
    const cleared: Record<string, number> = {};
    aircraft.stations.forEach(station => {
      cleared[station.id] = 0;
    });
    setStationWeights(cleared);
    setFuelVolume(0);
    setResult(null);
  };

  const getSliderColor = (value: number, max: number) => {
    if (value === 0) return '#CCCCCC';
    if (value > max) return '#FF3B30';
    if (value > max * 0.9) return '#FF9500';
    return '#34C759';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.registration}>{aircraft.registration}</Text>
          <Text style={styles.model}>{aircraft.model}</Text>
        </View>
        <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
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
                  <Text style={styles.inputLabelSubtext}>Max: {station.maxWeight} kg</Text>
                </View>

                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={station.maxWeight}
                    value={value}
                    onValueChange={(val) => handleSliderChange(station.id, val)}
                    minimumTrackTintColor={sliderColor}
                    maximumTrackTintColor="#E0E0E0"
                    thumbTintColor={sliderColor}
                    step={1}
                  />
                  <TouchableOpacity
                    style={[styles.valueDisplay, { borderColor: sliderColor }]}
                    onPress={() => openEditor(station.id)}
                  >
                    <Text style={[styles.valueText, { color: sliderColor }]}>
                      {value}
                    </Text>
                    <Text style={styles.unitText}>kg</Text>
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
                Max: {aircraft.fuelCapacity} L ({(aircraft.fuelCapacity * aircraft.fuelDensity).toFixed(1)} kg)
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
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor={getSliderColor(fuelVolume, aircraft.fuelCapacity)}
                step={1}
              />
              <TouchableOpacity
                style={[styles.valueDisplay, { borderColor: getSliderColor(fuelVolume, aircraft.fuelCapacity) }]}
                onPress={openFuelEditor}
              >
                <Text style={[styles.valueText, { color: getSliderColor(fuelVolume, aircraft.fuelCapacity) }]}>
                  {fuelVolume}
                </Text>
                <Text style={styles.unitText}>L</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Results */}
        {result && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Results</Text>

            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Weight:</Text>
                <Text style={styles.resultValue}>{result.totalWeight.toFixed(1)} kg</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>CG Position:</Text>
                <Text style={styles.resultValue}>{result.cgPosition.toFixed(2)} in</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Max Takeoff Weight:</Text>
                <Text style={styles.resultValue}>{aircraft.maxTakeoffWeight} kg</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusBadge,
                  result.exceedsMaxWeight ? styles.statusError : styles.statusSuccess
                ]}>
                  <Text style={styles.statusText}>
                    {result.exceedsMaxWeight ? '⚠️ OVERWEIGHT' : '✓ Weight OK'}
                  </Text>
                </View>

                <View style={[
                  styles.statusBadge,
                  !result.isWithinEnvelope ? styles.statusError : styles.statusSuccess
                ]}>
                  <Text style={styles.statusText}>
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  model: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#FF3B30',
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
    marginBottom: 15,
    color: '#333',
  },
  inputRow: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  labelContainer: {
    marginBottom: 10,
  },
  inputLabelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  inputLabelSubtext: {
    fontSize: 12,
    color: '#666',
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
    color: '#666',
    marginTop: 2,
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  statusContainer: {
    gap: 10,
  },
  statusBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusSuccess: {
    backgroundColor: '#E8F5E9',
  },
  statusError: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
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
});
