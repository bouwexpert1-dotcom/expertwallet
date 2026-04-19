import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Endpoint para verificar y activar pagos de VIP desde la app de ruleta
 * Se llamaría: POST /verify?token=XYZ
 * Devuelve: { status: "activated", user_id, email, message }
 */
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return Response.json({ 
        status: 'invalid_request',
        error: 'Token requerido en query params'
      }, { status: 400 });
    }

    const secret = Deno.env.get('WALLET_SECRET_KEY');
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return Response.json({ 
        status: 'invalid_format',
        error: 'Formato de token inválido'
      }, { status: 400 });
    }

    // Verificar firma JWT
    const [header, payload, sig] = parts;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBytes = Uint8Array.from(
      atob(sig.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(`${header}.${payload}`)
    );
    
    if (!isValid) {
      return Response.json({ 
        status: 'invalid_signature',
        error: 'Firma de token inválida'
      }, { status: 401 });
    }

    // Decodificar y validar payload
    const decodedPayload = JSON.parse(atob(payload));
    const now = Math.floor(Date.now() / 1000);

    if (decodedPayload.exp < now) {
      return Response.json({ 
        status: 'token_expired',
        error: 'Token expirado (60 segundos)'
      }, { status: 401 });
    }

    // Marcar transacción como consumida (anti-doble gasto)
    const base44 = createClientFromRequest(req);
    const transactions = await base44.entities.WalletTransaction.filter({ 
      jti: decodedPayload.jti 
    });
    
    if (transactions.length === 0) {
      return Response.json({ 
        status: 'jti_not_found',
        error: 'Transacción no encontrada'
      }, { status: 404 });
    }

    const tx = transactions[0];
    if (tx.status === 'consumed') {
      return Response.json({ 
        status: 'token_already_used',
        error: 'Este token ya fue utilizado'
      }, { status: 409 });
    }

    // Marcar como consumido
    await base44.entities.WalletTransaction.update(tx.id, { 
      status: 'consumed' 
    });

    // Aquí podrías activar VIP en tu sistema de ruleta
    // Por ejemplo: await activateUserVIP(decodedPayload.user_id);

    return Response.json({ 
      status: 'activated',
      message: 'VIP activado 🎉',
      user_id: decodedPayload.user_id,
      email: decodedPayload.email,
      type: decodedPayload.type,
      amount_spent: decodedPayload.amount,
      activated_at: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ 
      status: 'error',
      error: error.message 
    }, { status: 500 });
  }
});