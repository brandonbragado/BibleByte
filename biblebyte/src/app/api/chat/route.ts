import { NextResponse } from "next/server";

import { generateCompanionBlocks } from "@/lib/companion/llm";
import { rateLimitResponse } from "@/lib/rate-limit/memory";

/** Legacy/demo HTTP endpoint — companion UI uses server actions + persistence on `/home`. */
export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "chat");
  if (limited) return limited;

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

  try {
    const { blocks, demo } = await generateCompanionBlocks(prompt);
    return NextResponse.json({ blocks, demo });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Companion temporarily unavailable." },
      { status: 503 }
    );
  }
}
