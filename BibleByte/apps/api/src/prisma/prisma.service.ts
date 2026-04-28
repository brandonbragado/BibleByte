import { Injectable } from "@nestjs/common";

type Lesson = {
  id: string;
  dateKey: string;
  title: string;
  estimatedMinutes: number;
  nivContentStatus: string;
  segments: Array<{
    id: string;
    verseReference: string;
    scriptureTextPlaceholder: string;
    contextExplanation: string;
    reflectionQuestion: string;
    actionPrompt: string;
    orderIndex: number;
  }>;
};

type AppUser = {
  id: string;
  supabaseAuthUserId: string;
  provider: string;
  createdAt: string;
  lastSignInAt: string;
  deletedAt: string | null;
};

@Injectable()
export class PrismaService {
  private readonly users = new Map<string, AppUser>();
  private readonly lessons: Lesson[] = [
    {
      id: "lesson-2026-04-25",
      dateKey: "2026-04-25",
      title: "Trust in God's Direction",
      estimatedMinutes: 5,
      nivContentStatus: "placeholder_only",
      segments: [
        {
          id: "segment-1",
          verseReference: "Proverbs 3:5-6 (NIV placeholder)",
          scriptureTextPlaceholder: "TODO[NIV_LICENSE]: Licensed NIV text renders here.",
          contextExplanation: "Trust replaces self-dependence as a discipleship practice.",
          reflectionQuestion: "Where do you need to hand your plans to God?",
          actionPrompt: "Pray before your next important decision.",
          orderIndex: 0
        }
      ]
    }
  ];

  private readonly snippets = [
    {
      id: "snippet-2026-04-25",
      dateKey: "2026-04-25",
      verseReference: "Psalm 119:105 (NIV placeholder)",
      snippetTextPlaceholder: "TODO[NIV_LICENSE]: Licensed NIV snippet appears here.",
      cachedUntil: "2026-04-26T00:00:00.000Z"
    }
  ];

  getTodayLesson() {
    return this.lessons[0];
  }

  getLessonHistory(cursor?: string) {
    return this.lessons.filter((item) => (!cursor ? true : item.dateKey < cursor));
  }

  getTodaySnippet() {
    return this.snippets[0];
  }

  upsertUserFromAuth(input: { sub: string; provider: string }) {
    const existing = this.users.get(input.sub);
    if (existing) {
      const updated: AppUser = { ...existing, lastSignInAt: new Date().toISOString(), provider: input.provider };
      this.users.set(input.sub, updated);
      return updated;
    }

    const created: AppUser = {
      id: `user-${this.users.size + 1}`,
      supabaseAuthUserId: input.sub,
      provider: input.provider,
      createdAt: new Date().toISOString(),
      lastSignInAt: new Date().toISOString(),
      deletedAt: null
    };
    this.users.set(input.sub, created);
    return created;
  }

  markUserDeleted(sub: string) {
    const existing = this.users.get(sub);
    if (!existing) {
      return null;
    }

    const deleted: AppUser = { ...existing, deletedAt: new Date().toISOString() };
    this.users.set(sub, deleted);
    return deleted;
  }
}
