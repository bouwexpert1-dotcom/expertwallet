import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Acredita los depósitos de SpinAtlas que llegaron con un email todavía sin cuenta.
// La invoca el workflow "Apply Pending Deposits" cuando el usuario se registra o inicia sesión.
// Es idempotente: cada depósito se acredita una sola vez (marcado con el id de transacción de SpinAtlas).

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const admin = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (admin.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { user_id, email } = await req.json().catch(() => ({}));
    if (!user_id) {
      return Response.json({ error: 'user_id is required' }, { status: 400 });
    }

    const candidate = String(email || '').trim().toLowerCase();
    if (!candidate) {
      return Response.json({ applied: 0, credits: 0, reason: 'no_email' });
    }

    const pendings = await base44.asServiceRole.entities.PendingDeposit.filter({
      email: candidate,
      status: 'pending'
    });

    let applied = 0;
    let credits = 0;

    for (const pending of pendings) {
      const now = new Date().toISOString();

      const already = await base44.asServiceRole.entities.WalletTransaction.filter({
        jti: pending.spinatlas_reference
      });

      if (already.length > 0) {
        await base44.asServiceRole.entities.PendingDeposit.update(pending.id, {
          status: 'applied',
          applied_at: now,
          applied_user_id: user_id,
          note: 'Ya acreditado previamente'
        });
        continue;
      }

      const wallets = await base44.asServiceRole.entities.WalletBalance.filter({ user_id });
      const wallet = wallets[0];
      const newBalance = (wallet ? wallet.balance : 0) + pending.amount;

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
        amount: pending.amount,
        status: 'completed',
        description: `SpinAtlas deposit ${pending.spinatlas_reference} (${pending.amount} ${pending.currency || 'USD'})`,
        jti: pending.spinatlas_reference
      });

      await base44.asServiceRole.entities.PendingDeposit.update(pending.id, {
        status: 'applied',
        applied_at: now,
        applied_user_id: user_id
      });

      applied += 1;
      credits += pending.amount;
    }

    return Response.json({ applied, credits, user_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}