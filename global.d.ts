// global.d.ts
import type { PixiReactElementProps } from '@pixi/react';
import type { Container, Graphics, Text } from 'pixi.js';

// Augment the @pixi/react module to include types for components 
// that we extend from Pixi.js
declare module '@pixi/react' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface PixiElements {
    // Add built-in components we use:
    pixiContainer: PixiReactElementProps<typeof Container>;
    pixiGraphics: PixiReactElementProps<typeof Graphics>;
    pixiText: PixiReactElementProps<typeof Text>;

    // Add any custom components you might create (if applicable)
    // customViewport: PixiReactElementProps<typeof Viewport>;
  }
}

// Ensure the types for the rest of your app are available globally
export {};