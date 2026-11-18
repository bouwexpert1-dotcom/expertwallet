import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { secrets } from 'base44:runtime';

// Aviso de depósito confirmado enviado por SpinAtlas.
// Cabecera obligatoria: X-SpinAtlas-Signature = HMAC-SHA256 (hex) del cuerpo crudo.
// Créditos = importe recibido (1:1). Si cambia la tasa, se ajusta en `credits`.

const hexToBytes = (hex) => {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
};

const formatDate = (ts) => {
  const d = ts ? new Date(ts) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
};

export default async function (req) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const rawBody = await req.text();

    // 1. Autenticidad primero: nada se lee ni se escribe si la firma no cuadra
    const signatureBytes = hexToBytes((req.headers.get('x-spinatlas-signature') || '').trim());
    if (!signatureBytes) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const secret = secrets.get('SPINATLAS_DEPOSIT_SECRET');
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(rawBody));
    if (!valid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody || '{}');
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { user_id, amount, currency, spinatas_transaction_id, timestamp } = payload;
    const credits = Number(amount);

    if (!user_id || !spinatas_transaction_id || !Number.isFinite(credits) || credits <= 0) {
      return Response.json(
        { error: 'user_id, amount > 0 and spinatas_transaction_id are required' },
        { status: 400 }
      );
    }

    const base44 = createClientFromRequest(req);

    const users = await base44.asServiceRole.entities.User.filter({ id: user_id });
    const user = users[0];
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Idempotencia: el mismo aviso reintentado no vuelve a acreditar
    const already = await base44.asServiceRole.entities.WalletTransaction.filter({
      jti: spinatas_transaction_id
    });
    if (already.length > 0) {
      return Response.json({ status: 'already_processed', spinatas_transaction_id });
    }

    // 3. Acreditar créditos en el monedero interno
    const wallets = await base44.asServiceRole.entities.WalletBalance.filter({ user_id });
    const wallet = wallets[0];
    const newBalance = (wallet ? wallet.balance : 0) + credits;
    const now = new Date().toISOString();

    if (wallet) {
      await base44.asServiceRole.entities.WalletBalance.update(wallet.id, {
        balance: newBalance,
        updated_at: now
      });
    } else {
      await base44.asServiceRole.entities.WalletBalance.create({
        user_id,
        balance: newBalance,
        updated_at: now
      });
    }

    await base44.asServiceRole.entities.WalletTransaction.create({
      user_id,
      type: 'deposit',
      amount: credits,
      status: 'completed',
      description: `SpinAtlas deposit ${spinatas_transaction_id} (${credits} ${currency || 'USD'})`,
      jti: spinatas_transaction_id
    });

    // 4. Recibo transaccional. Un fallo de correo no revierte el depósito.
    let emailSent = false;
    if (user.email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          template_name: 'DepositConfirmed',
          category: 'transactional',
          variables: {
            first_name: (user.full_name || '').split(' ')[0] || user.email,
            credits,
            amount: credits,
            currency: currency || 'USD',
            reference: spinatas_transaction_id,
            date: formatDate(timestamp),
            balance: newBalance
          }
        });
        emailSent = true;
      } catch (error) {
        console.error('DepositConfirmed email failed:', error.message);
      }
    }

    return Response.json({
      status: 'credited',
      user_id,
      spinatas_transaction_id,
      credits,
      balance: newBalance,
      email_sent: emailSent
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}