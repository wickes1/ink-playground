import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'child_process';

function getGitVersion(): string {
  try {
    // Get tag if HEAD is tagged, otherwise get short commit hash
    const tag = execSync('git describe --tags --exact-match 2>/dev/null || git describe --tags 2>/dev/null || git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    return tag;
  } catch {
    return 'dev';
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
