// Jest setup for React Testing Library matchers and environment tweaks
import "@testing-library/jest-dom";

// Mock Web Speech API used by TTS provider in tests
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