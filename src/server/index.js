const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'crfq-pbpv-jzfr-ybjr-yebh';
const PORT = process.env.PORT || 3000;

// ─── Helpers ───────────────────────────────────────────────────────────────

function verifyHMACToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Formato inválido');

  const [header, payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  if (sig !== expectedSig) throw new Error('Firma inválida');

  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp < now) throw new Error('Token expirado');

  return decoded;
}

// ─── Almacén en memoria de tokens consumidos ────────────────────────────────
// En producción usa Redis o una DB
const usedTokens = new Set();

// ─── Rutas ──────────────────────────────────────────────────────────────────

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'ExpertWallet Ruleta Server' });
});

// Verificar token y activar VIP — llamado desde la redirección de ExpertWallet
app.get('/verify', (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ status: 'error', error: 'Token requerido' });
  }

  let decoded;
  try {
    decoded = verifyHMACToken(token);
  } catch (err) {
    return res.status(401).json({ status: 'invalid_token', error: err.message });
  }

  // Anti double-spend
  if (usedTokens.has(decoded.jti)) {
    return res.status(409).json({ status: 'token_already_used', error: 'Token ya utilizado' });
  }

  usedTokens.add(decoded.jti);

  // Aquí activas el VIP para el usuario en tu sistema de ruleta
  console.log(`✅ VIP activado para usuario: ${decoded.email} | jti: ${decoded.jti}`);

  // Redirigir al juego con VIP activado
  return res.redirect(`/ruleta?vip=1&user=${decoded.user_id}`);
});

// Endpoint para que ExpertWallet valide un token vía POST
app.post('/verify-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ status: 'error', error: 'Token requerido' });
  }

  let decoded;
  try {
    decoded = verifyHMACToken(token);
  } catch (err) {
    return res.status(401).json({ status: 'invalid_token', error: err.message });
  }

  if (usedTokens.has(decoded.jti)) {
    return res.status(409).json({ status: 'token_already_used' });
  }

  usedTokens.add(decoded.jti);

  return res.json({
    status: 'activated',
    user_id: decoded.user_id,
    email: decoded.email,
    plan: decoded.type,
    activated_at: new Date().toISOString()
  });
});

// Página de la ruleta (placeholder — reemplaza con tu frontend real)
app.get('/ruleta', (req, res) => {
  const { vip, user } = req.query;
  res.send(`
    <html>
      <body style="background:#0a0a0f;color:#fff;font-family:sans-serif;text-align:center;padding:60px">
        <h1 style="color:#f5c518">🎰 Ruleta VIP</h1>
        <p>Usuario: <b>${user || 'invitado'}</b></p>
        <p>Estado VIP: <b style="color:${vip ? '#4ade80' : '#f87171'}">${vip ? '✅ Activo' : '❌ Inactivo'}</b></p>
        <p style="color:#6b6b80;font-size:12px">Reemplaza esta página con tu frontend de ruleta real.</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ruleta corriendo en puerto ${PORT}`);
});