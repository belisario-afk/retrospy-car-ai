// PKCE utilities

function base64urlencode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa only supports binary strings
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getCrypto(): Crypto | undefined {
  // Prefer window.crypto in browsers
  if (typeof window !== "undefined") {
    const win = window as unknown as { crypto?: Crypto };
    if (win.crypto && typeof win.crypto.subtle !== "undefined") return win.crypto;
  }
  // Fallback to globalThis.crypto (works in Node >= 16.5 with webcrypto)
  const globalMaybe = globalThis as unknown as { crypto?: Crypto };
  if (globalMaybe.crypto && typeof globalMaybe.crypto.subtle !== "undefined") return globalMaybe.crypto;
  return undefined;
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const cryptoApi = getCrypto();
  if (!cryptoApi?.subtle) {
    throw new Error("WebCrypto SubtleCrypto API is not available");
  }
  const digest = await cryptoApi.subtle.digest("SHA-256", data);
  return base64urlencode(digest);
}

// Optional helpers (kept to avoid breaking imports)
const PKCE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
export function generateCodeVerifier(length = 64): string {
  let result = "";
  const array = new Uint8Array(length);
  const cryptoApi = getCrypto();
  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(array);
  } else {
    // Non-cryptographic fallback for environments without getRandomValues (should not be used in prod)
    for (let i = 0; i < length; i++) array[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < length; i++) {
    result += PKCE_CHARS[array[i] % PKCE_CHARS.length];
  }
  return result;
}