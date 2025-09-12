/**
 * Minimal dev helper to proxy token exchange for PKCE.
 * This is OPTIONAL. The SPA exchanges tokens directly with Spotify.
 *
 * Usage:
 *   npm i express node-fetch dotenv
 *   node server.js
 *
 * Set SPOTIFY_CLIENT_ID in .env or environment. No client secret is used for PKCE refresh.
 */
const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 4321;

app.post("/token", async (req, res) => {
  const {
    code,
    code_verifier,
    redirect_uri,
    grant_type = "authorization_code",
    refresh_token
  } = req.body || {};
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID || process.env.REACT_APP_SPOTIFY_CLIENT_ID || "",
    grant_type,
    redirect_uri: redirect_uri || process.env.REACT_APP_SPOTIFY_REDIRECT_URI || ""
  });
  if (grant_type === "authorization_code") {
    params.set("code", code);
    params.set("code_verifier", code_verifier);
  } else if (grant_type === "refresh_token") {
    params.set("refresh_token", refresh_token);
  }

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  const text = await r.text();
  res.status(r.status).send(text);
});

app.listen(PORT, () => {
  console.log(`Dev PKCE server listening on http://localhost:${PORT}`);
});