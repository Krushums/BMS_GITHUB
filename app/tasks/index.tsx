import { StyleSheet, View } from "react-native";

import { useGameplay } from "@/features/gameplay/GameplayContext";
import { ProofSubmissionCard } from "@/features/tasks/ProofSubmissionCard";
import { TaskCard } from "@/features/tasks/TaskCard";
import { AppText } from "@/shared/components/AppText";
import { Screen } from "@/shared/components/Screen";
import { spacing } from "@/shared/theme";

export default function TaskListScreen() {
  const { childTasks, submitTask } = useGameplay();

  return (
    <Screen>
      <AppText variant="title">Tasks</AppText>
      {childTasks.map(({ assignment, submission, task }) => (
        <View key={assignment.id} style={styles.taskBlock}>
          <TaskCard assignment={assignment} note={submission?.note} task={task} />
          {assignment.status === "open" || assignment.status === "rejected" ? (
            <ProofSubmissionCard
              onSubmit={({ note, photoUrl }) => {
                submitTask(assignment.id, note, photoUrl);
              }}
            />
          ) : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  taskBlock: {
    gap: spacing.sm
  }
});
