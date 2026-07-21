import { useEffect, useRef } from "react";
import { Animated, StyleSheet, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { Palette } from "../Palette";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

const PULSE_DURATION = 700;

/** Grey pulsing placeholder box for loading states -- compose a few into a skeleton row/card. */
export function Skeleton({ width = "100%", height = 14, borderRadius = 4, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: PULSE_DURATION, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: PULSE_DURATION, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={[styles.base, { width, height, borderRadius, opacity }, style]} />;
}

const styles = StyleSheet.create({
  base: { backgroundColor: Palette["grey-200"] },
});
