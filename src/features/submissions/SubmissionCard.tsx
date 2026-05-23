import { Image, StyleSheet, View } from "react-native";

import { EvidenceSubmission, Task } from "@/domain";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { colors, spacing } from "@/shared/theme";
import { formatDateTime } from "@/shared/utils/date";

type SubmissionCardProps = {
  submission: EvidenceSubmission;
  task: Task;
  onApprove?: () => void;
  onReject?: () => void;
};

export function SubmissionCard({ onApprove, onReject, submission, task }: SubmissionCardProps) {
  return (
    <Card tone="focus">
      <View style={styles.header}>
        <View>
          <AppText variant="body">{task.title}</AppText>
          <AppText color={colors.inkMuted} variant="caption">
            Awaiting review • {task.pointValue} points
          </AppText>
          <AppText color={colors.inkMuted} variant="caption">
            Submitted {formatDateTime(submission.submittedAt)}
          </AppText>
        </View>
      </View>

      {submission.photoUrl ? <Image source={{ uri: submission.photoUrl }} style={styles.thumbnail} /> : null}

      {submission.note ? (
        <AppText color={colors.inkMuted} variant="caption">
          Note: {submission.note}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        {onReject ? <Button label="Reject" onPress={onReject} variant="quiet" /> : null}
        {onApprove ? <Button icon="checkmark" label="Approve" onPress={onApprove} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end"
  },
  header: {
    gap: spacing.xs
  },
  thumbnail: {
    aspectRatio: 4 / 3,
    borderRadius: 8,
    width: "100%"
  }
});
