import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { CalendarFormState } from "@/features/calendar/calendarTypes";
import { calendarCategories, calendarCategoryTheme, repeatOptions } from "@/features/calendar/calendarTheme";
import { AppText } from "@/shared/components/AppText";
import { usePreviewMode } from "@/shared/components/PreviewModeContext";
import { colors, spacing } from "@/shared/theme";

type EventFormModalProps = {
  canDelete: boolean;
  form: CalendarFormState;
  onChange: (form: CalendarFormState) => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  visible: boolean;
};

export function EventFormModal({ canDelete, form, onChange, onClose, onDelete, onSave, visible }: EventFormModalProps) {
  const { mode } = usePreviewMode();
  const { width } = useWindowDimensions();
  const compact = mode === "phone" || width < 768;

  function update(patch: Partial<CalendarFormState>) {
    onChange({ ...form, ...patch });
  }

  return (
    <Modal animationType={compact ? "slide" : "fade"} transparent visible={visible} onRequestClose={onClose}>
      <View style={[styles.backdrop, compact ? styles.backdropCompact : styles.backdropDesktop]}>
        <SafeAreaView style={[styles.sheet, compact ? styles.sheetCompact : styles.sheetDesktop]}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.headerAction}>
              <AppText color={colors.primaryDark} variant="caption">Cancel</AppText>
            </Pressable>
            <AppText style={styles.title}>{canDelete ? "Edit event" : "Add event"}</AppText>
            <Pressable accessibilityRole="button" disabled={!form.title.trim()} onPress={onSave} style={styles.headerAction}>
              <AppText color={form.title.trim() ? colors.primaryDark : colors.inkMuted} variant="caption">Save</AppText>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <TextInput
              onChangeText={(title) => update({ title })}
              placeholder="Title"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              value={form.title}
            />

            <View style={styles.chipRow}>
              {calendarCategories.map((category) => {
                const theme = calendarCategoryTheme[category];
                const selected = form.category === category;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={category}
                    onPress={() => update({ category })}
                    style={[styles.categoryChip, { backgroundColor: selected ? theme.background : colors.surfaceMuted, borderColor: selected ? theme.text : colors.border }]}
                  >
                    <View style={[styles.dot, { backgroundColor: theme.text }]} />
                    <AppText color={selected ? theme.text : colors.inkMuted} style={styles.chipText} variant="caption">{theme.label}</AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.formGrid}>
              <TextInput onChangeText={(date) => update({ date })} placeholder="Date yyyy-mm-dd" placeholderTextColor={colors.inkMuted} style={styles.input} value={form.date} />
              <TextInput onChangeText={(startTime) => update({ startTime })} placeholder="Start time 16:00" placeholderTextColor={colors.inkMuted} style={styles.input} value={form.startTime} />
              <TextInput onChangeText={(endTime) => update({ endTime })} placeholder="End time 17:00" placeholderTextColor={colors.inkMuted} style={styles.input} value={form.endTime} />
            </View>

            <View style={styles.chipRow}>
              {repeatOptions.map((repeat) => (
                <Pressable
                  accessibilityRole="button"
                  key={repeat}
                  onPress={() => update({ repeat })}
                  style={[styles.repeatChip, form.repeat === repeat && styles.repeatChipActive]}
                >
                  <AppText color={form.repeat === repeat ? colors.surface : colors.inkMuted} style={styles.chipText} variant="caption">{repeat}</AppText>
                </Pressable>
              ))}
            </View>

            <TextInput
              multiline
              onChangeText={(notes) => update({ notes })}
              placeholder="Notes"
              placeholderTextColor={colors.inkMuted}
              style={[styles.input, styles.notesInput]}
              value={form.notes}
            />

            {form.category === "revision" ? (
              <View style={styles.revisionPanel}>
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={(pointsOnComplete) => update({ pointsOnComplete })}
                  placeholder="Points on completion"
                  placeholderTextColor={colors.inkMuted}
                  style={styles.input}
                  value={form.pointsOnComplete}
                />
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: form.requiresEvidence }}
                  onPress={() => update({ requiresEvidence: !form.requiresEvidence })}
                  style={styles.evidenceRow}
                >
                  <View style={[styles.evidenceToggle, form.requiresEvidence && styles.evidenceToggleActive]}>
                    {form.requiresEvidence ? <Ionicons color={colors.surface} name="checkmark" size={14} /> : null}
                  </View>
                  <AppText variant="caption">Require photo evidence</AppText>
                </Pressable>
              </View>
            ) : null}

            {canDelete ? (
              <Pressable accessibilityRole="button" onPress={onDelete} style={styles.deleteButton}>
                <Ionicons color={colors.danger} name="trash-outline" size={18} />
                <AppText color={colors.danger} style={styles.deleteLabel} variant="caption">Delete event</AppText>
              </Pressable>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(15, 23, 42, 0.2)",
    flex: 1
  },
  backdropCompact: {
    justifyContent: "flex-end"
  },
  backdropDesktop: {
    justifyContent: "center",
    padding: spacing.lg
  },
  categoryChip: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.md
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 48
  },
  deleteLabel: {
    fontSize: 12,
    fontWeight: "800"
  },
  dot: {
    borderRadius: 999,
    height: 5,
    width: 5
  },
  evidenceRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 42
  },
  evidenceToggle: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24
  },
  evidenceToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark
  },
  formGrid: {
    gap: spacing.sm
  },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: spacing.sm
  },
  headerAction: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 64
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: spacing.md
  },
  notesInput: {
    minHeight: 82,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  },
  repeatChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: spacing.md
  },
  repeatChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark
  },
  revisionPanel: {
    backgroundColor: "#FBE4EB",
    borderColor: "#F3C5D2",
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  sheet: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    overflow: "hidden",
    width: "100%"
  },
  sheetCompact: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
    maxWidth: 420
  },
  sheetDesktop: {
    borderRadius: 20,
    maxHeight: "88%",
    maxWidth: 520
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center"
  }
});
