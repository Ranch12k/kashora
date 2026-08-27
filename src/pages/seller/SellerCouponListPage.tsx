import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: string;
  min_order_amount: string;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  usage_limit: number | null;
  used_count: number;
}

const SellerCouponListPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('0');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  const fetchCoupons = async () => {
    try {
      const res = await apiClient.get('/seller/coupons/');
      setCoupons(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/seller/coupons/', {
        code,
        discount_type: discountType,
        discount_value: discountValue,
        min_order_amount: minOrder,
        valid_from: new Date(validFrom).toISOString(),
        valid_to: new Date(validTo).toISOString(),
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
      });
      fetchCoupons();
      // Reset form
      setCode(''); setDiscountValue(''); setMinOrder('0'); setValidFrom(''); setValidTo(''); setUsageLimit('');
    } catch (err) {
      console.error(err);
      alert('Failed to create coupon. Check dates and values.');
    }
  };

  const toggleStatus = async (coupon: Coupon) => {
    try {
      await apiClient.patch(`/seller/coupons/${coupon.id}/`, {
        is_active: !coupon.is_active
      });
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Manage Coupons</h2>
      
      <div className="bg-white p-6 rounded shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Create New Coupon</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Coupon Code</label>
            <input required type="text" value={code} onChange={e => setCode(e.target.value)} className="w-full border p-2 rounded uppercase" placeholder="e.g. SUMMER20" />
          </div>
          <div>
            <label className="block mb-1">Discount Type</label>
            <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="w-full border p-2 rounded">
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount ($)</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Discount Value</label>
            <input required type="number" step="0.01" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block mb-1">Min Order Amount</label>
            <input type="number" step="0.01" value={minOrder} onChange={e => setMinOrder(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block mb-1">Valid From</label>
            <input required type="datetime-local" value={validFrom} onChange={e => setValidFrom(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block mb-1">Valid To</label>
            <input required type="datetime-local" value={validTo} onChange={e => setValidTo(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block mb-1">Usage Limit (Optional)</label>
            <input type="number" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} className="w-full border p-2 rounded" placeholder="Leave empty for unlimited" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Coupon</button>
          </div>
        </form>
      </div>

      <h3 className="text-xl font-bold mb-4">Active Coupons</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coupons.map(coupon => (
          <div key={coupon.id} className={`p-4 border rounded shadow ${!coupon.is_active ? 'opacity-50' : ''}`}>
            <h4 className="font-bold text-lg mb-2">{coupon.code}</h4>
            <p><strong>Discount:</strong> {coupon.discount_value}{coupon.discount_type === 'PERCENTAGE' ? '%' : '$'}</p>
            <p><strong>Min Order:</strong> ${coupon.min_order_amount}</p>
            <p><strong>Used:</strong> {coupon.used_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''}</p>
            <button 
              onClick={() => toggleStatus(coupon)}
              className={`mt-4 px-3 py-1 text-sm rounded text-white ${coupon.is_active ? 'bg-red-500' : 'bg-green-500'}`}
            >
              {coupon.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
        {coupons.length === 0 && <p>No coupons found.</p>}
      </div>
    </div>
  );
};

export default SellerCouponListPage;
