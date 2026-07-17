import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal as RNModal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { modalColors } from "./modalColors";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Thin wrapper over RN's built-in Modal: backdrop (tap to close), a card,
 * and a header with an optional title + close button. Deliberately has no
 * built-in scrolling -- callers wrap their own content in a ScrollView when
 * needed, since not every use of Modal will.
 */
export function Modal({ visible, onClose, title, children }: ModalProps) {
  return (
    <RNModal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <Text style={styles.close}>Close</Text>
              </TouchableOpacity>
            </View>
            {children}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: modalColors.backdrop,
  },
  card: {
    maxHeight: "85%",
    backgroundColor: modalColors.cardBackground,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: modalColors.title,
  },
  close: {
    fontSize: 15,
    fontWeight: "600",
    color: modalColors.close,
  },
});
