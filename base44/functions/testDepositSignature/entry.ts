import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { secrets } from 'base44:runtime';

// Prueba interna del endpoint spinatasDepositConfirmed.
// Solo administradores. Firma en el servidor (la clave nunca llega al navegador).
// Hace dos llamadas con el MISMO cuerpo: firma alterada (espera 401) y firma válida (espera 200).

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const sign = async (secret, body) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return toHex(signature);
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const secret = secrets.get('SPINATLAS_DEPOSIT_SECRET');
    const origin = req.headers.get('x-base44-app-url') || 'https://expert-wallet-flow.base44.app';
    const endpoint = `${origin}/functions/spinatasDepositConfirmed`;

    // Se envía el email (no el id) para probar también la resolución de pedidos manuales.
    const payload = {
      user_id: user.email,
      amount: 1,
      currency: 'USD',
      spinatas_transaction_id: `TEST-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString()
    };
    const body = JSON.stringify(payload);

    const goodSignature = await sign(secret, body);
    const badSignature = '0'.repeat(goodSignature.length);

    const call = async (signature) => {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SpinAtlas-Signature': signature
        },
        body,
        signal: AbortSignal.timeout(15000)
      });
      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { raw: text };
      }
      return { status: res.status, body: parsed };
    };

    // Primero la firma inválida: no escribe nada. Después la válida: acredita 1 crédito de prueba.
    const invalidSignature = await call(badSignature);
    const validSignature = await call(goodSignature);

    return Response.json({ endpoint, payload, invalidSignature, validSignature });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}