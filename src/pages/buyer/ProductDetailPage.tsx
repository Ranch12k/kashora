import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicProductAPI, PublicProductDetail, cartAPI, wishlistAPI, chatAPI } from '../../services/api';
import BuyerLayout from '../../components/BuyerLayout';
import { useAuth } from '../../context/AuthContext';

const S = {
  container: { padding: '2rem 4%', width: '100%', maxWidth: '1280px', boxSizing: 'border-box' as const, margin: '0 auto', fontFamily: "'Outfit', 'Inter', sans-serif" },
  backBtn: { padding: '0.5rem 1rem', background: 'var(--byr-card-bg)', border: '1px solid var(--byr-border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: 'var(--byr-text-2)', fontSize: '0.85rem', marginBottom: '1.5rem' },
  gallery: { display: 'flex', flexDirection: 'column' as const, gap: '1rem' },
  mainImage: { width: '100%', height: '450px', background: 'var(--byr-card-bg)', borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--byr-card-border)' },
  thumbnails: { display: 'flex', gap: '0.75rem', overflowX: 'auto' as const, paddingBottom: '0.5rem' },
  thumb: (active: boolean) => ({
    width: '70px', height: '70px', borderRadius: '6px', objectFit: 'cover' as const, border: active ? '2px solid var(--byr-accent)' : '1px solid var(--byr-card-border)', cursor: 'pointer'
  }),
  infoCard: { display: 'flex', flexDirection: 'column' as const, gap: '1.25rem' },
  brand: { fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' as const, color: 'var(--byr-accent)', letterSpacing: '0.05em' },
  title: { fontSize: '1.75rem', fontWeight: '700', color: 'var(--byr-text-1)' },
  category: { fontSize: '0.88rem', color: 'var(--byr-text-3)' },
  priceBlock: { background: 'var(--byr-accent-light)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--byr-accent-light)' },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: '0.75rem' },
  price: { fontSize: '1.75rem', fontWeight: '800', color: 'var(--byr-accent)' },
  comparePrice: { fontSize: '1.1rem', color: 'var(--byr-text-muted)', textDecoration: 'line-through' },
  discount: { fontSize: '1rem', fontWeight: '700', color: 'var(--badge-green-txt)' },
  taxNote: { fontSize: '0.78rem', color: 'var(--byr-text-muted)', marginTop: '0.4rem' },
  variantsBlock: { borderTop: '1px solid var(--byr-border)', paddingTop: '1.25rem' },
  subTitle: { fontSize: '0.95rem', fontWeight: '700', color: 'var(--byr-text-1)', marginBottom: '0.75rem' },
  variantChips: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap' as const },
  chip: (selected: boolean) => ({
    padding: '0.5rem 1rem', borderRadius: '8px', border: selected ? '2px solid var(--byr-accent)' : '1px solid var(--byr-border)', background: selected ? 'var(--byr-accent-light)' : 'var(--byr-card-bg)', color: selected ? 'var(--byr-accent)' : 'var(--byr-text-2)', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
  }),
  stockBadge: (inStock: boolean) => ({
    background: inStock ? 'var(--badge-green-bg)' : 'var(--badge-red-bg)',
    color: inStock ? 'var(--badge-green-txt)' : 'var(--badge-red-txt)',
    padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-block'
  }),
  sellerCard: { background: 'var(--byr-card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--byr-border)', marginTop: '1.5rem' },
  desc: { color: 'var(--byr-text-2)', fontSize: '0.92rem', lineHeight: '1.6' },
  policyRow: { display: 'flex', gap: '1.5rem', background: 'var(--byr-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--byr-border)', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--byr-text-2)' }
};

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<PublicProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    publicProductAPI.get(slug)
      .then(res => {
        setProduct(res.data);
        if (res.data.images.length > 0) {
          const primary = res.data.images.find(img => img.is_primary);
          setActiveImage(primary ? primary.image : res.data.images[0].image);
        }
        if (res.data.variants.length > 0) {
          setSelectedVariantId(res.data.variants[0].id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (isAuthenticated) {
      wishlistAPI.list()
        .then(res => setWishlistItems(res.data))
        .catch(err => console.error(err));
    }
  }, [isAuthenticated]);

  const wishlistItem = wishlistItems.find(item => item.product_slug === product?.slug);
  const isWishlisted = !!wishlistItem;

  const handleAddToCart = () => {
    if (!selectedVariantId) {
      alert('Please select a variant option first.');
      return;
    }

    setIsAdding(true);
    const selectedVariant = product?.variants.find(v => v.id === selectedVariantId);
    const guestItemDetails = {
      sku: selectedVariant?.sku || 'N/A',
      product_name: product?.name,
      product_slug: product?.slug,
      price: selectedVariant?.price || product?.base_price,
      primary_image: product?.images?.find(img => img.is_primary)?.image || product?.images?.[0]?.image || null
    };

    cartAPI.add(selectedVariantId, 1, guestItemDetails)
      .then(() => {
        navigate('/cart');
      })
      .catch(err => {
        alert(err.response?.data?.quantity || 'Failed to add item to cart.');
        setIsAdding(false);
      });
  };

  const handleAddToWishlist = () => {
    if (!isAuthenticated) {
      alert('Please log in to use the wishlist.');
      navigate('/login', { state: { from: `/products/${product?.slug}` } });
      return;
    }

    if (isWishlisted) {
      // Optimistic delete
      setWishlistItems(prev => prev.filter(item => item.id !== wishlistItem.id));
      setIsWishlistLoading(true);
      wishlistAPI.delete(wishlistItem.id)
        .catch(err => {
          console.error(err);
          // Revert on error
          setWishlistItems(prev => [...prev, wishlistItem]);
        })
        .finally(() => setIsWishlistLoading(false));
    } else {
      if (!selectedVariantId) {
        alert('Please select a variant option first.');
        return;
      }
      
      // Optimistic add
      const tempId = 'temp-' + Date.now();
      const optimisticItem = { id: tempId, product_slug: product?.slug };
      setWishlistItems(prev => [...prev, optimisticItem]);
      
      setIsWishlistLoading(true);
      wishlistAPI.add(selectedVariantId)
        .then(res => setWishlistItems(prev => prev.map(item => item.id === tempId ? { ...res.data, product_slug: product?.slug } : item)))
        .catch(err => {
          setWishlistItems(prev => prev.filter(item => item.id !== tempId));
          alert(err.response?.data?.detail || 'Failed to add item to wishlist.');
        })
        .finally(() => setIsWishlistLoading(false));
    }
  };

  if (loading) {
    return (
      <BuyerLayout>
        <div style={S.container}>Loading product details...</div>
      </BuyerLayout>
    );
  }

  if (!product) {
    return (
      <BuyerLayout>
        <div style={S.container}>
          <button style={S.backBtn} onClick={() => navigate('/products')}>← Back</button>
          <p>Product not found.</p>
        </div>
      </BuyerLayout>
    );
  }

  const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
  const currentPrice = selectedVariant ? selectedVariant.price : product.base_price;
  const currentComparePrice = selectedVariant ? selectedVariant.compare_at_price : product.compare_at_price;
  const inStock = selectedVariant ? selectedVariant.in_stock : product.in_stock;
  const qtyAvailable = selectedVariant ? selectedVariant.available_quantity : 0;

  const discountPct = currentComparePrice ? Math.round(((Number(currentComparePrice) - Number(currentPrice)) / Number(currentComparePrice)) * 100) : 0;

  const showVariants = product.variants.length > 1 || (product.variants.length === 1 && product.variants[0].attribute_summary && product.variants[0].attribute_summary.toLowerCase() !== 'default');

  return (
    <BuyerLayout>
      <div style={S.container}>
        <button style={S.backBtn} onClick={() => navigate('/products')}>← Back to Catalog</button>

        <div className="byr-pdp-layout">
          <div style={S.gallery}>
            <div style={S.mainImage}>
              {activeImage ? (
                <img src={activeImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '4rem' }}>🛍️</span>
              )}
            </div>
            <div style={S.thumbnails}>
              {product.images.map(img => (
                <img
                  key={img.id}
                  src={img.image}
                  alt={img.alt_text}
                  style={S.thumb(activeImage === img.image)}
                  onClick={() => setActiveImage(img.image)}
                />
              ))}
            </div>
          </div>

          <div style={S.infoCard}>
            <div>
              <span style={S.brand}>{product.brand}</span>
              <h1 style={S.title}>{product.name}</h1>
              <span style={S.category}>Category: <strong>{product.category_name}</strong></span>
            </div>

            <div style={S.priceBlock}>
              <div style={S.priceRow}>
                <span style={S.price}>₹{currentPrice}</span>
                {currentComparePrice && (
                  <>
                    <span style={S.comparePrice}>₹{currentComparePrice}</span>
                    <span style={S.discount}>{discountPct}% OFF</span>
                  </>
                )}
              </div>
              <p style={S.taxNote}>inclusive of all taxes (GST {product.tax_percentage}%)</p>
            </div>

            {showVariants && (
              <div style={S.variantsBlock}>
                <h4 style={S.subTitle}>Select Size/Color Option</h4>
                <div style={S.variantChips}>
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      style={S.chip(selectedVariantId === v.id)}
                      onClick={() => setSelectedVariantId(v.id)}
                    >
                      {v.attribute_summary || (v.sku ? v.sku.split('-').pop() : 'Standard')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '0.5rem' }}>
              <span style={S.stockBadge(inStock)}>
                {inStock ? `In Stock (Only ${qtyAvailable} left)` : 'Out of Stock'}
              </span>
            </div>

            <div className="byr-pdp-actions" style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                style={{
                  flex: 1, padding: '0.85rem', border: 'none', background: (inStock && !isAdding) ? 'var(--byr-accent)' : 'var(--byr-text-muted)', color: '#fff',
                  borderRadius: '8px', cursor: (inStock && !isAdding) ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '1rem'
                }}
                onClick={handleAddToCart}
                disabled={!inStock || isAdding}
              >
                {!inStock ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                style={{
                  padding: '0.85rem', width: '3.5rem', background: 'var(--byr-bg)', border: '1px solid var(--byr-border)',
                  borderRadius: '8px', cursor: isWishlistLoading ? 'not-allowed' : 'pointer', fontSize: '1.25rem',
                  color: isWishlisted ? 'var(--byr-accent)' : 'var(--byr-text-2)', transition: 'color 0.2s'
                }}
                onClick={handleAddToWishlist}
                disabled={isWishlistLoading}
              >
                {isWishlisted ? '♥' : '♡'}
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--byr-border)', paddingTop: '1.25rem' }}>
              <h4 style={S.subTitle}>Product Description</h4>
              <p style={S.desc}>{product.description}</p>
            </div>

            {/* Return & Shipping Badges */}
            <div style={S.policyRow}>
              <span>🚚 Shipping: ₹{product.shipping_charge}</span>
              <span>↩️ {product.returnable ? `Return window: ${product.return_window_days} days` : 'Non-Returnable'}</span>
            </div>

            {/* Seller / Store details */}
            <div style={S.sellerCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--byr-text-3)', fontWeight: '700', textTransform: 'uppercase' }}>Sold By</span>
                  <h5 style={{ fontSize: '0.98rem', fontWeight: '700', color: 'var(--byr-text-1)', marginTop: '0.2rem' }}>🏡 {product.seller_store}</h5>
                </div>
                {isAuthenticated && (
                  <button 
                    onClick={() => {
                      chatAPI.startThread(product.seller)
                        .then(() => navigate('/messages'))
                        .catch(err => alert('Failed to start chat.'));
                    }}
                    style={{ padding: '6px 12px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    💬 Message Seller
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
};

export default ProductDetailPage;
