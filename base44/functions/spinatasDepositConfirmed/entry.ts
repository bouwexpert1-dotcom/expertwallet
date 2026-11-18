import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { secrets } from 'base44:runtime';

// Aviso de depósito confirmado enviado por SpinAtlas.
// Cabecera obligatoria: X-SpinAtlas-Signature = HMAC-SHA256 (hex) del cuerpo crudo.
// Créditos = importe recibido (1:1). Si cambia la tasa, se ajusta en `credits`.
// Identificador del cliente: `user_id` interno, o el email en `user_id` / `email`
// (pedidos manuales). Si es un email, se resuelve internamente al usuario.
// Si ese email aún no tiene cuenta, el depósito queda como PendingDeposit (202) y
// se acredita automáticamente cuando el cliente se registra o inicia sesión.

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

    const { user_id, email, amount, currency, spinatas_transaction_id, timestamp } = payload;
    const credits = Number(amount);

    const identifier = String(user_id || email || '').trim();
    const resolvedByEmail = identifier.includes('@');

    if (!identifier || !spinatas_transaction_id || !Number.isFinite(credits) || credits <= 0) {
      return Response.json(
        { error: 'user_id (or email), amount > 0 and spinatas_transaction_id are required' },
        { status: 400 }
      );
    }

    if (!resolvedByEmail && !/^[a-f0-9]{24}$/i.test(identifier)) {
      return Response.json({ error: 'user_id must be a valid user id or an email' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    let user;
    if (resolvedByEmail) {
      for (const candidate of [...new Set([identifier, identifier.toLowerCase()])]) {
        const found = await base44.asServiceRole.entities.User.filter({ email: candidate });
        if (found[0]) {
          user = found[0];
          break;
        }
      }
    } else {
      const found = await base44.asServiceRole.entities.User.filter({ id: identifier });
      user = found[0];
    }

    // Sin cuenta todavía: si vino un email, el depósito queda pendiente y se acredita
    // automáticamente al registrarse (función applyPendingDeposits + su workflow).
    if (!user) {
      if (!resolvedByEmail) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      const pendingAlready = await base44.asServiceRole.entities.PendingDeposit.filter({
        spinatlas_reference: spinatas_transaction_id
      });
      if (pendingAlready.length > 0) {
        return Response.json({ status: 'already_processed', spinatas_transaction_id });
      }

      const pendingEmail = identifier.toLowerCase();
      await base44.asServiceRole.entities.PendingDeposit.create({
        email: pendingEmail,
        amount: credits,
        currency: currency || 'USD',
        spinatlas_reference: spinatas_transaction_id,
        status: 'pending',
        note: 'Depósito de SpinAtlas para un email sin cuenta'
      });

      return Response.json(
        {
          status: 'pending_registration',
          email: pendingEmail,
          spinatas_transaction_id,
          credits,
          resolved_by: 'email'
        },
        { status: 202 }
      );
    }

    // 2. Idempotencia: el mismo aviso reintentado no vuelve a acreditar
    const already = await base44.asServiceRole.entities.WalletTransaction.filter({
      jti: spinatas_transaction_id
    });
    if (already.length > 0) {
      return Response.json({ status: 'already_processed', spinatas_transaction_id });
    }

    // 3. Acreditar créditos en el monedero interno
    const wallets = await base44.asServiceRole.entities.WalletBalance.filter({ user_id: user.id });
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
        user_id: user.id,
        balance: newBalance,
        updated_at: now
      });
    }

    await base44.asServiceRole.entities.WalletTransaction.create({
      user_id: user.id,
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
      user_id: user.id,
      resolved_by: resolvedByEmail ? 'email' : 'user_id',
      spinatas_transaction_id,
      credits,
      balance: newBalance,
      email_sent: emailSent
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}