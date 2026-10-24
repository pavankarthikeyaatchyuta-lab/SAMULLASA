import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseNaturalLanguageChange } from '@/lib/scenario-engine';
import type { ChangeProposal } from '@/types/events';

// Strict runtime schema validation for incoming client payload
const InterpretRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(2000, 'Prompt exceeds 2000 characters'),
  currentGuestCount: z.number().int().nonnegative().optional(),
  budgetCeilingPaise: z.number().int().nonnegative().optional(),
});

// Runtime validation schema for LLM outputs to protect deterministic domain logic
const ChangeItemSchema = z.object({
  type: z.enum([
    'guest_count',
    'budget',
    'add_item',
    'remove_item',
    'modify_item',
    'preference',
    'date',
    'venue',
  ]),
  field: z.string().max(100),
  currentValue: z.union([z.string(), z.number()]).optional(),
  proposedValue: z.union([z.string(), z.number()]),
  reason: z.string().max(500),
});

const ChangeProposalSchema = z.object({
  description: z.string().max(1000),
  changes: z.array(ChangeItemSchema),
  preserveFields: z.array(z.string().max(100)),
  ambiguities: z.array(z.string().max(500)),
});

export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload in request body.' },
        { status: 400 },
      );
    }

    const parseResult = InterpretRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed for request parameters.',
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 400 },
      );
    }

    const { prompt } = parseResult.data;

    // External LLM attempt when API key is provided
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    if (apiKey) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
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
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsedJson = JSON.parse(rawText);
            const validatedProposal = ChangeProposalSchema.safeParse(parsedJson);
            if (validatedProposal.success) {
              return NextResponse.json({
                proposal: validatedProposal.data as ChangeProposal,
                source: `gemini-${model}`,
              });
            }
          }
        }
      } catch {
        // Fall through to deterministic fallback
      } finally {
        // Always reliably release the timeout handle
        clearTimeout(timeoutId);
      }

      // External API configured but returned non-200, invalid output, or timed out
      const proposal = parseNaturalLanguageChange(prompt);
      return NextResponse.json({
        proposal,
        source: 'deterministic-fallback',
      });
    }

    // High-performance deterministic engine when no API key is provided
    const proposal = parseNaturalLanguageChange(prompt);
    return NextResponse.json({
      proposal,
      source: 'deterministic-local',
    });
  } catch {
    // Never disclose internal error details or stack traces to clients
    return NextResponse.json(
      { error: 'An unexpected internal error occurred while parsing the change proposal.' },
      { status: 500 },
    );
  }
}
