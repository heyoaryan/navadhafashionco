// Cashfree Payment Gateway Integration

declare global {
  interface Window {
    Cashfree: any;
  }
}

// Cashfree Configuration - commented out as not currently used
// const CASHFREE_APP_ID = import.meta.env.VITE_CASHFREE_APP_ID || 'TEST11001660d542604c8bfb958f6d4d06610011';
// const CASHFREE_MODE = import.meta.env.VITE_CASHFREE_MODE || 'sandbox'; // 'sandbox' or 'production'

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
  onFailure: (error: any) => void
) => {
  try {
    const cashfree = await initializeCashfree();
    
    const checkoutOptions = {
      paymentSessionId: paymentSessionId,
      redirectTarget: '_modal', // Opens in modal
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
      onFailure(result.error);
    } else if (result.paymentDetails) {
      onSuccess(result.paymentDetails);
    }
  } catch (error) {
    console.error('Cashfree checkout error:', error);
    onFailure(error);
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
