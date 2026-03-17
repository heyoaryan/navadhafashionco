// Razorpay Payment Gateway Integration

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

export interface RazorpayOrderData {
  orderId: string;
  orderNumber: string;
  amount: number; // in INR (will be converted to paise)
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

// Ensure Razorpay SDK is loaded
const ensureRazorpayLoaded = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.head.appendChild(script);
  });
};

export const openRazorpayCheckout = async (
  data: RazorpayOrderData,
  onSuccess: (paymentData: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }) => void,
  onFailure: (error: { type: string; message: string }) => void,
  onCancel?: () => void
): Promise<void> => {
  if (!navigator.onLine) {
    onFailure({ type: 'NETWORK_ERROR', message: 'No internet connection. Please check your network and try again.' });
    return;
  }

  if (!RAZORPAY_KEY_ID) {
    onFailure({ type: 'CONFIG_ERROR', message: 'Payment gateway is not configured. Please contact support.' });
    return;
  }

  try {
    await ensureRazorpayLoaded();

    // Track what happened so ondismiss doesn't override payment.failed
    let outcome: 'none' | 'success' | 'failed' | 'cancelled' = 'none';
    let failureError: { type: string; message: string } | null = null;

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(data.amount * 100), // paise
      currency: 'INR',
      name: 'NAVADHA Fashion Co',
      description: `Order #${data.orderNumber}`,
      prefill: {
        name: data.customerName,
        email: data.customerEmail,
        contact: data.customerPhone,
      },
      notes: {
        order_number: data.orderNumber,
        internal_order_id: data.orderId,
      },
      theme: {
        color: '#f43f5e',
      },
      modal: {
        // ondismiss always fires when modal closes — whether success, fail, or cancel
        // We use it as the single exit point so our screen shows AFTER modal is gone
        ondismiss: () => {
          if (outcome === 'success') return; // success handled by handler
          if (outcome === 'failed' && failureError) {
            onFailure(failureError);
          } else if (outcome === 'none') {
            // User closed without doing anything
            if (onCancel) onCancel();
            else onFailure({ type: 'PAYMENT_CANCELLED', message: 'Payment was cancelled.' });
          }
        },
        escape: true,
        animation: true,
      },
      handler: (response: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }) => {
        outcome = 'success';
        onSuccess(response);
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response: any) => {
      // Store the failure — ondismiss will deliver it after modal closes
      outcome = 'failed';
      const desc = response?.error?.description || 'Payment failed. Please try again.';
      const reason = response?.error?.reason || '';
      failureError = {
        type: reason === 'payment_cancelled' ? 'PAYMENT_CANCELLED' : 'PAYMENT_FAILED',
        message: reason === 'payment_cancelled' ? 'Payment was cancelled.' : desc,
      };
    });

    rzp.open();
  } catch (error: any) {
    onFailure({
      type: 'PAYMENT_ERROR',
      message: error?.message || 'Failed to open payment gateway. Please try again.',
    });
  }
};
