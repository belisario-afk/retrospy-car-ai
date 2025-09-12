import axios from "axios";

export type TokenResponse = {
  access_token: string;
  token_type: "Bearer";
  scope: string;
  expires_in: number;
  refresh_token?: string;
};

export async function exchangeCodeForToken(args: {
  code: string;
  codeVerifier: string;
  clientId: string;
  redirectUri: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", args.code);
  body.set("redirect_uri", args.redirectUri);
  body.set("client_id", args.clientId);
  body.set("code_verifier", args.codeVerifier);

  const res = await axios.post("https://accounts.spotify.com/api/token", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return res.data as TokenResponse;
}

export async function refreshAccessToken(args: {
  refreshToken: string;
  clientId: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", args.refreshToken);
  body.set("client_id", args.clientId);

  const res = await axios.post("https://accounts.spotify.com/api/token", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return res.data as TokenResponse;
}