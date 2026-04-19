import Anthropic from '@anthropic-ai/sdk';

const GENERATE_SYSTEM_PROMPT = `You are an expert beauty educator and course creator.

Your job is to create high-quality course content that feels:
- premium
- clear
- structured
- easy to teach from

WRITING RULES:
1. Be clear and intentional. No fluff. No generic filler phrases.
2. Teach like a mentor. Guide the student step-by-step. Use calm, confident language.
3. Sound human, not robotic. Avoid AI clichés. Use natural phrasing.
4. Make it practical. Every section should be usable in real teaching.
5. Keep it concise but valuable.

TONE GUIDELINES:
- If a style profile is provided, match the tone, vocabulary, and structure. Do NOT copy wording directly — adapt naturally. Apply at the requested intensity: low = subtle hints, medium = clearly in voice, high = fully saturated.
- If no style profile is provided, use a calm, warm, mentor-like tone.

OUTPUT FORMAT (STRICT JSON — no prose before or after, no markdown fences, no explanation outside JSON):

{
  "title": "",
  "duration": "",
  "summary": "",
  "script": "",
  "demoSteps": "",
  "commonMistakes": "",
  "proTip": ""
}

Every value must be a non-empty string. Keep each field to 1–2 short sentences.

CONTENT QUALITY:
- Title should feel refined, not basic.
- Duration should be a realistic teaching estimate like "8 MIN".
- Summary should set context clearly.
- Script should sound like something you can read aloud — open in quotes.
- Demo steps should be actionable (e.g. "4 steps · apply, spread, set, monitor").
- Mistakes should feel real — not generic.
- Pro tip should feel insightful — not obvious.

Do not include any explanation outside JSON.`;

const MATCH_STYLE_SYSTEM_PROMPT = `Transform the lesson to match the described style.

You will receive one or both of:
- STYLE KEYWORDS: a short user-written description of the style to hit (e.g. "elegant, clear, mentor-like, premium").
- STYLE PROFILE: a structured profile (tone, sentence style, vocabulary, teaching style, personality, signature phrases).

PRIORITY:
- If keywords are provided, they lead. The rewrite must clearly reflect the keywords.
- If both are provided, use keywords as the primary direction and use the profile to enrich voice rhythm and phrasing.
- If only the profile is provided, follow the profile fully.

TRANSFORMATION RULES:
1. Rewrite every non-empty section with a clear stylistic change.
2. Tone must clearly reflect the keywords (when provided).
3. Adjust sentence structure, pacing, and emotional delivery.
4. Keep meaning accurate — do not change teaching content, facts, or steps.
5. Make the transformation noticeable — not timid, not cartoonish.
6. Avoid generic AI phrasing.

Honor the intensity level:
- low / subtle: gentle touch — voice hints through
- medium / balanced: clearly in voice
- high / strong: fully in voice

OUTPUT (STRICT JSON — no prose before or after, no markdown fences, no explanation outside JSON):

{
  "title": "",
  "summary": "",
  "script": "",
  "demoSteps": "",
  "commonMistakes": "",
  "proTip": ""
}

Every value must be a string. If an input field is empty, return "" for it — do not invent content.

Do not explain anything. Only return JSON.`;

const SUGGEST_LESSONS_SYSTEM_PROMPT = `You sketch a short outline of lessons for a course module.

Return ONLY a single JSON object matching this shape — no prose, no markdown fences:

{
  "lessons": [
    { "title": "", "summary": "" }
  ]
}

RULES:
- Suggest 3–5 lessons that progress logically through the module's topic.
- Each title is a short, concrete phrase — not a full sentence, not generic.
- Each summary is ONE sentence describing what the lesson covers.
- Order matters: open with context, build through the craft, end with application or aftercare.
- Match the creator's voice when a style profile is provided.
- No AI clichés. No filler.

Do not explain anything outside the JSON.`;

