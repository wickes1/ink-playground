import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'child_process';

function getGitVersion(): string {
  try {
    // 1. If HEAD is exactly on a tag, use the tag
    const tag = execSync('git describe --tags --exact-match 2>/dev/null', { encoding: 'utf-8' }).trim();
    return tag;
  } catch {
    try {
      // 2. Otherwise, use truncated commit SHA
      const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
      return sha;
    } catch {
      return 'dev';
    }
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(getGitVersion()),
  },
  plugins: [react(), tailwindcss()],
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
