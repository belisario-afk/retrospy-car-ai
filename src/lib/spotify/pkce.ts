// PKCE utilities per RFC 7636 using SHA-256 S256 method.
function dec2hex(dec: number) {
  return ("0" + dec.toString(16)).substr(-2);
}

function randomString(length: number) {
  const arr = new Uint8Array(length);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, dec2hex).join("");
}

/**
 * Generates a cryptographically random code verifier string.
 */
export function generateCodeVerifier(): string {
  return randomString(56);
}

function base64urlencode(a: ArrayBuffer) {
  let str = "";
  const bytes = new Uint8Array(a);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Derives a code challenge from a code verifier using SHA-256 then base64url.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return base64urlencode(digest);
}

/**
 * Helper: parse OAuth2 hash or query params (not heavily used here; left for completeness)
 */
export function parseHashParams(hashOrQuery: string): Record<string, string> {
  const params = new URLSearchParams(hashOrQuery.replace(/^#/, ""));
  const out: Record<string, string> = {};
  params.forEach((v, k) => (out[k] = v));
  return out;
}