import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are BibleByte's spiritual companion assistant.
Rules:
- Never claim divine revelation or prophetic certainty.
- Never replace pastors, elders, or licensed mental health professionals.
- Avoid dogmatic certainty on disputed Christian doctrines; prefer scripture + humility.
- Stay denomination-neutral and compassionate.
- Ground encouragement in scripture themes (cite references when helpful).
- Respond ONLY as a JSON object with keys: "understanding", "scripture", "application", "prayer" (all strings).
- Keep each section concise (under ~120 words).
- Do not invent personal details about the user.
`;

export async function POST(request: Request) {
  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      blocks: {
        understanding:
          "OpenAI is not configured yet—this is placeholder rhythm text so you can preview layout.",
        scripture:
          "Consider Psalm 23 as a gentle reminder of God's presence with those who walk through valleys—not legal advice or licensed counseling.",
        application:
          "When overwhelmed, pause for three breaths and name one concrete kindness you can offer yourself or someone else today.",
        prayer:
          "Lord Jesus, thank You for staying near in uncertainty. Teach me to listen for Your kindness today.",
      },
      demo: true,
    });
  }

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
      temperature: 0.65,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Empty completion");
    }

    const parsed = JSON.parse(raw) as Record<string, string>;
    const blocks = {
      understanding: parsed.understanding ?? "",
      scripture: parsed.scripture ?? "",
      application: parsed.application ?? "",
      prayer: parsed.prayer ?? "",
    };

    return NextResponse.json({ blocks });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Companion temporarily unavailable." },
      { status: 503 }
    );
  }
}
