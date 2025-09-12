import '@testing-library/jest-dom';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeAll(() => {
  // Mock scrollIntoView to avoid errors in JSDOM
  Element.prototype.scrollIntoView = vi.fn();

  // Polyfill ResizeObserver for recharts ResponsiveContainer
  if (!(globalThis as any).ResizeObserver) {
    (globalThis as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  }
});

afterEach(() => {
  cleanup();
});


