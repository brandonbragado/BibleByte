import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lesson = await prisma.lesson.upsert({
    where: { dateKey: "2026-04-25" },
    update: {},
    create: {
      dateKey: "2026-04-25",
      title: "Trust in God's Direction",
      estimatedMinutes: 5,
      nivContentStatus: "placeholder_only"
    }
  });

  await prisma.segment.upsert({
    where: { id: "seed-segment-1" },
    update: {},
    create: {
      id: "seed-segment-1",
      lessonId: lesson.id,
      verseReference: "Proverbs 3:5-6 (NIV placeholder)",
      scriptureTextPlaceholder: "TODO[NIV_LICENSE]: Licensed NIV scripture text required before production.",
      contextExplanation: "The proverb calls believers to trust God over self-direction.",
      reflectionQuestion: "What are you carrying alone today?",
      actionPrompt: "Invite God into one concrete decision.",
      orderIndex: 0
    }
  });

  await prisma.snippet.upsert({
    where: { dateKey: "2026-04-25" },
    update: {},
    create: {
      dateKey: "2026-04-25",
      verseReference: "Psalm 119:105 (NIV placeholder)",
      snippetTextPlaceholder: "TODO[NIV_ATTRIBUTION]: Add licensed NIV text and legal attribution block.",
      cachedUntil: new Date("2026-04-26T00:00:00.000Z")
    }
  });
}

void main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
