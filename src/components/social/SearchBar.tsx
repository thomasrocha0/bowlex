import { StyleSheet, TextInput } from "react-native";
import { searchBarColors } from "./searchBarColors";

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /** When provided, the input submits on the keyboard's search/enter key instead of on every keystroke. */
  onSubmit?: () => void;
}

/** Generic controlled search input -- reused for the global user search and the table's local filter box. */
export function SearchBar({ value, onChangeText, placeholder, onSubmit }: SearchBarProps) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmit}
      returnKeyType={onSubmit ? "search" : "done"}
      placeholder={placeholder}
      placeholderTextColor={searchBarColors.placeholder}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: searchBarColors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: searchBarColors.text,
    backgroundColor: searchBarColors.background,
  },
});
