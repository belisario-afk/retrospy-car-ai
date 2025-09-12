import { webcrypto as nodeWebcrypto } from "crypto";
import { generateCodeChallenge } from "../lib/spotify/pkce";

// Make the test self-sufficient: ensure window.crypto.subtle is present
beforeAll(() => {
  const nodeCrypto = nodeWebcrypto as unknown as Crypto;

  const ensureCrypto = (target: object) => {
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
      ensureCrypto(globalThis);
    }
  }
  if (typeof window !== "undefined") {
    const w = window as unknown as { crypto?: Crypto };
    if (!w.crypto || typeof w.crypto.subtle === "undefined") {
      ensureCrypto(window);
    }
  }
});

test("PKCE utils › generates expected code challenge for known verifier", async () => {
  // Example from RFC 7636 Section 4.2
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const challenge = await generateCodeChallenge(verifier);
  expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
});