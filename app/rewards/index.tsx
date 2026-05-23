import { useGameplay } from "@/features/gameplay/GameplayContext";
import { RewardCard } from "@/features/rewards/RewardCard";
import { AppText } from "@/shared/components/AppText";
import { Card } from "@/shared/components/Card";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/theme";
import { formatDateTimeLabel } from "@/shared/utils/date";
import { formatPoints } from "@/shared/utils/format";

export default function RewardShopScreen() {
  const { pointsSummary, requestReward, reservedRewardPoints, state } = useGameplay();

  return (
    <Screen>
      <AppText variant="title">Reward shop</AppText>
      <Card tone="warm">
        <AppText variant="heading">{formatPoints(pointsSummary.available)}</AppText>
        <AppText color={colors.inkMuted}>
          Earned {pointsSummary.earned} · Spent {pointsSummary.spent} · {reservedRewardPoints} pending approval
        </AppText>
      </Card>

      {state.rewards.map((reward) => {
        const pendingRequest = state.redemptions.find(
          (redemption) => redemption.rewardId === reward.id && redemption.status === "requested"
        );
        const latestRequest = state.redemptions.find((redemption) => redemption.rewardId === reward.id);
        const canAfford = pointsSummary.available - reservedRewardPoints >= reward.pointCost;
        const statusLabel = pendingRequest
          ? `Pending parent approval • Requested ${formatDateTimeLabel(pendingRequest.requestedAt)}`
          : latestRequest?.status === "approved"
            ? "Redeemed"
            : latestRequest?.status === "rejected"
              ? "Request declined"
              : canAfford
                ? "Unlocked"
                : `${formatPoints(reward.pointCost - (pointsSummary.available - reservedRewardPoints))} more needed`;

        return (
        <RewardCard
          key={reward.id}
          disabled={!canAfford || Boolean(pendingRequest)}
          reward={reward}
          statusLabel={statusLabel}
          onRedeem={() => requestReward(reward.id)}
        />
        );
      })}
    </Screen>
  );
}
