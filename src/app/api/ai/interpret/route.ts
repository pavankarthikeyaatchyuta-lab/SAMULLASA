import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguageChange } from '@/lib/scenario-engine';
import type { ChangeProposal } from '@/types/events';

interface InterpretRequestBody {
  prompt?: string;
  currentGuestCount?: number;
  budgetCeilingPaise?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InterpretRequestBody;
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string.' },
        { status: 400 },
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: 'Prompt exceeds the 2000 character maximum limit.' },
        { status: 400 },
      );
    }

    // Attempt external LLM if GEMINI_API_KEY is configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const systemPrompt = `You are an event planning change interpreter.
Extract structured change requests from user instructions into JSON.
Return JSON adhering to:
{
  "description": string,
  "changes": [
    {
      "type": "guest_count" | "budget" | "add_item" | "remove_item" | "modify_item" | "preference" | "date" | "venue",
      "field": string,
      "proposedValue": number | string,
      "reason": string
    }
  ],
  "preserveFields": string[],
  "ambiguities": string[]
}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\nUser instruction: "${prompt}"` }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText) as ChangeProposal;
            if (parsed && Array.isArray(parsed.changes)) {
              return NextResponse.json({
                proposal: parsed,
                source: 'gemini-ai',
              });
            }
          }
        }
      } catch {
        // Fall back seamlessly to deterministic engine
      }
    }

    // High-performance deterministic fallback
    const proposal = parseNaturalLanguageChange(prompt);
    return NextResponse.json({
      proposal,
      source: 'deterministic-engine',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error while parsing request', details: message },
      { status: 500 },
    );
  }
}
