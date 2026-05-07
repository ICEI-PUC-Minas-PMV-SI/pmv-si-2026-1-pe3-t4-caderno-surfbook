import type { Preview } from "@storybook/nextjs-vite";

import "../app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "surface",
      values: [
        { name: "surface", value: "oklch(1 0 0)" },
        { name: "bg",      value: "oklch(0.99 0.002 250)" },
        { name: "muted",   value: "oklch(0.96 0.004 250)" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' = mostra violações no painel; 'error' = falha CI; 'off' = desliga
      test: "todo",
    },
  },
};

export default preview;
