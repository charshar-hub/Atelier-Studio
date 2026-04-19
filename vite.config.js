import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { generateLessonPlugin } from './api-plugin.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), generateLessonPlugin(env)],
  };
});
