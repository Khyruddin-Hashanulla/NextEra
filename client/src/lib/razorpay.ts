export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency?: string;
  orderId: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
  onDismiss?: () => void;
}

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<boolean> {
  const loaded = await loadRazorpayScript();
  if (!loaded) return false;
  const rzp = new (window as any).Razorpay({
    key: options.key,
    amount: options.amount,
    currency: options.currency || 'INR',
    name: options.name || 'NextEra LMS',
    description: options.description,
    order_id: options.orderId,
    prefill: options.prefill,
    handler: (response: any) => options.onSuccess(response),
    modal: { ondismiss: options.onDismiss },
  });
  rzp.open();
  return true;
}
