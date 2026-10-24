/**
 * Pressable with Apple-style press feedback: highlight starts on press-down
 * (not release) and is continuous, with a subtle scale — never activeOpacity fade.
 */
import React from 'react';
import { Animated, Pressable, PressableProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface PressableScaleProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  /** Scale when pressed down. Default 0.97. */
  pressedScale?: number;
  children?: React.ReactNode;
}

export const PressableScale: React.FC<PressableScaleProps> = ({
  style,
  pressedScale = 0.97,
  children,
  ...rest
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.timing(scale, {
      toValue,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={() => animateTo(pressedScale)}
      onPressOut={() => animateTo(1)}
      {...rest}
    >
      {() => (
        <Animated.View
          style={[
            StyleSheet.flatten([style]) as StyleProp<ViewStyle>,
            { transform: [{ scale }] },
          ]}
        >
          {children}
        </Animated.View>
      )}
    </Pressable>
  );
};
