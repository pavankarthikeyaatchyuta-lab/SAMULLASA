import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { AIRecommendation } from '@/types/events';

const RecommendRequestSchema = z.object({
  eventType: z.enum(['wedding', 'birthday', 'community']).optional().default('wedding'),
  guestCount: z.number().int().nonnegative().optional().default(100),
  budgetCeilingPaise: z.number().int().nonnegative().optional().default(50000000),
  preferences: z
    .object({
      culturalStyle: z.string().max(100).optional(),
      dietaryRequirements: z.array(z.string().max(100)).optional(),
      theme: z.string().max(100).optional(),
      priorityAreas: z.array(z.string().max(100)).optional(),
    })
    .optional(),
  accessibilityRequirements: z.array(z.string().max(150)).optional().default([]),
});

const RecommendationItemSchema = z.object({
  id: z.string().max(100),
  category: z.string().max(100),
  title: z.string().max(200),
  description: z.string().max(1000),
  estimatedCostPaise: z.number().nonnegative().optional(),
  rationale: z.string().max(1000),
  tags: z.array(z.string().max(50)),
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

    const parseResult = RecommendRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed for recommendation parameters.',
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 400 },
      );
    }

    const {
      eventType,
      guestCount,
      budgetCeilingPaise: budgetPaise,
      preferences,
      accessibilityRequirements: accessibility,
    } = parseResult.data;

    const culturalStyle = preferences?.culturalStyle || 'Traditional Indian';
    const dietary = preferences?.dietaryRequirements || ['Vegetarian'];

    // External LLM attempt if configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const prompt = `Generate 4 personalized, culturally resonant planning recommendations for a ${eventType}.
Guest count: ${guestCount}
Budget ceiling: ₹${(budgetPaise / 100).toLocaleString('en-IN')}
Cultural style: ${culturalStyle}
Dietary requirements: ${dietary.join(', ')}
Accessibility requirements: ${accessibility.join(', ')}

Return a JSON array of recommendation objects adhering to:
[
  {
    "id": string,
    "category": string,
    "title": string,
    "description": string,
    "estimatedCostPaise": number,
    "rationale": string,
    "tags": string[]
  }
]`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
            const parsed = JSON.parse(rawText);
            const validated = z.array(RecommendationItemSchema).safeParse(parsed);
            if (validated.success && validated.data.length > 0) {
              return NextResponse.json({
                recommendations: validated.data.map((item, idx) => ({
                  ...item,
                  id: item.id || `rec-llm-${idx + 1}`,
                  isGenerated: true,
                })),
                source: 'gemini-ai',
              });
            }
          }
        }
      } catch {
        // Fall back gracefully to deterministic rule-based generator
      }
    }

    // High quality deterministic recommendations personalized to parameters
    const recommendations: AIRecommendation[] = [];

    if (eventType === 'wedding') {
      recommendations.push({
        id: 'rec-wed-1',
        category: 'catering',
        title: `${culturalStyle} Authentic Live Counters`,
        description: `Incorporate live traditional culinary stations catering to ${dietary.join(', ')} preferences, creating interactive engagement for ${guestCount} guests.`,
        estimatedCostPaise: Math.round(budgetPaise * 0.12),
        rationale: `Directly honors ${culturalStyle} culinary customs while accommodating dietary needs.`,
        isGenerated: false,
        tags: ['Catering', culturalStyle, 'Interactive'],
      });

      recommendations.push({
        id: 'rec-wed-2',
        category: 'decoration',
        title: 'Sustainable Floral Mandap & Eco-Drape Design',
        description: 'Locally sourced marigolds, jasmine, banana foliage, and reusable brass accents that reduce floral waste while amplifying festive elegance.',
        estimatedCostPaise: Math.round(budgetPaise * 0.08),
        rationale: 'Cost-effective, sustainable styling aligned with classic festive aesthetics.',
        isGenerated: false,
        tags: ['Decor', 'Sustainable', 'Aesthetic'],
      });

      if (accessibility.length > 0) {
        recommendations.push({
          id: 'rec-wed-3',
          category: 'venue',
          title: 'Inclusive Mobility & Sightline Flow Architecture',
          description: `Wide ramps at dais entry, step-free access for elders, and priority reserved seating zones with clear audio projection for ${accessibility.join(' & ')}.`,
          estimatedCostPaise: Math.round(budgetPaise * 0.03),
          rationale: 'Fulfills stated accessibility commitments seamlessly without separate segregated areas.',
          isGenerated: false,
          tags: ['Accessibility', 'Inclusion', 'Venue'],
        });
      }

      recommendations.push({
        id: 'rec-wed-4',
        category: 'entertainment',
        title: 'Acoustic Folk Ensemble & Fusion Sangeet Medley',
        description: 'Live instrumental nadaswaram/shehnai welcome followed by an upbeat acoustic set for all generations.',
        estimatedCostPaise: Math.round(budgetPaise * 0.05),
        rationale: 'Creates ceremonial gravitas during welcomes and lively celebratory mood during festivities.',
        isGenerated: false,
        tags: ['Music', 'Ceremony', 'Entertainment'],
      });
    } else if (eventType === 'birthday') {
      recommendations.push({
        id: 'rec-bday-1',
        category: 'entertainment',
        title: 'Interactive Milestone Trivia & Custom Photo Walk',
        description: 'Curated retrospective photo installation and mobile-based interactive quiz celebrating memorable life moments.',
        estimatedCostPaise: Math.round(budgetPaise * 0.06),
        rationale: 'High emotional resonance with minimal incremental material expense.',
        isGenerated: false,
        tags: ['Interactive', 'Memories', 'Milestone'],
      });

      recommendations.push({
        id: 'rec-bday-2',
        category: 'catering',
        title: 'Artisanal Dessert & Mocktail Experience',
        description: `Curated dessert bar with dietary labels (${dietary.join(', ')}) and custom signature non-alcoholic refreshments.`,
        estimatedCostPaise: Math.round(budgetPaise * 0.15),
        rationale: 'Highlights celebratory focal points that delight guests of all ages.',
        isGenerated: false,
        tags: ['Desserts', 'Culinary', 'Trending'],
      });
    } else {
      // Community event
      recommendations.push({
        id: 'rec-comm-1',
        category: 'logistics',
        title: 'Staggered Arrival Badging & Digital Map Guide',
        description: 'QR-based contactless attendee check-in and dynamic schedule display on mobile for crowd safety.',
        estimatedCostPaise: Math.round(budgetPaise * 0.05),
        rationale: `Prevents queuing bottlenecks for ${guestCount} participants.`,
        isGenerated: false,
        tags: ['Operations', 'Crowd Safety', 'Digital'],
      });

      recommendations.push({
        id: 'rec-comm-2',
        category: 'equipment',
        title: 'Community Sound System & Assistive Listening Loop',
        description: 'Omnidirectional multi-zone speakers with assistive RF listening packs for clear announcements everywhere.',
        estimatedCostPaise: Math.round(budgetPaise * 0.10),
        rationale: 'Ensures civic speeches and cultural performances reach all attendees clearly.',
        isGenerated: false,
        tags: ['Audio', 'Accessibility', 'Public Address'],
      });
    }

    return NextResponse.json({
      recommendations,
      source: 'deterministic-personalization-engine',
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected internal error occurred while generating recommendations.' },
      { status: 500 },
    );
  }
}
