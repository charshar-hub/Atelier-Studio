// Vite dev-server middleware that mirrors the production API routes.
// In production, requests to /api/<action> are handled by Netlify Functions
// in netlify/functions/. This plugin exists only so `vite` (local dev)
// responds to the same routes without needing `netlify dev`.

import { HANDLERS, callClaudeForJson } from './netlify/functions/_lib/handlers.js';

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function makeJsonHandler(env, { systemPrompt, buildUserPrompt, logTag }) {
  return async (req, res, next) => {
    if (req.method !== 'POST') return next();

    const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
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
      res.end(JSON.stringify({ error: err?.message || 'Request failed.' }));
    }
  };
}

export function generateLessonPlugin(env) {
  return {
    name: 'atelier-api',
    configureServer(server) {
      for (const [action, { systemPrompt, buildUserPrompt }] of Object.entries(HANDLERS)) {
        server.middlewares.use(
          `/api/${action}`,
          makeJsonHandler(env, { systemPrompt, buildUserPrompt, logTag: action }),
        );
      }
    },
  };
}
