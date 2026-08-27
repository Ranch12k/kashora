import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';

interface Props {
  orderId: string;
  clientSecret: string;
}

export const PaymentForm: React.FC<Props> = ({ orderId, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}?payment_success=true`,
      },
    });

    if (error) {
      setError(error.message || 'Payment failed.');
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="byr-box" style={{ marginTop: '20px' }}>
      <h3 className="byr-section-title">Complete Payment</h3>
      <PaymentElement />
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
      <button 
        disabled={!stripe || loading} 
        className="byr-btn byr-btn--primary" 
        style={{ width: '100%', marginTop: '20px', padding: '16px' }}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};
