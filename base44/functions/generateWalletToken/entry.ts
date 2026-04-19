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

    const secret = Deno.env.get('WALLET_SECRET_KEY');
    if (!secret) {
      return Response.json({ error: 'Secret key not configured' }, { status: 500 });
    }

    // Crear JWT manualmente
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

    // Firmar con HMAC-SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payload}`));
    const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const token = `${header}.${payload}.${sig}`;

    return Response.json({ token, expiresIn: 60 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});