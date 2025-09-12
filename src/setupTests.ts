// Jest setup for React Testing Library matchers and environment tweaks
import "@testing-library/jest-dom";

// 1) TextEncoder/TextDecoder from Node for environments that lack them
import {
  TextEncoder as NodeTextEncoder,
  TextDecoder as NodeTextDecoder
} from "util";

// 2) WebCrypto via Node's webcrypto (used as a fallback for tests)
import { webcrypto } from "crypto";

// Ensure TextEncoder/TextDecoder exist on globalThis
(() => {
  if (typeof globalThis.TextEncoder === "undefined") {
    Object.defineProperty(globalThis, "TextEncoder", {
      configurable: true,
      writable: true,
      value: NodeTextEncoder as unknown as typeof TextEncoder
    });
  }
  if (typeof globalThis.TextDecoder === "undefined") {
    Object.defineProperty(globalThis, "TextDecoder", {
      configurable: true,
      writable: true,
      value: NodeTextDecoder as unknown as typeof TextDecoder
    });
  }
})();

// Ensure crypto (with subtle) is available on both globalThis and window
(() => {
  const nodeCrypto = webcrypto as unknown as Crypto;

  const defineCrypto = (target: object) => {
    try {
      Object.defineProperty(target, "crypto", {
        configurable: true,
        writable: true,
        value: nodeCrypto
      });
    } catch {
      (target as Record<string, unknown>).crypto = nodeCrypto;
    }
  };

  if (typeof globalThis !== "undefined") {
    const g = globalThis as unknown as { crypto?: Crypto };
    if (!g.crypto || typeof g.crypto.subtle === "undefined") {
      defineCrypto(globalThis);
    }
  }

  if (typeof window !== "undefined") {
    const w = window as unknown as { crypto?: Crypto };
    if (!w.crypto || typeof w.crypto.subtle === "undefined") {
      defineCrypto(window);
    }
  }
})();

// 3) Mock Web Speech API used by TTS provider in tests
(() => {
  const mockSpeechSynthesis: Partial<SpeechSynthesis> = {
    speak: jest.fn(),
    cancel: jest.fn(),
    paused: false,
    pending: false,
    speaking: false,
    getVoices: () => [],
    pause: jest.fn(),
    resume: jest.fn(),
    onvoiceschanged: null
  };

  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    writable: true,
    value: mockSpeechSynthesis as SpeechSynthesis
  });
})();