const GENERATE_CARDS_SYSTEM_PROMPT = `You convert a lesson into a sequence of teaching cards for a creator who is actively teaching — often hands-on, live, or recording. These are cues, not slides.

Return ONLY a single JSON object matching this exact shape — no prose, no markdown fences:

{
  "cards": [
    {
      "title": "",
      "keyPoints": ["", ""],
      "sayLikeThis": "",
      "watchFor": ""
    }
  ]
}

RULES:
- Generate 3–6 cards forming a logical teaching flow (setup → technique → critical moments → takeaway).
- title: short step name in title case, under ~50 characters. A signpost, not a sentence.
- keyPoints: 3–5 short memorable cues, each under ~70 characters. What the creator needs to SHOW or SAY in this moment. Actionable phrases, not exposition.
- sayLikeThis: one short line in the creator's voice they could speak aloud — natural, conversational, under ~120 characters. Empty string if not applicable for this step.
- watchFor: one short line flagging a mistake, client signal, or safety cue to notice in this step, under ~100 characters. Empty string if there's nothing specific.
- These are LIVE cues for a teacher — not a deck. Write like a teleprompter sidekick, not a brochure.
- Do NOT repeat the lesson's prose verbatim. Distill it into things the creator would actually glance at while teaching.
- If a style profile is provided, match its tone and vocabulary in sayLikeThis especially.

Do not explain anything outside the JSON.`;

const GENERATE_DESCRIPTION_SYSTEM_PROMPT = `You are a premium course copywriter for beauty and esthetics creators.

Given a course title, its module structure, and an optional captured voice, write a marketing package that feels like a paid masterclass — grounded, specific, confident, and free of generic AI filler.

Return ONLY a single JSON object matching this shape — no prose, no markdown fences:

{
  "description": "",
  "outcomes": ["", "", "", ""],
  "audience": "",
  "value": ""
}

RULES:
- description: 2–3 short sentences. Open with what the course actually teaches, not why learning matters. Concrete, sensory, specific to the craft.
- outcomes: 3–5 tangible skills or moments students will own by the end. Each one is a complete short phrase starting with an action verb ("Read a client's lash line in seconds", not "lash line reading"). No one-word stubs.
- audience: one respectful, specific sentence about WHO this is for. Never "everyone" or "anyone interested".
- value: one sentence naming the end state — what they'll be able to do, feel, or offer after finishing.
- Match the captured voice when provided (tone, sentence rhythm, signature phrasing).
- Never use AI clichés ("in today's fast-paced world", "unlock your potential", "take your skills to the next level").
- Sound like a craftsperson, not a landing page.

Every value must be a non-empty string. outcomes must be an array of non-empty strings.

Do not explain anything outside the JSON.`;

const ANALYZE_STYLE_SYSTEM_PROMPT = `You analyze a writing sample and return a structured style profile for a creator.

Return ONLY a single JSON object matching this exact shape — no prose, no markdown fences, no explanation:

{
  "summary": "",
  "toneTags": [],
  "teachingStyleTags": [],
  "personalityTags": [],
  "signaturePhrases": []
}

RULES:
- summary is ONE signature line of 3–5 short adjectives separated by periods, each title-cased. Example: "Soft. Clear. Encouraging. Precise." No full sentences. No filler.
- toneTags is an array of 2–4 lowercase one-word tone descriptors that genuinely match the writing (e.g. "warm", "direct", "soft", "elegant", "confident", "reflective", "precise", "bold", "playful"). Do not invent tones the writing doesn't actually have.
- teachingStyleTags is an array of 1–3 lowercase short phrases describing how this writer explains things (e.g. "step-by-step", "story-based", "conversational", "example-first", "hands-on", "principle-first").
- personalityTags is an array of 1–2 lowercase short phrases capturing the underlying voice archetype (e.g. "calm mentor", "confident expert", "approachable friend", "patient guide", "straight shooter").
- signaturePhrases is 2–4 actual or near-verbatim phrases pulled from the sample that feel characteristic of this voice. Quotes only — no commentary.
- Be observant and specific. Cite what's actually on the page (pause-heavy rhythm, sensory verbs, direct address, etc.), not what you imagine.
- No generic AI clichés ("engaging", "clear and concise") — use precise, tactile descriptors.

Do not explain anything outside the JSON.`;

