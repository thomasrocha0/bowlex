import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { buttonColors } from "./buttonColors";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "small" | "medium" | "large";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Shows a spinner in place of the label and implies disabled. */
  loading?: boolean;
}

const SIZE_STYLES: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  small: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 13 },
  medium: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15 },
  large: { paddingVertical: 16, paddingHorizontal: 28, fontSize: 17 },
};

export function Button({ label, onPress, variant = "primary", size = "medium", disabled, loading }: ButtonProps) {
  const colors = buttonColors[variant];
  const sizeStyle = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          opacity: isDisabled ? 0.5 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.label} size="small" />
      ) : (
        <Text style={[styles.label, { color: colors.label, fontSize: sizeStyle.fontSize }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "600",
  },
});
