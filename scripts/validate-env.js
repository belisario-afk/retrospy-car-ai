/* Ensure required env vars exist before building */
const path = require("path");
const fs = require("fs");

// Load env from .env (and .env.local if present)
try {
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
  const localEnvPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(localEnvPath)) {
    require("dotenv").config({ path: localEnvPath });
  }
} catch (e) {
  // dotenv not installed or other error — continue, we still check process.env
}

const required = ["REACT_APP_SPOTIFY_CLIENT_ID"];
let ok = true;

for (const key of required) {
  const val = process.env[key];
  if (!val) {
    console.error(`[validate-env] Missing required env var: ${key}`);
    ok = false;
  }
}

if (!ok) {
  console.error(
    "[validate-env] Create a .env file with REACT_APP_SPOTIFY_CLIENT_ID and re-run the build."
  );
  process.exit(1);
} else {
  console.log("[validate-env] Environment looks good.");
}