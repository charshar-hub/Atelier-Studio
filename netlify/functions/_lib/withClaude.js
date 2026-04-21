import { HANDLERS, callClaudeForJson } from './handlers.js';

// Shared Netlify Function wrapper. Each action in HANDLERS (generateLesson,
// matchStyle, …) gets a one-line function file that calls
// `makeHandler('<action>')`. This keeps all HTTP/env plumbing in one place —
// no logic changes versus the original Vercel handler.
export function makeHandler(actionKey) {
  const route = HANDLERS[actionKey];
  if (!route) {
    // Misconfig → fail loud at module load, not per-request.
    throw new Error(`Unknown action for Netlify handler: ${actionKey}`);
  }

  return async (event) => {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { Allow: 'POST', 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed.' }),
      };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error(`[${actionKey}] ANTHROPIC_API_KEY is not set in Netlify env.`);
      return {
        statusCode: 500,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          error:
            'ANTHROPIC_API_KEY is not configured. Add it under Netlify → Site Settings → Environment Variables and redeploy.',
        }),
      };
    }

    let payload;
    try {
      payload = event.body ? JSON.parse(event.body) : {};
    } catch {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON body.' }),
      };
    }

    try {
      const result = await callClaudeForJson({
        apiKey,
        systemPrompt: route.systemPrompt,
        userPrompt: route.buildUserPrompt(payload),
      });
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(result),
      };
    } catch (err) {
      console.error(`[${actionKey}] error:`, err);
      const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
      return {
        statusCode: status,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: err?.message || 'Request failed.' }),
      };
    }
  };
}
