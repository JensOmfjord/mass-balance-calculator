/**
 * Single reusable value-edit sheet — replaces the three near-identical
 * centered modals. iOS form-sheet style: dimmed scrim, centered card,
 * Cancel / Save actions. Presentation animates via LayoutAnimation.
 */
import React, { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { hapticCommit } from '../utils/haptics';

export interface ValueEditSheetProps {
  visible: boolean;
  title: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Optional unit hint below the field. */
  hint?: string;
  keyboardType?: 'decimal-pad' | 'numbers-and-punctuation';
  onCancel: () => void;
  onSave: () => void;
}

export const ValueEditSheet: React.FC<ValueEditSheetProps> = ({
  visible,
  title,
  value,
  onChangeText,
  hint,
  keyboardType = 'decimal-pad',
  onCancel,
  onSave,
}) => {
  useEffect(() => {
    if (visible) {
      onChangeText(String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onCancel} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoFocus
            selectTextOnFocus
          />
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <Text style={styles.buttonCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSave]}
              onPress={() => {
                hapticCommit();
                onSave();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.buttonSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  card: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: 14,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  title: {
    ...typography.headline,
    textAlign: 'center',
    marginBottom: 16,
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 0,
    backgroundColor: colors.fill,
    borderRadius: 10,
    padding: 12,
    ...typography.valueLarge,
    textAlign: 'center',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  hint: {
    ...typography.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: colors.fill,
  },
  buttonSave: {
    backgroundColor: colors.primary,
  },
  buttonCancelText: {
    ...typography.headline,
    color: colors.primary,
  },
  buttonSaveText: {
    ...typography.headline,
    color: colors.white,
  },
});
