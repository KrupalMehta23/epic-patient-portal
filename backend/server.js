require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// ─── Security middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Frontend handles its own CSP
}));

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Rate limiting - prevent token endpoint abuse
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth requests, please try again later.' },
});

const fhirLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { error: 'Too many FHIR requests, please slow down.' },
});

// ─── In-memory PKCE + state store (keyed by state param) ──────────────────────
// In production you would use Redis or a database session store
const pendingAuthSessions = new Map();

// Clean up stale sessions older than 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [key, val] of pendingAuthSessions.entries()) {
    if (val.createdAt < cutoff) pendingAuthSessions.delete(key);
  }
}, 60 * 1000);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateSecureRandom(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

async function generatePKCE() {
  const verifier = generateSecureRandom(32);
  const hash = crypto.createHash('sha256').update(verifier).digest();
  const challenge = hash.toString('base64url');
  return { verifier, challenge };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /auth/initiate
 * Frontend calls this to start the OAuth flow.
 * Server generates PKCE + state, stores verifier server-side,
 * and returns the full authorization URL for the frontend to redirect to.
 */
app.get('/auth/initiate', authLimiter, async (req, res) => {
  try {
    const { verifier, challenge } = await generatePKCE();
    const state = generateSecureRandom(16);

    // Store PKCE verifier server-side keyed by state
    pendingAuthSessions.set(state, {
      verifier,
      createdAt: Date.now(),
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.EPIC_CLIENT_ID,
      redirect_uri: process.env.EPIC_REDIRECT_URI,
      scope: [
        'openid',
        'fhirUser',
        'launch/patient',
        'patient/Patient.read',
        'patient/MedicationRequest.read',
        'patient/DiagnosticReport.read',
        'patient/Observation.read',
        'offline_access',
      ].join(' '),
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      aud: process.env.EPIC_FHIR_BASE,
    });

    const authUrl = `${process.env.EPIC_AUTH_BASE}/authorize?${params}`;
    res.json({ authUrl, state });
  } catch (err) {
    console.error('[auth/initiate]', err);
    res.status(500).json({ error: 'Failed to initiate authorization' });
  }
});

/**
 * GET /auth/callback
 * EPIC redirects here with ?code=...&state=...
 * Server exchanges the code for tokens, then redirects the user
 * back to the React frontend with the token data as query params.
 *
 * Note: In a production app you would set an httpOnly session cookie
 * instead of passing tokens to the frontend. For a local dev app
 * this approach keeps setup simple.
 */
app.get('/auth/callback', authLimiter, async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    const msg = encodeURIComponent(error_description || error);
    return res.redirect(
      `${process.env.FRONTEND_ORIGIN}?auth_error=${msg}`
    );
  }

  if (!code || !state) {
    return res.redirect(
      `${process.env.FRONTEND_ORIGIN}?auth_error=missing_code_or_state`
    );
  }

  const session = pendingAuthSessions.get(state);
  if (!session) {
    return res.redirect(
      `${process.env.FRONTEND_ORIGIN}?auth_error=invalid_or_expired_state`
    );
  }
  pendingAuthSessions.delete(state);

  try {
    const tokenRes = await fetch(`${process.env.EPIC_AUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.EPIC_REDIRECT_URI,
        client_id: process.env.EPIC_CLIENT_ID,
        code_verifier: session.verifier,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      console.error('[auth/callback] Token exchange failed:', body);
      return res.redirect(
        `${process.env.FRONTEND_ORIGIN}?auth_error=token_exchange_failed`
      );
    }

    const tokens = await tokenRes.json();

    // Pass tokens back to frontend via redirect query params
    // Frontend will store them in sessionStorage only
    const params = new URLSearchParams({
      access_token: tokens.access_token,
      ...(tokens.id_token ? { id_token: tokens.id_token } : {}),
      ...(tokens.patient ? { patient_id: tokens.patient } : {}),
      expires_in: tokens.expires_in || 3600,
    });

    res.redirect(`${process.env.FRONTEND_ORIGIN}/auth-success?${params}`);
  } catch (err) {
    console.error('[auth/callback]', err);
    res.redirect(
      `${process.env.FRONTEND_ORIGIN}?auth_error=server_error`
    );
  }
});

/**
 * GET /fhir/:path(*)
 * Authenticated FHIR proxy. Frontend sends Bearer token,
 * backend forwards it to EPIC FHIR server and returns the response.
 * This keeps the FHIR base URL and any server-side logic out of the browser.
 */
app.get('/fhir/*', fhirLimiter, async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  // Strip /fhir/ prefix to get the FHIR resource path
  const fhirPath = req.params[0];
  const queryString = new URLSearchParams(req.query).toString();
  const fhirUrl = `${process.env.EPIC_FHIR_BASE}/${fhirPath}${queryString ? '?' + queryString : ''}`;

  try {
    const fhirRes = await fetch(fhirUrl, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/fhir+json',
      },
    });

    const contentType = fhirRes.headers.get('content-type') || 'application/fhir+json';
    const body = await fhirRes.json();

    res.status(fhirRes.status).set('Content-Type', contentType).json(body);
  } catch (err) {
    console.error('[fhir proxy]', err);
    res.status(502).json({ error: 'FHIR upstream error', detail: err.message });
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  EPIC FHIR proxy running at http://localhost:${PORT}`);
  console.log(`   Auth initiate:  GET  /auth/initiate`);
  console.log(`   Auth callback:  GET  /auth/callback`);
  console.log(`   FHIR proxy:     GET  /fhir/<resource>`);
  console.log(`   Health check:   GET  /health\n`);
});
