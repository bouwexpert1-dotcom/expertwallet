import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, type } = await req.json();
    
    if (!amount || !type) {
      return Response.json({ error: 'Missing amount or type' }, { status: 400 });
    }

    // Obtener balance actual
    const wallets = await base44.entities.WalletBalance.filter({ user_id: user.id });
    const wallet = wallets[0];
    
    if (!wallet) {
      return Response.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if (wallet.balance < amount) {
      return Response.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    // Descontar créditos
    const newBalance = wallet.balance - amount;
    await base44.entities.WalletBalance.update(wallet.id, { balance: newBalance });

    // Registrar transacción
    await base44.entities.WalletTransaction.create({
      user_id: user.id,
      type: 'spend',
      amount,
      status: 'completed',
      description: `${type} purchase - ${amount} credits`
    });

    // Generar token
    const secret = Deno.env.get('WALLET_SECRET_KEY');
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      user_id: user.id,
      email: user.email,
      amount,
      type,
      exp: now + 60,
      iat: now
    }));

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payload}`));
    const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const token = `${header}.${payload}.${sig}`;

    return Response.json({ 
      success: true, 
      token, 
      newBalance,
      expiresIn: 60 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});