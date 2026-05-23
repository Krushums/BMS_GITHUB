import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Task, TaskAssignment } from "@/domain";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { colors, spacing } from "@/shared/theme";

type TaskCardProps = {
  assignment: TaskAssignment;
  note?: string | null | undefined;
  task: Task;
  onSubmit?: () => void;
};

const statusLabels: Record<TaskAssignment["status"], string> = {
  approved: "Approved",
  cancelled: "Cancelled",
  open: "Ready",
  rejected: "Try again",
  submitted: "In review"
};

export function TaskCard({ assignment, note, onSubmit, task }: TaskCardProps) {
  const canSubmit = assignment.status === "open" || assignment.status === "rejected";
  const iconName = assignment.status === "approved" ? "trophy" : assignment.status === "submitted" ? "time" : "flash";

  return (
    <Card tone={assignment.status === "approved" ? "fresh" : assignment.status === "submitted" ? "focus" : "default"}>
      <View style={styles.header}>
        <View style={styles.iconBubble}>
          <Ionicons color={colors.primaryDark} name={iconName} size={18} />
        </View>
        <View style={styles.titleGroup}>
          <AppText variant="body">{task.title}</AppText>
          <AppText color={colors.inkMuted} variant="caption">
            {task.pointValue} points • {statusLabels[assignment.status]}
          </AppText>
        </View>
      </View>

      {task.description ? (
        <AppText color={colors.inkMuted} variant="caption">
          {task.description}
        </AppText>
      ) : null}

      {note ? (
        <AppText color={colors.inkMuted} variant="caption">
          Note: {note}
        </AppText>
      ) : null}

      {canSubmit && onSubmit ? (
        <Button icon="camera" label={assignment.status === "rejected" ? "Try again" : "Submit proof"} onPress={onSubmit} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  iconBubble: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  titleGroup: {
    flex: 1,
    gap: spacing.xs
  }
});
