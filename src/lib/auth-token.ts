/**
 * Shared derivation for the `forge_auth` cookie.
 *
 * Used by both the login route (which issues the cookie) and the middleware
 * (which checks it). They MUST agree, so the derivation lives in one place.
 */

const AUTH_COOKIE = "forge_auth";

/**
 * Application-specific salt.
 *
 * The cookie used to be a bare `sha256(SITE_PASSWORD)`. That is a fast,
 * unsalted hash of a human-chosen password, so a stolen cookie could be run
 * against a rainbow table to recover SITE_PASSWORD itself — which matters well
 * beyond this site if the password is reused anywhere. Salting kills generic
 * precomputed tables at zero cost.
 *
 * This is deliberately a constant in source rather than an env var: it is not a
 * secret (it defends against precomputation, not against someone reading the
 * repo), and adding an env var would mean a gate that silently breaks the day
 * someone forgets to provision it. That failure mode is exactly what this file
 * exists to eliminate.
 */
const TOKEN_SALT = "forge.v2.auth";

let cachedToken: Promise<string | null> | null = null;

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * The cookie value a authenticated browser should present.
 *
 * Returns `null` when SITE_PASSWORD is unset or empty, so every caller is
 * forced to decide what to do in that case. The previous middleware used
 * `process.env.SITE_PASSWORD ?? ""` and hashed the empty string, which is the
 * well-known constant e3b0c442…b855 — meaning that if SITE_PASSWORD were ever
 * removed or renamed, anyone presenting that public value would be let in.
 * A gate that protects paid API keys must fail closed, not open.
 *
 * Computed once per runtime instance. The old code re-derived SHA-256 on every
 * authenticated request; the password cannot change without a redeploy, so
 * that work was pure waste on the hot path.
 */
export function expectedToken(): Promise<string | null> {
  if (!cachedToken) {
    const password = process.env.SITE_PASSWORD;
    cachedToken = password
      ? sha256Hex(`${TOKEN_SALT}:${password}`)
      : Promise.resolve(null);
  }
  return cachedToken;
}

/**
 * Length-independent, content-constant-time comparison.
 *
 * `a === b` on strings short-circuits at the first differing byte. Remotely
 * exploiting that is impractical, but constant-time comparison is two lines
 * and removes the question entirely.
 */
export function tokensMatch(a: string | undefined, b: string | null): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export { AUTH_COOKIE };
