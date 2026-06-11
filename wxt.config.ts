import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

export default defineConfig({
  srcDir: 'src',
  alias: { '@': 'src' },
  vite: () => ({ plugins: [preact()] }),
  manifest: {
    name: 'StopYappingBro',
    description: 'Copy YouTube transcripts and summarize with ChatGPT',
    permissions: ['storage'],
    host_permissions: ['https://www.youtube.com/*', 'https://chatgpt.com/*'],
    icons: {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
    action: {
      default_icon: {
        16: 'icons/icon16.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png',
      },
    },
  },
});
