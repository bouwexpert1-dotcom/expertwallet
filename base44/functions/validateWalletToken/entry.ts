import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return Response.json({ status: 'invalid_token' }, { status: 400 });
    }

    const secret = Deno.env.get('WALLET_SECRET_KEY');
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return Response.json({ status: 'invalid_format' }, { status: 400 });
    }

    // Verificar firma
    const [header, payload, sig] = parts;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    
    const signatureBytes = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(`${header}.${payload}`));
    
    if (!isValid) {
      return Response.json({ status: 'invalid_signature' }, { status: 401 });
    }

    // Decodificar payload
    const decodedPayload = JSON.parse(atob(payload));
    const now = Math.floor(Date.now() / 1000);

    // Verificar expiración
    if (decodedPayload.exp < now) {
      return Response.json({ status: 'token_expired' }, { status: 401 });
    }

    // Verificar JTI no fue usado (anti-doble gasto)
    const base44 = createClientFromRequest(req);
    const transactions = await base44.entities.WalletTransaction.filter({ jti: decodedPayload.jti });
    
    if (transactions.length === 0) {
      return Response.json({ status: 'jti_not_found' }, { status: 404 });
    }

    if (transactions[0].status === 'consumed') {
      return Response.json({ status: 'token_already_used' }, { status: 409 });
    }

    // Marcar como consumido
    await base44.entities.WalletTransaction.update(transactions[0].id, { status: 'consumed' });

    return Response.json({ 
      status: 'valid',
      user_id: decodedPayload.user_id,
      email: decodedPayload.email,
      type: decodedPayload.type,
      amount: decodedPayload.amount,
      jti: decodedPayload.jti
    });
  } catch (error) {
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});