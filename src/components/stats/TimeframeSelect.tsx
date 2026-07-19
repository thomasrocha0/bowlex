import { useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SCORE_HISTORY_TIMEFRAME_OPTIONS, type ScoreHistoryTimeframe } from "../../lib/scoreHistory";
import { scoreHistoryChartColors } from "./scoreHistoryChartColors";

interface TimeframeSelectProps {
  value: ScoreHistoryTimeframe;
  onChange: (value: ScoreHistoryTimeframe) => void;
}

export function TimeframeSelect({ value, onChange }: TimeframeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = SCORE_HISTORY_TIMEFRAME_OPTIONS.find((option) => option.value === value);

  const handleSelect = (next: ScoreHistoryTimeframe) => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.trigger} onPress={() => setIsOpen((open) => !open)}>
        <Text style={styles.triggerLabel}>{selectedOption?.label}</Text>
        <Text style={styles.triggerChevron}>{isOpen ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {isOpen && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
          <View style={styles.menu}>
            {SCORE_HISTORY_TIMEFRAME_OPTIONS.map((option) => (
              <TouchableOpacity key={option.value} style={styles.menuItem} onPress={() => handleSelect(option.value)}>
                <Text style={[styles.menuItemLabel, value === option.value && styles.menuItemLabelActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: scoreHistoryChartColors.triggerBackground,
  },
  triggerLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: scoreHistoryChartColors.triggerLabel,
  },
  triggerChevron: {
    fontSize: 10,
    color: scoreHistoryChartColors.triggerLabel,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  menu: {
    position: "absolute",
    top: 40,
    right: 0,
    zIndex: 20,
    minWidth: 150,
    borderRadius: 8,
    backgroundColor: scoreHistoryChartColors.menuBackground,
    borderWidth: 1,
    borderColor: scoreHistoryChartColors.gridLine,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItemLabel: {
    fontSize: 13,
    color: scoreHistoryChartColors.menuItemLabel,
  },
  menuItemLabelActive: {
    color: scoreHistoryChartColors.menuItemLabelActive,
    fontWeight: "700",
  },
});
