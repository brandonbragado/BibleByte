import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { uiTheme } from "@biblebites/ui";
import { Card } from "./ui";

type StateCardProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

function StateCard({ title, message, actionLabel, onActionPress }: StateCardProps) {
  return <Card title={title} body={message} actionLabel={actionLabel} onPress={onActionPress} tone="soft" />;
}

export function LoadingState({ message }: { message: string }) {
  return (
    <View style={styles.loading} accessibilityRole="progressbar">
      <ActivityIndicator color={uiTheme.colors.deepOlive} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

export function ErrorState({ title = "Unable to load", message, actionLabel, onActionPress }: StateCardProps) {
  return <StateCard title={title} message={message} actionLabel={actionLabel} onActionPress={onActionPress} />;
}

export function EmptyState({ title, message, actionLabel, onActionPress }: StateCardProps) {
  return <StateCard title={title} message={message} actionLabel={actionLabel} onActionPress={onActionPress} />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: uiTheme.spacing.xxl,
    gap: uiTheme.spacing.sm
  },
  loadingText: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.body
  }
});
