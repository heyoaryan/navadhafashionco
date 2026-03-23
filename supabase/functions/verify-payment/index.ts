// Supabase Edge Function: verify-payment
// Verifies Razorpay payment signature server-side before creating order
// Secret key never leaves the server

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only POST allowed
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    // razorpay_order_id is optional (only present when Razorpay Order API is used)
    // For standard checkout without Order API, we verify payment exists via Razorpay API
    if (!razorpay_payment_id) {
      return new Response(JSON.stringify({ error: 'Missing payment_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured');
      return new Response(JSON.stringify({ error: 'Payment gateway not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let verified = false;

    if (razorpay_order_id && razorpay_signature) {
      // ── Path A: Signature verification (when Razorpay Order API is used) ──
      // HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
      const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
      const encoder = new TextEncoder();
      const keyData = encoder.encode(RAZORPAY_KEY_SECRET);
      const msgData = encoder.encode(payload);

      const cryptoKey = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      verified = expectedSignature === razorpay_signature;
    } else {
      // ── Path B: Fetch payment from Razorpay API to confirm it's real & captured ──
      // This is the fallback when no order_id/signature is present (standard checkout)
      const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
      const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
        headers: { 'Authorization': `Basic ${credentials}` },
      });

      if (rzpRes.ok) {
        const payment = await rzpRes.json();
        // Payment must be captured and in INR
        verified = payment.status === 'captured' && payment.currency === 'INR';
      }
    }

    if (!verified) {
      return new Response(JSON.stringify({ error: 'Payment verification failed', verified: false }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Payment verified — check for duplicate (idempotency) ──
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existing) {
      // Already processed — return success (idempotent)
      return new Response(JSON.stringify({ verified: true, duplicate: true, orderId: existing.id }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ verified: true, duplicate: false }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('verify-payment error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
