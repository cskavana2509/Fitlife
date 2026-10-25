import { supabase } from './supabase';

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
 * kind: 'membership' | 'session'
 * itemId: plan id or slot id
 */
export async function startCheckout({ kind, itemId, user, onSuccess, onError }) {
  const loaded = await loadRazorpay();
  if (!loaded) return onError?.('Could not load the payment gateway');

  const { data, error } = await supabase.functions.invoke('create-order', {
    body: { kind, item_id: itemId },
  });
  if (error || data?.error) return onError?.(data?.error || error?.message || 'Could not start payment');

  const rzp = new window.Razorpay({
    key: data.key_id,
    amount: data.amount,
    currency: 'INR',
    name: 'FitLife',
    description: data.description,
    order_id: data.order_id,
    prefill: { name: user?.user_metadata?.full_name, email: user?.email },
    theme: { color: '#c6ff3d' },
    handler: async (response) => {
      const { data: verified, error: vErr } = await supabase.functions.invoke('verify-payment', {
        body: response,
      });
      if (vErr || verified?.error) return onError?.(verified?.error || 'Payment verification failed');
      onSuccess?.();
    },
    modal: { ondismiss: () => onError?.('Payment cancelled') },
  });

  rzp.open();
}