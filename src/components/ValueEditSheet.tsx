/**
 * Single reusable value-edit sheet — replaces the three near-identical
 * centered modals. iOS form-sheet style: dimmed scrim, centered card,
 * Cancel / Save actions. Presentation animates via LayoutAnimation.
 *
 * On iPad with an anchor point (captured via `captureAnchor` from the tapped
 * control) it presents as an anchored popover instead of a centered modal.
 */
import React, { useEffect, useState } from 'react';
import {
  GestureResponderEvent,
  Keyboard,
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
import { useDeviceType } from '../utils/useDeviceType';

/** Page coordinates of the control that opened the editor (popover anchor). */
export interface EditAnchor {
  /** Center-x of the anchor control, in window coordinates. */
  x: number;
  /** Bottom edge of the anchor control, in window coordinates. */
  y: number;
}

/** Captures a pressable's window position as a popover anchor. */
export const captureAnchor = (event: GestureResponderEvent, setAnchor: (a: EditAnchor) => void) => {
  event.currentTarget.measureInWindow((px, py, pw, ph) => {
    setAnchor({ x: px + pw / 2, y: py + ph });
  });
};

export interface ValueEditSheetProps {
  visible: boolean;
  title: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Optional unit hint below the field. */
  hint?: string;
  keyboardType?: 'decimal-pad' | 'numbers-and-punctuation';
  /** Anchor control position — enables popover presentation on iPad. */
  anchor?: EditAnchor | null;
  onCancel: () => void;
  onSave: () => void;
}

const POPOVER_WIDTH = 320;
const POPOVER_MARGIN = 8;

export const ValueEditSheet: React.FC<ValueEditSheetProps> = ({
  visible,
  title,
  value,
  onChangeText,
  hint,
  keyboardType = 'decimal-pad',
  anchor,
  onCancel,
  onSave,
}) => {
  const { isTablet, width, height } = useDeviceType();
  const [popoverHeight, setPopoverHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // The popover is absolutely positioned, so KeyboardAvoidingView cannot
  // move it — track the keyboard height and position within the visible
  // area instead.
  useEffect(() => {
    if (!visible || !isTablet) {
      setKeyboardHeight(0);
      return;
    }
    const showListener = Keyboard.addListener('keyboardDidShow', e =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hideListener = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardHeight(0)
    );
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [visible, isTablet]);

  useEffect(() => {
    if (visible) {
      onChangeText(String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const usePopover = isTablet && anchor !== null && popoverHeight > 0;

  // Visible area above the keyboard.
  const effectiveHeight = Math.max(0, height - keyboardHeight);

  // Clamp the popover horizontally and prefer below the anchor, flipping
  // above it when there is not enough room (accounting for the keyboard).
  const popoverLeft = anchor
    ? Math.min(Math.max(POPOVER_MARGIN, anchor.x - POPOVER_WIDTH / 2), width - POPOVER_WIDTH - POPOVER_MARGIN)
    : 0;
  const below = anchor ? anchor.y + POPOVER_MARGIN : 0;
  const popoverTop =
    anchor && popoverHeight > 0
      ? below + popoverHeight <= effectiveHeight - POPOVER_MARGIN
        ? below
        : Math.max(POPOVER_MARGIN, Math.min(anchor.y - popoverHeight - POPOVER_MARGIN, effectiveHeight - popoverHeight - POPOVER_MARGIN))
      : 0;

  const card = (
    <View
      style={[styles.card, usePopover ? styles.popoverCard : styles.centeredCard]}
      onLayout={e => setPopoverHeight(e.nativeEvent.layout.height)}
    >
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
  );

  if (usePopover) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onCancel} />
          <View style={[styles.popover, { left: popoverLeft, top: popoverTop }]} pointerEvents="box-none">
            {card}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onCancel} />
        {card}
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
  },
  centeredCard: {
    width: '80%',
    maxWidth: 300,
  },
  popoverCard: {
    width: POPOVER_WIDTH,
  },
  popover: {
    position: 'absolute',
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