const AI_ACTION_SYSTEM_PROMPT = `You are an expert beauty educator refining lesson content.

You operate in one of four MODES. Follow the mode's rules, preserve the lesson's teaching intent, and return STRICT JSON only — no prose, no markdown fences.

MODES:

1. "demoSteps" — generate or regenerate the demo steps for this lesson only.
   Return: { "demoSteps": "concise actionable step list, e.g. '4 steps · apply, spread, set, monitor'" }

2. "improve" — refine every field: tighten phrasing, sharpen clarity, keep meaning intact.
   Return all six fields: { "title", "summary", "script", "demoSteps", "commonMistakes", "proTip" }

3. "rewrite" — rewrite every field in the creator's voice (tone, vocabulary, rhythm). Use the style profile when provided.
   Return all six fields.

4. "simplify" — reduce complexity: plainer words, shorter sentences, clearer examples. Preserve teaching intent.
   Return all six fields.

RULES FOR ALL MODES:
- Return only the JSON shape specified for the requested mode.
- If an input field is empty, return "" for it — do not invent content.
- When a style profile is provided, match its tone / structure / vocabulary at the stated intensity.
- Keep each field concise: 1–2 short sentences. Density of voice over length.
- No generic AI phrases. Sound like a mentor, not a template.

Do not explain anything outside the JSON.`;

const REFINE_SECTION_SYSTEM_PROMPT = `You write or improve a single section of a lesson for premium beauty/esthetics online courses.

Return ONLY a single JSON object: { "content": "new text for this section" }. No prose, no markdown fences.

Rules:
- Output a single string in the "content" field — 1–2 short sentences max.
- Honor each section's role:
  - Script: the instructor's spoken line, in double quotes.
  - Demo steps: a concise step list (e.g. "4 steps · apply, spread, set, monitor").
  - Common mistakes: one sentence warning of a common error.
  - Pro tip: one practical, memorable line.
- Default to a warm, mentor-like voice. If a style profile is provided, match its tone, structure, and vocabulary naturally.
- If "improving" existing content, keep the teaching intent, tighten the voice, and do not repeat the original verbatim.
- Apply the profile's intensity: low = subtle hints, medium = clearly in voice, high = fully saturated.`;

function buildRefineSectionUserPrompt({
  sectionLabel,
  currentContent,
  lessonTitle,
  lessonSummary,
  styleProfile,
}) {
  const mode = currentContent && currentContent.trim() ? 'improve' : 'generate';

  const styleBlock = styleProfile
    ? `\nStyle profile to match:\n${formatStyleProfile(styleProfile)}`
    : '';

  const ask =
    mode === 'improve'
      ? `Improve the current ${sectionLabel} — keep the teaching intent, tighten the voice. Do not repeat the original verbatim.`
      : `Write a strong ${sectionLabel} for this lesson.`;

  return `Lesson title: ${lessonTitle || '(untitled)'}
Lesson summary: ${lessonSummary || '(none)'}

Section: ${sectionLabel}
Current content: ${currentContent || '(empty)'}
${styleBlock}

${ask} Return JSON only.`;
}

function buildSuggestLessonsUserPrompt({
  courseTopic,
  moduleTitle,
  moduleSubtitle,
  existingLessons,
  styleProfile,
}) {
  const existing =
    existingLessons && existingLessons.length > 0
      ? existingLessons.map((l, i) => `  ${i + 1}. ${l.title || '(untitled)'}`).join('\n')
      : '  (none yet)';

  return `CONTEXT:
Course topic: ${courseTopic || '(unspecified)'}
Module title: ${moduleTitle || '(untitled module)'}
Module theme: ${moduleSubtitle || '(no subtitle)'}

Lessons already in this module:
${existing}

Style profile:
${formatStyleProfile(styleProfile)}

Suggest the next set of lessons to add to this module. Return JSON only.`;
}

