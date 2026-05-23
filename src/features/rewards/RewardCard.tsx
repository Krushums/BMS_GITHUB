import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Reward } from "@/domain";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { colors, spacing } from "@/shared/theme";
import { formatPoints } from "@/shared/utils/format";

type RewardCardProps = {
  disabled?: boolean;
  reward: Reward;
  statusLabel?: string;
  onRedeem?: () => void;
};

export function RewardCard({ disabled = false, onRedeem, reward, statusLabel }: RewardCardProps) {
  return (
    <Card tone="warm">
      <View style={styles.header}>
        <Ionicons color={colors.accent} name="gift" size={22} />
        <View style={styles.copy}>
          <AppText variant="body">{reward.title}</AppText>
          <AppText color={colors.inkMuted} variant="caption">
            {formatPoints(reward.pointCost)}
          </AppText>
        </View>
      </View>

      {reward.description ? (
        <AppText color={colors.inkMuted} variant="caption">
          {reward.description}
        </AppText>
      ) : null}

      {statusLabel ? (
        <AppText color={colors.inkMuted} variant="caption">
          {statusLabel}
        </AppText>
      ) : null}

      {onRedeem ? (
        <Button disabled={disabled} icon="sparkles" label="Request reward" onPress={onRedeem} variant="secondary" />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  }
});
