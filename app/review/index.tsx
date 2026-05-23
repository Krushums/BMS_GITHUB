import { View } from "react-native";

import { useGameplay } from "@/features/gameplay/GameplayContext";
import { SubmissionCard } from "@/features/submissions/SubmissionCard";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/theme";

export default function SubmissionReviewScreen() {
  const { pendingSubmissions, reviewRewardRedemption, reviewSubmission, rewardRequests, state } = useGameplay();

  return (
    <Screen>
      <AppText variant="title">Submission review</AppText>
      {pendingSubmissions.length === 0 && rewardRequests.length === 0 ? (
        <Card>
          <AppText color={colors.inkMuted}>No pending reviews. The house is quiet for now.</AppText>
        </Card>
      ) : null}

      {pendingSubmissions.map(({ submission, task }) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          task={task}
          onApprove={() => reviewSubmission(submission.id, "approved")}
          onReject={() => reviewSubmission(submission.id, "rejected")}
        />
      ))}

      {rewardRequests.map(({ redemption, reward }) => (
        <Card key={redemption.id} tone="warm">
          <AppText variant="body">{state.child.displayName} requested {reward.title}</AppText>
          <AppText color={colors.inkMuted} variant="caption">
            Approving spends {reward.pointCost} points.
          </AppText>
          <View style={{ flexDirection: "row", gap: spacing.sm, justifyContent: "flex-end" }}>
            <Button label="Reject" onPress={() => reviewRewardRedemption(redemption.id, "rejected")} variant="quiet" />
            <Button icon="checkmark" label="Approve" onPress={() => reviewRewardRedemption(redemption.id, "approved")} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