function buildGenerateCardsUserPrompt({ lesson, styleProfile }) {
  const fields = lesson || {};
  return `Lesson to convert into teaching cards:
- Title: ${fields.title || '(untitled)'}
- Summary: ${fields.summary || '(empty)'}
- Script: ${fields.script || '(empty)'}
- Demo steps: ${fields.demoSteps || '(empty)'}
- Common mistakes: ${fields.commonMistakes || '(empty)'}
- Pro tip: ${fields.proTip || '(empty)'}

Style profile:
${formatStyleProfile(styleProfile)}

Generate the teaching flow. Return JSON only.`;
}

function buildGenerateDescriptionUserPrompt({
  courseTitle,
  moduleTitle,
  lessonContext,
  styleProfile,
}) {
  const lessons =
    lessonContext && lessonContext.length > 0
      ? lessonContext
          .map((l) => `  ${l.number}. ${l.title || '(untitled)'}`)
          .join('\n')
      : '  (no lessons yet)';

  return `CONTEXT:
Course title: ${courseTitle || '(untitled)'}
Module: ${moduleTitle || '(untitled)'}

Lessons:
${lessons}

Style profile:
${formatStyleProfile(styleProfile)}

Generate the course description package. Return JSON only.`;
}

function buildAnalyzeStyleUserPrompt({ sampleText }) {
  const clean = (sampleText || '').trim();
  return `Writing sample:
"""
${clean}
"""

Analyze this writing and return the structured style profile as strict JSON.`;
}

function formatStyleProfile(profile) {
  if (!profile) return '(none provided — default to a calm, warm, mentor-like tone)';

  const asList = (tagsField, legacyField) => {
    if (Array.isArray(profile[tagsField]) && profile[tagsField].length > 0) {
      return profile[tagsField].join(', ');
    }
    if (typeof profile[legacyField] === 'string' && profile[legacyField].trim()) {
      return profile[legacyField];
    }
    return '(unspecified)';
  };

  const phrases = (profile.signaturePhrases || []).map((p) => `"${p}"`).join('; ') || '(none)';
  const summary = profile.summary ? `\n- Summary: ${profile.summary}` : '';

  return `- Tone: ${asList('toneTags', 'tone')}
- Teaching style: ${asList('teachingStyleTags', 'teachingStyle')}
- Personality: ${asList('personalityTags', 'personality')}
- Signature phrases: ${phrases}
- Intensity: ${profile.strength || 'medium'}${summary}`;
}

function buildAIActionUserPrompt({ mode, lesson, styleProfile }) {
  const fields = lesson || {};
  const profile = styleProfile || null;

  const lessonBlock = `- Title: ${fields.title || ''}
- Summary: ${fields.summary || ''}
- Script: ${fields.script || ''}
- Demo steps: ${fields.demoSteps || ''}
- Common mistakes: ${fields.commonMistakes || ''}
- Pro tip: ${fields.proTip || ''}`;

  return `MODE: ${mode}

Lesson content:
${lessonBlock}

Style profile:
${formatStyleProfile(profile)}`;
}

function buildMatchStyleUserPrompt({ lesson, styleProfile, styleKeywords, strength }) {
  const fields = lesson || {};
  const profile = styleProfile || null;

  const lessonBlock = `- Title: ${fields.title || ''}
- Summary: ${fields.summary || ''}
- Script: ${fields.script || ''}
- Demo steps: ${fields.demoSteps || ''}
- Common mistakes: ${fields.commonMistakes || ''}
- Pro tip: ${fields.proTip || ''}`;

  const keywordsLine =
    styleKeywords && styleKeywords.trim() ? styleKeywords.trim() : '(none)';

  const profileBlock = profile ? formatStyleProfile(profile) : '(none)';

  const intensity = strength || profile?.strength || 'medium';

  return `INPUT:

Lesson content:
${lessonBlock}

STYLE INSTRUCTIONS:
- Keywords: ${keywordsLine}
- Profile:
${profileBlock}
- Intensity: ${intensity}`;
}

