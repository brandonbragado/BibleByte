import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { uiTheme } from "@biblebites/ui";
import { Button, Screen } from "../../components/ui";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { useAppStore } from "../../state/appStore";
import { trackEvent } from "../../services/analyticsService";

type Props = NativeStackScreenProps<RootStackParamList, "Goal">;

const GOALS = [
  "Daily scripture habit",
  "Understand context better",
  "Build a prayer rhythm",
  "Find peace in hard seasons"
] as const;

const TOPICS = ["Trust", "Peace", "Hope", "Wisdom", "Strength", "Gratitude", "Love", "Faith"] as const;

export function GoalScreen({ navigation }: Props) {
  const [goal, setGoal] = useState<string>(GOALS[0]);
  const [topics, setTopics] = useState<string[]>(["Trust", "Peace"]);
  const setDraft = useAppStore((state) => state.setOnboardingDraft);

  useEffect(() => {
    void trackEvent("onboarding_started");
  }, []);

  const toggleTopic = (topic: string) => {
    setTopics((current) => (current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]));
  };

  const canContinue = topics.length > 0;

  return (
    <Screen
      title="Set your focus"
      subtitle="A short daily reading shaped to your goals."
      footer={
        <Button
          label="Continue"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canContinue}
          onPress={() => {
            setDraft({ goal, topics, faithAnswers: [] });
            navigation.navigate("FaithQuestions");
          }}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>What would you like most?</Text>
        {GOALS.map((item) => (
          <Pressable key={item} onPress={() => setGoal(item)} style={[styles.option, goal === item && styles.optionActive]}>
            <Text style={[styles.optionText, goal === item && styles.optionTextActive]}>{item}</Text>
          </Pressable>
        ))}

        <Text style={[styles.section, styles.sectionGap]}>Topics that resonate</Text>
        <View style={styles.topicsWrap}>
          {TOPICS.map((item) => (
            <Pressable
              key={item}
              onPress={() => toggleTopic(item)}
              style={[styles.topicPill, topics.includes(item) && styles.topicActive]}
            >
              <Text style={[styles.topicText, topics.includes(item) && styles.topicTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: uiTheme.spacing.lg,
    gap: uiTheme.spacing.xs
  },
  section: {
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.title,
    fontWeight: uiTheme.fontWeight.bold,
    marginTop: uiTheme.spacing.sm
  },
  sectionGap: {
    marginTop: uiTheme.spacing.lg
  },
  option: {
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    borderRadius: uiTheme.radius.md,
    minHeight: 56,
    justifyContent: "center",
    paddingHorizontal: uiTheme.spacing.md,
    backgroundColor: uiTheme.colors.parchment
  },
  optionActive: {
    backgroundColor: uiTheme.colors.deepOlive,
    borderColor: uiTheme.colors.deepOlive
  },
  optionText: {
    color: uiTheme.colors.deepOlive,
    fontWeight: uiTheme.fontWeight.semibold,
    fontSize: uiTheme.typography.body
  },
  optionTextActive: {
    color: uiTheme.colors.parchment
  },
  topicsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: uiTheme.spacing.xs
  },
  topicPill: {
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    borderRadius: uiTheme.radius.pill,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.xs,
    backgroundColor: uiTheme.colors.parchment
  },
  topicActive: {
    backgroundColor: uiTheme.colors.sand,
    borderColor: uiTheme.colors.gold
  },
  topicText: {
    color: uiTheme.colors.olive,
    fontWeight: uiTheme.fontWeight.semibold,
    fontSize: uiTheme.typography.bodySmall
  },
  topicTextActive: {
    color: uiTheme.colors.deepOlive
  }
});
