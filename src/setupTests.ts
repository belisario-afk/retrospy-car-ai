// Jest setup for React Testing Library matchers and environment tweaks
import "@testing-library/jest-dom";

// Polyfills for Node test environment

// 1) TextEncoder/TextDecoder
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from "util";
if (!(global as any).TextEncoder) {
  (global as any).TextEncoder = NodeTextEncoder;
}
if (!(global as any).TextDecoder) {
  (global as any).TextDecoder = NodeTextDecoder as unknown as typeof TextDecoder;
}

// 2) WebCrypto subtle.digest via Node's webcrypto
import { webcrypto } from "crypto";
if (!(global as any).crypto) {
  (global as any).crypto = webcrypto;
}
if (!(window as any).crypto) {
  (window as any).crypto = webcrypto as unknown as Crypto;
}

// 3) Mock Web Speech API used by TTS provider in tests
Object.defineProperty(window, "speechSynthesis", {
  writable: true,
  value: {
    speak: jest.fn(),
    cancel: jest.fn(),
    paused: false,
    pending: false,
    speaking: false,
    getVoices: () => []
  }
});