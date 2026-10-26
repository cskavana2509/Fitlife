import { supabase } from './supabase';

// Load Razorpay's checkout script once
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/**
 * kind: 'membership' or 'session'
 * itemId: the plan id or the slot id
 */
export async function startCheckout({ kind, itemId, user, onSuccess, onError }) {
  const loaded = await loadRazorpay();
  if (!loaded) return onError?.('Could not load the payment gateway');

  // Step A: ask the server to create the order (price is read on the server)
  const { data, error } = await supabase.functions.invoke('create-order', {
    body: { kind, item_id: itemId },
  });
  if (error || data?.error) {
    return onError?.(data?.error || error?.message || 'Could not start payment');
  }

  // Step B: open the Razorpay popup with the payment methods enabled
  const rzp = new window.Razorpay({
    key: data.key_id,
    amount: data.amount,
    currency: 'INR',
    name: 'FitLife',
    description: data.description,
    order_id: data.order_id,
    prefill: {
      name: user?.user_metadata?.full_name ?? '',
      email: user?.email ?? '',
    },
    theme: { color: '#c6ff3d' },

    // Payment options shown in the popup.
    // Each method must also be enabled in the Razorpay dashboard (Settings → Configurations → Payment Methods).
    method: {
      upi: true,
      card: true,
      netbanking: true,
      wallet: true,
      emi: false,
      paylater: false,
    },

    // Step C: after payment, verify the signature on the server
    handler: async (response) => {
      const { data: verified, error: vErr } = await supabase.functions.invoke('verify-payment', {
        body: response, // razorpay_order_id, razorpay_payment_id, razorpay_signature
      });
      if (vErr || verified?.error) {
        return onError?.(verified?.error || 'Payment verification failed');
      }
      onSuccess?.();
    },

    modal: {
      ondismiss: () => onError?.('Payment cancelled'),
      escape: true,
      backdropclose: false,
    },
  });

  // Show a clear message if a payment fails inside the popup
  rzp.on('payment.failed', (resp) => {
    onError?.(resp?.error?.description || 'Payment failed. Please try again.');
  });

  rzp.open();
}