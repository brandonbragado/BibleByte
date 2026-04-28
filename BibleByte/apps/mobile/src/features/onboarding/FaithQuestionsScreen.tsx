import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { uiTheme } from "@biblebites/ui";
import { Button, Screen } from "../../components/ui";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { useAppStore } from "../../state/appStore";

type Props = NativeStackScreenProps<RootStackParamList, "FaithQuestions">;

const QUESTION_GROUPS = [
  {
    title: "What would help most right now?",
    options: ["Consistency", "Deeper understanding", "Peace in hard seasons"]
  },
  {
    title: "How do you want to grow this month?",
    options: ["Praying daily", "Applying scripture", "Building trust in God"]
  }
] as const;

export function FaithQuestionsScreen({ navigation }: Props) {
  const onboardingDraft = useAppStore((state) => state.onboardingDraft);
  const setDraft = useAppStore((state) => state.setOnboardingDraft);
  const [answers, setAnswers] = useState<string[]>(onboardingDraft?.faithAnswers ?? []);

  const toggle = (value: string) => {
    setAnswers((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  if (!onboardingDraft) {
    navigation.replace("Goal");
    return null;
  }

  return (
    <Screen
      title="A few faith questions"
      subtitle="Pick what fits you. This shapes only your selected learning path."
      footer={
        <Button
          label="Continue"
          variant="primary"
          size="lg"
          fullWidth
          disabled={answers.length === 0}
          onPress={() => {
            setDraft({ ...onboardingDraft, faithAnswers: answers });
            navigation.navigate("Reminder");
          }}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {QUESTION_GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.options}>
              {group.options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => toggle(option)}
                  style={[styles.option, answers.includes(option) && styles.optionActive]}
                >
                  <Text style={[styles.optionText, answers.includes(option) && styles.optionTextActive]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: uiTheme.spacing.lg,
    gap: uiTheme.spacing.lg
  },
  group: {
    gap: uiTheme.spacing.xs
  },
  groupTitle: {
    fontWeight: uiTheme.fontWeight.bold,
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.title
  },
  options: {
    gap: uiTheme.spacing.xs
  },
  option: {
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    borderRadius: uiTheme.radius.md,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: uiTheme.spacing.md,
    backgroundColor: uiTheme.colors.parchment
  },
  optionActive: {
    backgroundColor: uiTheme.colors.deepOlive,
    borderColor: uiTheme.colors.deepOlive
  },
  optionText: {
    color: uiTheme.colors.olive,
    fontWeight: uiTheme.fontWeight.semibold,
    fontSize: uiTheme.typography.body
  },
  optionTextActive: {
    color: uiTheme.colors.parchment
  }
});
