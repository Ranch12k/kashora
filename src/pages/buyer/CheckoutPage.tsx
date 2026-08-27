import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, cartAPI, CheckoutPayload } from '../../services/api';
import BuyerLayout from '../../components/BuyerLayout';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentForm } from './PaymentForm';

// Initialize Stripe (mock key for development)
const stripePromise = loadStripe('pk_test_mock');


interface FormData {
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  payment_method: 'COD' | 'PREPAID';
  notes: string;
}

const INITIAL_FORM: FormData = {
  full_name: '', phone: '', line1: '', line2: '',
  city: '', state: '', pincode: '',
  payment_method: 'COD', notes: ''
};

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [cartData, setCartData] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Stripe State
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');

  React.useEffect(() => {
    cartAPI.get()
      .then(res => {
        if (res.data.items.length === 0) {
          navigate('/cart');
        } else {
          setCartData(res.data);
        }
      })
      .catch(() => navigate('/cart'));
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    const { full_name, phone, line1, city, state, pincode, payment_method, notes } = form;
    if (!full_name || !phone || !line1 || !city || !state || !pincode) {
      setError('Please fill in all required shipping address fields.');
      return;
    }
    setError('');
    setLoading(true);

    const payload: CheckoutPayload = {
      payment_method,
      shipping_address: { full_name, phone, line1, line2: form.line2, city, state, pincode },
      notes,
    };
    
    if (appliedCoupon) {
      payload.coupon_code = appliedCoupon.coupon_code;
    }

    orderAPI.checkout(payload)
      .then(async res => {
        const createdOrderId = res.data.id;
        
        if (payment_method === 'PREPAID') {
          try {
            const intentRes = await orderAPI.createPaymentIntent(createdOrderId);
            setClientSecret(intentRes.data.clientSecret);
            setOrderId(createdOrderId);
          } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to initialize payment.');
          }
        } else {
          navigate(`/orders/${createdOrderId}`, { state: { orderPlaced: true } });
        }
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  if (!cartData) return <BuyerLayout><div className="byr-container">Loading checkout...</div></BuyerLayout>;

  if (clientSecret) {
    return (
      <BuyerLayout>
        <div className="byr-container" style={{ maxWidth: '800px' }}>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm orderId={orderId} clientSecret={clientSecret} />
          </Elements>
        </div>
      </BuyerLayout>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await orderAPI.validateCoupon({
        code: couponCode,
        order_amount: cartData.total_price
      });
      setAppliedCoupon(res.data);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.non_field_errors?.[0] || 'Invalid coupon code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const shippingFee = cartData.items.length > 0 ? 50 : 0;
  
  // Calculate discount
  const discountAmount = appliedCoupon ? parseFloat(appliedCoupon.discount_amount) : 0;
  const grandTotal = parseFloat(cartData.total_price) + shippingFee - discountAmount;

  return (
    <BuyerLayout>
      <div className="byr-container" style={{ maxWidth: '800px' }}>
        <h1 className="byr-title">Checkout</h1>

        {/* Shipping Address */}
        <div className="byr-box">
          <h3 className="byr-section-title">Shipping Address</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="byr-form-group" style={{ flex: '1 1 200px' }}>
              <label className="byr-label">Full Name *</label>
              <input className="byr-input" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Enter full name" />
            </div>
            <div className="byr-form-group" style={{ flex: '1 1 200px' }}>
              <label className="byr-label">Phone Number *</label>
              <input className="byr-input" name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit phone" />
            </div>
          </div>
          <div className="byr-form-group">
            <label className="byr-label">Address Line 1 *</label>
            <input className="byr-input" name="line1" value={form.line1} onChange={handleChange} placeholder="House No., Street, Area" />
          </div>
          <div className="byr-form-group">
            <label className="byr-label">Address Line 2 (Optional)</label>
            <input className="byr-input" name="line2" value={form.line2} onChange={handleChange} placeholder="Landmark, Locality" />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="byr-form-group" style={{ flex: '1 1 150px' }}>
              <label className="byr-label">City *</label>
              <input className="byr-input" name="city" value={form.city} onChange={handleChange} placeholder="City" />
            </div>
            <div className="byr-form-group" style={{ flex: '1 1 150px' }}>
              <label className="byr-label">State *</label>
              <input className="byr-input" name="state" value={form.state} onChange={handleChange} placeholder="State" />
            </div>
            <div className="byr-form-group" style={{ flex: '0 1 130px' }}>
              <label className="byr-label">Pincode *</label>
              <input className="byr-input" name="pincode" value={form.pincode} onChange={handleChange} placeholder="6-digit" maxLength={6} />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="byr-box">
          <h3 className="byr-section-title">Payment Method</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '1rem', color: 'var(--byr-text-1)', fontWeight: 600 }}>
              <input type="radio" name="payment_method" value="COD" checked={form.payment_method === 'COD'} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />
              Cash on Delivery (COD)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '1rem', color: 'var(--byr-text-1)', fontWeight: 600 }}>
              <input type="radio" name="payment_method" value="PREPAID" checked={form.payment_method === 'PREPAID'} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />
              Online Payment (Stripe)
            </label>
          </div>
        </div>

        {/* Order Notes */}
        <div className="byr-box">
          <h3 className="byr-section-title">Order Notes (Optional)</h3>
          <textarea
            className="byr-input"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            style={{ resize: 'vertical', minHeight: '80px' }}
            placeholder="Special instructions for delivery..."
          />
        </div>

        {/* Coupon Code */}
        <div className="byr-box">
          <h3 className="byr-section-title">Apply Coupon</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              className="byr-input" 
              value={couponCode} 
              onChange={e => setCouponCode(e.target.value.toUpperCase())} 
              placeholder="Enter code" 
              disabled={!!appliedCoupon}
              style={{ flex: 1, textTransform: 'uppercase' }}
            />
            {!appliedCoupon ? (
              <button 
                className="byr-btn byr-btn--secondary" 
                onClick={handleApplyCoupon}
                disabled={validatingCoupon || !couponCode}
              >
                {validatingCoupon ? '...' : 'Apply'}
              </button>
            ) : (
              <button 
                className="byr-btn" 
                style={{ background: 'var(--badge-red-bg)', color: 'var(--badge-red-txt)', border: 'none' }}
                onClick={removeCoupon}
              >
                Remove
              </button>
            )}
          </div>
          {couponError && <p style={{ color: 'red', fontSize: '0.85rem', marginTop: '4px' }}>{couponError}</p>}
          {appliedCoupon && <p style={{ color: 'green', fontSize: '0.85rem', marginTop: '4px' }}>Coupon applied successfully!</p>}
        </div>

        {/* Order Summary */}
        <div className="byr-box" style={{ background: 'var(--byr-bg)' }}>
          <h3 className="byr-section-title">Order Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cartData.items.map((item: any) => (
              <div key={item.id} className="byr-summary-row" style={{ fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--byr-text-1)' }}>{item.product_name} × {item.quantity}</span>
                <span style={{ fontWeight: 600 }}>₹{item.subtotal}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--byr-card-border)', margin: '8px 0' }} />
            <div className="byr-summary-row">
              <span>Subtotal</span>
              <span style={{ fontWeight: 600 }}>₹{cartData.total_price}</span>
            </div>
            <div className="byr-summary-row">
              <span>Shipping Fee</span>
              <span style={{ fontWeight: 600 }}>₹{shippingFee}</span>
            </div>
            {appliedCoupon && (
              <div className="byr-summary-row" style={{ color: 'green' }}>
                <span>Discount ({appliedCoupon.coupon_code})</span>
                <span style={{ fontWeight: 600 }}>-₹{appliedCoupon.discount_amount}</span>
              </div>
            )}
            <div className="byr-summary-row byr-summary-row--total" style={{ borderTopStyle: 'solid' }}>
              <span>Total to Pay</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {error && <div style={{ color: 'var(--badge-red-txt)', background: 'var(--badge-red-bg)', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}>⚠️ {error}</div>}

          <button
            className="byr-btn byr-btn--primary"
            style={{ width: '100%', marginTop: '16px', padding: '16px' }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Placing Order...' : `Place Order (${form.payment_method})`}
          </button>
        </div>
      </div>
    </BuyerLayout>
  );
};

export default CheckoutPage;
