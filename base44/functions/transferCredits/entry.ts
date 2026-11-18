import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Transferencia de créditos entre usuarios de ExpertWallet.
// Los créditos son solo para usar dentro de la plataforma (SpinAtlas / Easy Win):
// no se convierten a dinero real ni se retiran a ninguna cuenta bancaria.
// Mueve el importe entre dos monederos internos (WalletBalance) y deja dos
// apuntes en el libro (WalletTransaction): transfer_out y transfer_in.

const round2 = (n) => Math.round(n * 100) / 100;

export default async function (req) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const recipientEmail = String(body.recipient_email || '').trim().toLowerCase();
    const amount = Number(body.amount);
    const note = String(body.note || '').trim().slice(0, 200);
    const idempotencyKey = String(body.idempotency_key || '').trim();

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return Response.json({ error: 'El email del destinatario no es válido' }, { status: 400 });
    }

    const credits = round2(amount);
    if (!Number.isFinite(credits) || credits <= 0) {
      return Response.json({ error: 'La cantidad de créditos debe ser mayor que 0' }, { status: 400 });
    }

    if (recipientEmail === String(user.email || '').toLowerCase()) {
      return Response.json({ error: 'No puedes transferirte créditos a ti mismo' }, { status: 400 });
    }

    // Destinatario: debe tener cuenta en ExpertWallet
    let recipient = null;
    for (const candidate of [...new Set([recipientEmail, recipientEmail.toLowerCase()])]) {
      const found = await base44.asServiceRole.entities.User.filter({ email: candidate });
      if (found[0]) {
        recipient = found[0];
        break;
      }
    }
    if (!recipient) {
      return Response.json({ error: 'No existe ninguna cuenta con ese email' }, { status: 404 });
    }

    const reference = 'TRF-' + (idempotencyKey || crypto.randomUUID());

    // Idempotencia: el mismo envío reintentado no vuelve a mover créditos
    const already = await base44.asServiceRole.entities.WalletTransaction.filter({
      jti: `${reference}:out`
    });
    if (already.length > 0) {
      const wallets = await base44.asServiceRole.entities.WalletBalance.filter({ user_id: user.id });
      return Response.json({
        status: 'completed',
        reference,
        credits: already[0].amount,
        balance: wallets[0] ? wallets[0].balance : 0,
        recipient: { email: recipientEmail, full_name: recipient.full_name || '' },
        duplicate: true
      });
    }

    const senderWallets = await base44.asServiceRole.entities.WalletBalance.filter({ user_id: user.id });
    const senderWallet = senderWallets[0];
    const senderBalance = senderWallet ? senderWallet.balance : 0;

    if (senderBalance < credits) {
      return Response.json(
        {
          status: 'insufficient_balance',
          error: 'Créditos insuficientes',
          balance: senderBalance,
          missing: round2(credits - senderBalance)
        },
        { status: 400 }
      );
    }

    const recipientWallets = await base44.asServiceRole.entities.WalletBalance.filter({
      user_id: recipient.id
    });
    const recipientWallet = recipientWallets[0];
    const recipientBalance = recipientWallet ? recipientWallet.balance : 0;

    const now = new Date().toISOString();
    const newSenderBalance = round2(senderBalance - credits);
    const newRecipientBalance = round2(recipientBalance + credits);

    // 1. Sale del monedero del emisor
    if (senderWallet) {
      await base44.asServiceRole.entities.WalletBalance.update(senderWallet.id, {
        balance: newSenderBalance,
        updated_at: now
      });
    } else {
      await base44.asServiceRole.entities.WalletBalance.create({
        user_id: user.id,
        balance: newSenderBalance,
        updated_at: now
      });
    }

    await base44.asServiceRole.entities.WalletTransaction.create({
      user_id: user.id,
      type: 'transfer_out',
      amount: credits,
      status: 'completed',
      description: `Transferencia a ${recipientEmail}${note ? ` · ${note}` : ''}`,
      jti: `${reference}:out`
    });

    // 2. Entra en el monedero del destinatario
    if (recipientWallet) {
      await base44.asServiceRole.entities.WalletBalance.update(recipientWallet.id, {
        balance: newRecipientBalance,
        updated_at: now
      });
    } else {
      await base44.asServiceRole.entities.WalletBalance.create({
        user_id: recipient.id,
        balance: newRecipientBalance,
        updated_at: now
      });
    }

    await base44.asServiceRole.entities.WalletTransaction.create({
      user_id: recipient.id,
      type: 'transfer_in',
      amount: credits,
      status: 'completed',
      description: `Transferencia de ${user.email}${note ? ` · ${note}` : ''}`,
      jti: `${reference}:in`
    });

    return Response.json({
      status: 'completed',
      reference,
      credits,
      balance: newSenderBalance,
      recipient: { email: recipientEmail, full_name: recipient.full_name || '' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}