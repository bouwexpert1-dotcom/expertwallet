import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TOKEN_TTL_SECONDS = 120;
const SPIN_ATLAS_BASE_URL = 'https://skinny-roulette-spin-log.base44.app';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ status: 'unauthorized', error: 'Not authenticated' }, { status: 401 });
    }

    const secret = Deno.env.get('WALLET_SECRET_KEY');

    // El cliente solo envía el tipo de plan. El monto lo resuelve el servidor.
    const { type, return_url } = await req.json().catch(() => ({}));

    if (!type) {
      return Response.json({ status: 'invalid_request', error: 'Missing type' }, { status: 400 });
    }

    // Precio autoritativo desde el catálogo (entidad Plan, ajustable sin deploy)
    const plans = await base44.entities.Plan.filter({ code: type, active: true });
    const plan = plans[0];

    if (!plan) {
      return Response.json({
        status: 'invalid_plan',
        error: `Plan no disponible: ${type}`
      }, { status: 400 });
    }

    const amount = plan.price_credits;

    // Verificación del usuario en SpinAtlas (fail closed: si no se confirma, no se cobra)
    let existsInSpinAtlas = false;

    try {
      const res = await fetch(
        `${SPIN_ATLAS_BASE_URL}/functions/checkUser?email=${encodeURIComponent(user.email)}`,
        { headers: { 'X-Wallet-Secret': secret } }
      );

      if (res.status === 401) {
        return Response.json({
          status: 'wallet_auth_failed',
          error: 'Secreto de wallet no válido entre apps'
        }, { status: 500 });
      }

      if (!res.ok) {
        return Response.json({
          status: 'user_check_failed',
          error: 'No se pudo verificar el usuario en la ruleta'
        }, { status: 502 });
      }

      const check = await res.json();
      existsInSpinAtlas = check?.exists === true;
    } catch (error) {
      return Response.json({
        status: 'user_check_failed',
        error: 'No se pudo verificar el usuario en la ruleta'
      }, { status: 502 });
    }

    if (!existsInSpinAtlas) {
      return Response.json({
        status: 'user_not_registered',
        error: 'Tu email no está registrado en la ruleta'
      }, { status: 403 });
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
    const jti = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    // Descontar créditos
    const newBalance = wallet.balance - amount;
    await base44.entities.WalletBalance.update(wallet.id, {
      balance: newBalance,
      updated_at: new Date().toISOString()
    });

    // Registrar transacción con JTI para anti-doble gasto
    await base44.entities.WalletTransaction.create({
      user_id: user.id,
      type: 'spend',
      amount,
      status: 'completed',
      description: `${plan.code} purchase - ${amount} credits`,
      jti
    });

    // Generar token JWT con JTI
    const now = Math.floor(Date.now() / 1000);

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      user_id: user.id,
      email: user.email,
      amount,
      type: plan.code,
      jti,
      exp: now + TOKEN_TTL_SECONDS,
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
      plan: {
        code: plan.code,
        name: plan.name,
        price_credits: plan.price_credits
      },
      expiresIn: TOKEN_TTL_SECONDS,
      return_url: return_url || null
    });
  } catch (error) {
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});