import * as fs from 'fs';
import * as path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig((configEnv) => ({
  plugins: [react(), tsconfigPaths()],
  build: {
    rollupOptions: {
      plugins: [mediapipe_workaround()],
    },
  },
}));

function mediapipe_workaround() {
  return {
    name: 'mediapipe_workaround',
    load(id) {
      if (path.basename(id) === 'hands.js') {
        let code = fs.readFileSync(id, 'utf-8');
        code += 'exports.Hands = Hands;';
        return { code };
      } else {
        return null;
      }
    },
  };
}
