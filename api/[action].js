// Vercel serverless function. Handles every /api/<action> route the frontend
// calls (generateLesson, matchStyle, refineSection, aiAction, analyzeStyle,
// generateDescription, generateCards, suggestLessons) by dispatching on the
// dynamic [action] segment.
//
// REQUIRED VERCEL ENV VAR (set in Project Settings → Environment Variables):
//   ANTHROPIC_API_KEY   — your Anthropic key, scoped to Production (and
//                         Preview/Development if you want previews to work).
// Never expose this key with a VITE_ prefix; that would ship it to the browser.

import { HANDLERS, callClaudeForJson } from './_lib/handlers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { action } = req.query;
  const route = HANDLERS[action];
  if (!route) {
    return res.status(404).json({ error: `Unknown action: ${action}` });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(`[${action}] ANTHROPIC_API_KEY is not set in the Vercel environment.`);
    return res.status(500).json({
      error:
        'ANTHROPIC_API_KEY is not configured. Add it under Vercel Project Settings → Environment Variables and redeploy.',
    });
  }

  // Vercel parses JSON bodies automatically when content-type is application/json.
  // Fall back to manual parsing if a client sent a raw string.
  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = payload ? JSON.parse(payload) : {};
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body.' });
    }
  }
  payload = payload || {};

  try {
    const result = await callClaudeForJson({
      apiKey,
      systemPrompt: route.systemPrompt,
      userPrompt: route.buildUserPrompt(payload),
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error(`[${action}] error:`, err);
    const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
    return res.status(status).json({
      error: err?.message || 'Request failed.',
    });
  }
}
