'use client'

import { useState } from 'react'

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  stock: number
  available: boolean
  category: string | null
  createdAt: string
  updatedAt: string
}

type OrderItem = {
  id: string
  productId: string
  quantity: number
  price: number
  product: { id: string; name: string }
}

type Order = {
  id: string
  status: 'pending' | 'ready' | 'picked_up' | 'cancelled'
  notes: string | null
  createdAt: string
  items: OrderItem[]
}

type CartItem = { product: Product; quantity: number }

type Props = {
  products: Product[]
  myOrders: Order[]
}

const STATUS_LABEL: Record<Order['status'], string> = {
  pending:   'Pending',
  ready:     'Ready for Pickup',
  picked_up: 'Picked Up',
  cancelled: 'Cancelled',
}

const STATUS_COLOR: Record<Order['status'], string> = {
  pending:   'text-amber-600 bg-amber-50 border-amber-200',
  ready:     'text-green-700 bg-green-50 border-green-200',
  picked_up: 'text-ash bg-mist border-smoke',
  cancelled: 'text-brand-red bg-red-50 border-red-200',
}

export function StoreClient({ products, myOrders: initialOrders }: Props) {
  const [cart,     setCart]     = useState<CartItem[]>([])
  const [orders,   setOrders]   = useState<Order[]>(initialOrders)
  const [tab,      setTab]      = useState<'shop' | 'orders'>('shop')
  const [checkout, setCheckout] = useState(false)
  const [notes,    setNotes]    = useState('')
  const [placing,  setPlacing]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState('')
  const [selected, setSelected] = useState<Product | null>(null)

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product, quantity: 1 }]
    })
    setSelected(null)
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== productId))
    } else {
      setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i))
    }
  }

  async function placeOrder() {
    setPlacing(true)
    setError('')
    const res = await fetch('/api/store/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        notes: notes.trim() || null,
      }),
    })
    if (res.ok) {
      const order = await res.json()
      setOrders(prev => [order, ...prev])
      setCart([])
      setNotes('')
      setCheckout(false)
      setSuccess(true)
      setTab('orders')
      setTimeout(() => setSuccess(false), 5000)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Order failed.')
    }
    setPlacing(false)
  }

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Gear</span>
          </div>
          <h1 className="font-display text-2xl text-ink">AscendIt Store</h1>
        </div>
        <div className="flex gap-2 items-center">
          {cart.length > 0 && (
            <button
              onClick={() => setCheckout(true)}
              className="relative px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
            >
              Cart ({cartCount}) — ${(cartTotal / 100).toFixed(2)}
            </button>
          )}
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div className="mb-4 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Order placed! You&apos;ll be notified when it&apos;s ready for pickup.
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-smoke mb-6">
        {(['shop', 'orders'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${
              tab === t ? 'border-brand-red text-ink' : 'border-transparent text-ash hover:text-ink'
            }`}
          >
            {t === 'shop' ? 'Shop' : `My Orders${orders.length > 0 ? ` (${orders.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Shop tab */}
      {tab === 'shop' && (
        <>
          {products.length === 0 ? (
            <div className="border border-smoke bg-paper p-16 text-center">
              <p className="text-ash text-sm">No products yet. Check back soon!</p>
            </div>
          ) : (
            <>
              {categories.map(cat => (
                <div key={cat} className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">{cat}</p>
                  <ProductGrid products={products.filter(p => p.category === cat)} onSelect={setSelected} onAdd={addToCart} cart={cart} />
                </div>
              ))}
              {products.filter(p => !p.category).length > 0 && (
                <ProductGrid products={products.filter(p => !p.category)} onSelect={setSelected} onAdd={addToCart} cart={cart} />
              )}
            </>
          )}
        </>
      )}

      {/* Orders tab */}
      {tab === 'orders' && (
        <div className="flex flex-col gap-4">
          {orders.length === 0 && (
            <div className="border border-smoke bg-paper p-12 text-center">
              <p className="text-ash text-sm">No orders yet.</p>
              <button onClick={() => setTab('shop')} className="mt-3 text-sm text-brand-red hover:underline">Browse the store</button>
            </div>
          )}
          {orders.map(order => (
            <div key={order.id} className="border border-smoke bg-paper p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p suppressHydrationWarning className="text-xs text-ash">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-xs text-ash mt-0.5">Order #{order.id.slice(-6).toUpperCase()}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 border ${STATUS_COLOR[order.status]}`}>
                  {STATUS_LABEL[order.status]}
                </span>
              </div>
              <div className="flex flex-col gap-1 mb-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-ink">
                    <span>{item.product.name} {item.quantity > 1 && <span className="text-ash">×{item.quantity}</span>}</span>
                    <span>${((item.price * item.quantity) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-smoke pt-2 flex justify-between text-sm font-bold text-ink">
                <span>Total</span>
                <span>${(order.items.reduce((s, i) => s + i.price * i.quantity, 0) / 100).toFixed(2)}</span>
              </div>
              {order.notes && <p className="text-xs text-ash mt-2 italic">{order.notes}</p>}
              {order.status === 'ready' && (
                <p className="mt-2 text-xs font-medium text-green-700">✓ Ready — come pick it up at the front desk!</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Product detail modal */}
      {selected && (
        <ProductModal product={selected} cart={cart} onAdd={addToCart} onClose={() => setSelected(null)} />
      )}

      {/* Checkout modal */}
      {checkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setCheckout(false)} />
          <div className="relative z-10 w-full max-w-md bg-paper border border-smoke shadow-xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-smoke">
              <h2 className="font-display text-lg text-ink">Your Cart</h2>
              <button onClick={() => setCheckout(false)} className="text-ash hover:text-ink text-xl">×</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3">
                  {item.product.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-14 h-14 object-cover border border-smoke shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{item.product.name}</p>
                    <p className="text-xs text-ash">${(item.product.price / 100).toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="w-6 h-6 border border-smoke text-steel hover:border-steel flex items-center justify-center text-sm">−</button>
                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="w-6 h-6 border border-smoke text-steel hover:border-steel flex items-center justify-center text-sm">+</button>
                  </div>
                  <p className="text-sm font-medium w-14 text-right shrink-0">${((item.product.price * item.quantity) / 100).toFixed(2)}</p>
                </div>
              ))}

              <div className="border-t border-smoke pt-3 flex justify-between font-bold text-ink">
                <span>Total</span>
                <span>${(cartTotal / 100).toFixed(2)}</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-widest text-steel">Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Size, color preference, etc."
                  className="w-full px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red"
                />
              </div>

              <p className="text-xs text-ash">Payment is collected at pickup. You&apos;ll be notified when your order is ready.</p>

              {error && <p className="text-sm text-brand-red">{error}</p>}

              <button
                onClick={placeOrder}
                disabled={placing}
                className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {placing ? 'Placing Order…' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductGrid({ products, onSelect, onAdd, cart }: {
  products: Product[]
  onSelect: (p: Product) => void
  onAdd: (p: Product) => void
  cart: CartItem[]
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {products.map(product => {
        const inCart = cart.find(i => i.product.id === product.id)
        return (
          <div key={product.id} className="border border-smoke bg-paper hover:border-steel transition-colors flex flex-col">
            <div
              onClick={() => onSelect(product)}
              className="cursor-pointer aspect-square bg-mist flex items-center justify-center overflow-hidden"
            >
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-ash text-xs">No image</span>
              )}
            </div>
            <div className="p-3 flex flex-col gap-2 flex-1">
              <div>
                <p className="text-sm font-medium text-ink leading-tight">{product.name}</p>
                <p className="text-sm font-bold text-ink mt-0.5">${(product.price / 100).toFixed(2)}</p>
              </div>
              {product.stock === 0 ? (
                <span className="text-xs text-ash">Out of stock</span>
              ) : (
                <button
                  onClick={() => onAdd(product)}
                  className="mt-auto px-3 py-1.5 bg-brand-red text-paper font-bold text-xs tracking-wide hover:bg-red-700 transition-colors"
                >
                  {inCart ? `In Cart (${inCart.quantity})` : 'Add to Cart'}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProductModal({ product, cart, onAdd, onClose }: {
  product: Product
  cart: CartItem[]
  onAdd: (p: Product) => void
  onClose: () => void
}) {
  const inCart = cart.find(i => i.product.id === product.id)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-paper border border-smoke shadow-xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-smoke">
          <h2 className="font-display text-lg text-ink">{product.name}</h2>
          <button onClick={onClose} className="text-ash hover:text-ink text-xl">×</button>
        </div>
        {product.imageUrl && (
          <div className="bg-mist flex items-center justify-center max-h-72 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl} alt={product.name} className="max-h-72 max-w-full object-contain" />
          </div>
        )}
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-ink">${(product.price / 100).toFixed(2)}</p>
            {product.stock > 0 && product.stock <= 5 && (
              <span className="text-xs text-amber-600 font-medium">Only {product.stock} left</span>
            )}
          </div>
          {product.description && <p className="text-sm text-steel">{product.description}</p>}
          <p className="text-xs text-ash">Payment collected at pickup.</p>
          {product.stock === 0 ? (
            <p className="text-sm text-ash font-medium">Out of stock</p>
          ) : (
            <button
              onClick={() => onAdd(product)}
              className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
            >
              {inCart ? `Add Another (${inCart.quantity} in cart)` : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
