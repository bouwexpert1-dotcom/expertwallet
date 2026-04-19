import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ status: 'unauthorized', error: 'Not authenticated' }, { status: 401 });
    }

    const { amount, type, return_url } = await req.json();
    
    if (!amount || !type) {
      return Response.json({ status: 'invalid_request', error: 'Missing amount or type' }, { status: 400 });
    }

    // Obtener balance actual
    const wallets = await base44.entities.WalletBalance.filter({ user_id: user.id });
    const wallet = wallets[0];
    
    if (!wallet) {
      return Response.json({ status: 'wallet_not_found' }, { status: 404 });
    }

    if (wallet.balance < amount) {
      return Response.json({ 
        status: 'insufficient_balance', 
        required: amount, 
        current: wallet.balance,
        missing: amount - wallet.balance
      }, { status: 400 });
    }

    // Generar JTI único (transaction ID)
    const jti = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Descontar créditos
    const newBalance = wallet.balance - amount;
    await base44.entities.WalletBalance.update(wallet.id, { balance: newBalance });

    // Registrar transacción con JTI para anti-doble gasto
    const transaction = await base44.entities.WalletTransaction.create({
      user_id: user.id,
      type: 'spend',
      amount,
      status: 'completed',
      description: `${type} purchase - ${amount} credits`,
      jti
    });

    // Generar token JWT con JTI
    const secret = Deno.env.get('WALLET_SECRET_KEY');
    const now = Math.floor(Date.now() / 1000);
    const tokenExpiry = 60; // segundos
    
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      user_id: user.id,
      email: user.email,
      amount,
      type,
      jti,
      exp: now + tokenExpiry,
      iat: now
    }));

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payload}`));
    const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const token = `${header}.${payload}.${sig}`;

    return Response.json({ 
      status: 'approved',
      token, 
      jti,
      newBalance,
      expiresIn: tokenExpiry,
      return_url: return_url || null
    });
  } catch (error) {
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});