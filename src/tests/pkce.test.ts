import { generateCodeChallenge } from "../lib/spotify/pkce";

describe("PKCE utils", () => {
  it("generates expected code challenge for known verifier", async () => {
    // Example verifier and expected challenge computed independently
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = await generateCodeChallenge(verifier);
    // Expected from RFC 7636 appendix B
    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });
});