import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useMockAuth } from "@/features/auth/MockAuthContext";
import { AppText } from "@/shared/components/AppText";
import { colors, spacing } from "@/shared/theme";

type ProfileMenuProps = {
  displayName: string;
};

const menuItems = ["Profile", "Settings", "Notifications", "Help"];

export function ProfileMenu({ displayName }: ProfileMenuProps) {
  const auth = useMockAuth();
  const [isOpen, setIsOpen] = useState(false);
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  function handleLogout() {
    auth.logout();
    setIsOpen(false);
    router.replace("/auth");
  }

  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" onPress={() => setIsOpen((value) => !value)} style={styles.avatar}>
        <AppText color={colors.surface} variant="caption">
          {initials || "ME"}
        </AppText>
      </Pressable>

      <Modal animationType="fade" onRequestClose={() => setIsOpen(false)} transparent visible={isOpen}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityRole="button" onPress={() => setIsOpen(false)} style={styles.backdrop} />
          <View style={styles.menu}>
            {menuItems.map((item) => (
              <Pressable key={item} onPress={() => setIsOpen(false)} style={styles.menuItem}>
                <AppText variant="caption">{item}</AppText>
              </Pressable>
            ))}
            <Pressable onPress={handleLogout} style={[styles.menuItem, styles.logoutItem]}>
              <Ionicons color={colors.danger} name="log-out" size={16} />
              <AppText color={colors.danger} variant="caption">
                Logout
              </AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  container: {
    alignItems: "flex-end",
    position: "relative"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  logoutItem: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm
  },
  menu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 8,
    minWidth: 190,
    paddingVertical: spacing.xs,
    position: "absolute",
    right: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    top: 72,
    zIndex: 999
  },
  menuItem: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999
  }
});