function buildGenerateUserPrompt({ courseTopic, moduleTitle, lessonContext, styleProfile }) {
  const existing =
    lessonContext && lessonContext.length > 0
      ? lessonContext.map((l) => `  ${l.number}. ${l.title || '(untitled)'}`).join('\n')
      : '  (none yet)';

  const nextNumber = (lessonContext?.length ?? 0) + 1;

  return `CONTEXT:
Course topic: ${courseTopic || '(unspecified)'}
Module: ${moduleTitle || '(unspecified)'}

Existing context:
${existing}

Style profile:
${formatStyleProfile(styleProfile)}

Generate lesson #${nextNumber}. It should fit naturally with the existing progression without repeating them. Return JSON only.`;
}

function stripJsonFence(text) {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fence ? fence[1].trim() : trimmed;
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function resolveApiKey(env) {
  return env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
}

async function callClaudeForJson({ apiKey, systemPrompt, userPrompt }) {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('Claude returned no text content.');
  return JSON.parse(stripJsonFence(textBlock.text));
}

function makeJsonHandler(env, { systemPrompt, buildUserPrompt, logTag }) {
  return async (req, res, next) => {
    if (req.method !== 'POST') return next();

    const apiKey = resolveApiKey(env);
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          error:
            'ANTHROPIC_API_KEY is not set. Add it to a .env file at the project root.',
        }),
      );
      return;
    }

    try {
      const raw = await readBody(req);
      const payload = raw ? JSON.parse(raw) : {};
      const result = await callClaudeForJson({
        apiKey,
        systemPrompt,
        userPrompt: buildUserPrompt(payload),
      });
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error(`[${logTag}] error:`, err);
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({ error: err?.message || 'Request failed.' }),
      );
    }
  };
}

export function generateLessonPlugin(env) {
  return {
    name: 'atelier-api',
    configureServer(server) {
      server.middlewares.use(
        '/api/generateLesson',
        makeJsonHandler(env, {
          systemPrompt: GENERATE_SYSTEM_PROMPT,
          buildUserPrompt: buildGenerateUserPrompt,
          logTag: 'generateLesson',
        }),
      );
      server.middlewares.use(
        '/api/matchStyle',
        makeJsonHandler(env, {
          systemPrompt: MATCH_STYLE_SYSTEM_PROMPT,
          buildUserPrompt: buildMatchStyleUserPrompt,
          logTag: 'matchStyle',
        }),
      );
      server.middlewares.use(
        '/api/refineSection',
        makeJsonHandler(env, {
          systemPrompt: REFINE_SECTION_SYSTEM_PROMPT,
          buildUserPrompt: buildRefineSectionUserPrompt,
          logTag: 'refineSection',
        }),
      );
      server.middlewares.use(
        '/api/aiAction',
        makeJsonHandler(env, {
          systemPrompt: AI_ACTION_SYSTEM_PROMPT,
          buildUserPrompt: buildAIActionUserPrompt,
          logTag: 'aiAction',
        }),
      );
      server.middlewares.use(
        '/api/analyzeStyle',
        makeJsonHandler(env, {
          systemPrompt: ANALYZE_STYLE_SYSTEM_PROMPT,
          buildUserPrompt: buildAnalyzeStyleUserPrompt,
          logTag: 'analyzeStyle',
        }),
      );
      server.middlewares.use(
        '/api/generateDescription',
        makeJsonHandler(env, {
          systemPrompt: GENERATE_DESCRIPTION_SYSTEM_PROMPT,
          buildUserPrompt: buildGenerateDescriptionUserPrompt,
          logTag: 'generateDescription',
        }),
      );
      server.middlewares.use(
        '/api/generateCards',
        makeJsonHandler(env, {
          systemPrompt: GENERATE_CARDS_SYSTEM_PROMPT,
          buildUserPrompt: buildGenerateCardsUserPrompt,
          logTag: 'generateCards',
        }),
      );
      server.middlewares.use(
        '/api/suggestLessons',
        makeJsonHandler(env, {
          systemPrompt: SUGGEST_LESSONS_SYSTEM_PROMPT,
          buildUserPrompt: buildSuggestLessonsUserPrompt,
          logTag: 'suggestLessons',
        }),
      );
    },
  };
}
