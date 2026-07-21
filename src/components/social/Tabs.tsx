import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { tabsColors } from "./tabsColors";

interface TabOption<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Generic segmented control -- reused for the outer Friends/Pending/Blocked tabs and the inner Incoming/Outgoing split. */
export function Tabs<T extends string>({ options, value, onChange }: TabsProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.tab, { backgroundColor: isActive ? tabsColors.backgroundActive : tabsColors.backgroundInactive }]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.label, { color: isActive ? tabsColors.fontActive : tabsColors.fontInactive }]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: 8 },
  tab: { 
    borderRadius: 8, 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    height: 36,
    justifyContent: "center"
  },
  label: { fontSize: 13, fontWeight: "700" },
});
