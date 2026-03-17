// Cashfree Payment Gateway Integration

declare global {
  interface Window {
    Cashfree: any;
  }
}

// Cashfree Configuration
// const CASHFREE_APP_ID = import.meta.env.VITE_CASHFREE_APP_ID || '';
// const CASHFREE_MODE = import.meta.env.VITE_CASHFREE_MODE || 'sandbox';

export interface PaymentSessionData {
  orderId: string;
  orderAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

// Initialize Cashfree SDK
export const initializeCashfree = () => {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) {
      resolve(window.Cashfree);
    } else {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = () => resolve(window.Cashfree);
      script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
      document.head.appendChild(script);
    }
  });
};

// Create payment session (This should ideally be done from backend)
export const createPaymentSession = async (data: PaymentSessionData) => {
  try {
    // In production, this should call your backend API
    // Backend will use Cashfree Secret Key to create session
    // For now, using test mode with mock session
    
    const sessionId = `session_${data.orderId}_${Date.now()}`;
    
    return {
      payment_session_id: sessionId,
      order_id: data.orderId,
    };
  } catch (error) {
    console.error('Error creating payment session:', error);
    throw error;
  }
};

// Open Cashfree checkout
export const openCashfreeCheckout = async (
  paymentSessionId: string,
  onSuccess: (data: any) => void,
  onFailure: (error: any) => void,
  onCancel?: () => void
) => {
  try {
    // Check network connectivity
    if (!navigator.onLine) {
      onFailure({
        type: 'NETWORK_ERROR',
        message: 'No internet connection. Please check your network and try again.'
      });
      return;
    }

    const cashfree = await initializeCashfree();
    
    const checkoutOptions = {
      paymentSessionId: paymentSessionId,
      redirectTarget: '_modal', // Opens in modal - no page reload
      appearance: {
        theme: 'light',
        variables: {
          colorPrimary: '#EE458F',
          colorBackground: '#ffffff',
          colorText: '#000000',
          borderRadius: '8px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        },
      },
    };

    const result = await (cashfree as any).checkout(checkoutOptions);
    
    if (result.error) {
      // Payment failed with error
      onFailure({
        type: 'PAYMENT_FAILED',
        message: result.error.message || 'Payment failed',
        details: result.error
      });
    } else if (result.paymentDetails) {
      // Payment successful
      onSuccess(result.paymentDetails);
    } else {
      // Payment cancelled by user
      if (onCancel) {
        onCancel();
      } else {
        onFailure({
          type: 'PAYMENT_CANCELLED',
          message: 'Payment was cancelled'
        });
      }
    }
  } catch (error: any) {
    console.error('Cashfree checkout error:', error);
    
    // Detect network errors
    if (error.message?.includes('network') || error.message?.includes('fetch') || !navigator.onLine) {
      onFailure({
        type: 'NETWORK_ERROR',
        message: 'Network error occurred. Please check your connection and try again.',
        details: error
      });
    } else {
      onFailure({
        type: 'PAYMENT_ERROR',
        message: 'Failed to process payment. Please try again.',
        details: error
      });
    }
  }
};

// For test mode - simulate payment
export const simulateTestPayment = (orderId: string): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        orderId: orderId,
        paymentStatus: 'SUCCESS',
        transactionId: `TXN${Date.now()}`,
        paymentMode: 'TEST',
      });
    }, 2000);
  });
};
