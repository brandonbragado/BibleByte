"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GROWTH_OPTIONS,
  SEASON_OPTIONS,
  LEARNING_OPTIONS,
  TIME_OPTIONS,
  SUPPORT_OPTIONS,
} from "@/lib/onboarding/options";

type Step = 0 | 1 | 2 | 3 | 4;

const steps = [
  {
    title: "What are you hoping to grow in right now?",
    subtitle: "Choose what resonates most today—there is no wrong answer.",
  },
  {
    title: "What season are you currently in?",
    subtitle: "Naming the season helps BibleByte walk with you gently.",
  },
  {
    title: "How do you prefer to learn?",
    subtitle: "We will shape your daily rhythm around this.",
  },
  {
    title: "How much time can you give daily?",
    subtitle: "Small, honest steps build lasting habits.",
  },
  {
    title: "What support would help most?",
    subtitle: "We use this to prioritize tone, nudges, and guidance.",
  },
] as const;

function buildTags(selections: Record<string, string>) {
  return [
    `grow:${selections.growth}`,
    `season:${selections.season}`,
    `learn:${selections.learning}`,
    `time:${selections.time_minutes}m`,
    `support:${selections.support}`,
  ];
}

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [selections, setSelections] = useState({
    growth: "",
    season: "",
    learning: "",
    time_minutes: "",
    support: "",
  });

  const progress = useMemo(() => ((step + 1) / 5) * 100, [step]);

  const currentKey = ["growth", "season", "learning", "time_minutes", "support"][step] as keyof typeof selections;

  const canNext = selections[currentKey]?.length > 0;

  function select(value: string) {
    setSelections((s) => ({ ...s, [currentKey]: value }));
  }

  async function handleFinish() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    const tags = buildTags({
      growth: selections.growth,
      season: selections.season,
      learning: selections.learning,
      time_minutes: selections.time_minutes,
      support: selections.support,
    });

    const onboardingData = {
      growth_focus: selections.growth,
      season: selections.season,
      learning_style: selections.learning,
      daily_minutes: selections.time_minutes,
      support_need: selections.support,
    };

    const { error } = await supabase.from("user_profiles").upsert(
      {
        id: user.id,
        onboarding_completed: true,
        spiritual_tags: tags,
        onboarding_data: onboardingData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    setLoading(false);
    if (error) {
      console.error(error);
      alert("We could not save your profile yet. Check your connection and Supabase table setup.");
      return;
    }

    router.replace("/home");
    router.refresh();
  }

  function goNext() {
    if (step < 4) {
      setStep((s) => (s + 1) as Step);
      return;
    }
    void handleFinish();
  }

  function goBack() {
    if (step > 0) {
      setStep((s) => (s - 1) as Step);
    }
  }

  const optionsList = [
    GROWTH_OPTIONS,
    SEASON_OPTIONS,
    LEARNING_OPTIONS,
    TIME_OPTIONS,
    SUPPORT_OPTIONS,
  ][step];

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <Card className="border-primary/10 bg-card/95 shadow-soft backdrop-blur-md">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/85">
            Step {step + 1} of 5
          </p>
          <CardTitle className="font-display text-2xl leading-tight">
            {steps[step].title}
          </CardTitle>
          <CardDescription>{steps[step].subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="grid gap-2"
            >
              {optionsList.map((opt) => {
                const active = selections[currentKey] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => select(opt.value)}
                    className={`rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${
                      active
                        ? "border-primary bg-primary/12 text-primary shadow-soft"
                        : "border-border/80 bg-background/60 hover:border-primary/40 hover:bg-accent/60"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-primary/20"
              disabled={step === 0 || loading}
              onClick={goBack}
            >
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={!canNext || loading}
              onClick={goNext}
            >
              {step === 4 ? (loading ? "Saving…" : "Finish") : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
