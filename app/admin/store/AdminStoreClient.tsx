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
  gymId: string | null
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
  updatedAt: string
  user: { id: string; name: string | null; email: string }
  items: OrderItem[]
}

type Props = { products: Product[]; orders: Order[] }

const ORDER_STATUSES = ['pending', 'ready', 'picked_up', 'cancelled'] as const
const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  ready:     'Ready',
  picked_up: 'Picked Up',
  cancelled: 'Cancelled',
}
const STATUS_COLOR: Record<string, string> = {
  pending:   'text-amber-700 bg-amber-50 border-amber-200',
  ready:     'text-green-700 bg-green-50 border-green-200',
  picked_up: 'text-ash bg-mist border-smoke',
  cancelled: 'text-brand-red bg-red-50 border-red-200',
}

export function AdminStoreClient({ products: initialProducts, orders: initialOrders }: Props) {
  const [products,    setProducts]    = useState<Product[]>(initialProducts)
  const [orders,      setOrders]      = useState<Order[]>(initialOrders)
  const [tab,         setTab]         = useState<'products' | 'orders'>('products')
  const [orderFilter, setOrderFilter] = useState<string>('all')
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [showAdd,     setShowAdd]     = useState(false)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return
    setDeleting(id)
    const res = await fetch(`/api/store/products/${id}`, { method: 'DELETE' })
    if (res.ok) setProducts(p => p.filter(x => x.id !== id))
    setDeleting(null)
  }

  async function updateOrderStatus(orderId: string, status: string) {
    setUpdatingOrder(orderId)
    const res = await fetch(`/api/store/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o))
    }
    setUpdatingOrder(null)
  }

  const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter)
  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Gear Store</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-smoke mb-6">
        {(['products', 'orders'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${
              tab === t ? 'border-brand-red text-ink' : 'border-transparent text-ash hover:text-ink'
            }`}
          >
            {t === 'products' ? `Products (${products.length})` : `Orders${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}`}
          </button>
        ))}
      </div>

      {/* Products tab */}
      {tab === 'products' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
            >
              + Add Product
            </button>
          </div>

          {products.length === 0 && (
            <div className="border border-smoke bg-paper p-12 text-center">
              <p className="text-ash text-sm">No products yet. Add one to get started.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map(product => (
              <div key={product.id} className="border border-smoke bg-paper flex gap-4 p-4">
                <div className="w-20 h-20 bg-mist border border-smoke shrink-0 flex items-center justify-center overflow-hidden">
                  {product.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    : <span className="text-ash text-xs">No img</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-ink">{product.name}</p>
                      {product.gymId === null && <span className="text-[10px] text-ash italic">Platform Product</span>}
                      {product.category && <p className="text-xs text-ash">{product.category}</p>}
                    </div>
                    {!product.available && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 border border-smoke text-ash shrink-0">Hidden</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-ink mt-1">${(product.price / 100).toFixed(2)}</p>
                  <p className="text-xs text-ash">Stock: {product.stock}</p>
                  {product.description && <p className="text-xs text-steel mt-1 line-clamp-2">{product.description}</p>}
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => setEditProduct(product)} className="text-xs text-steel hover:text-ink underline">Edit</button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      disabled={deleting === product.id}
                      className="text-xs text-brand-red hover:text-red-700"
                    >
                      {deleting === product.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders tab */}
      {tab === 'orders' && (
        <div className="flex flex-col gap-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', ...ORDER_STATUSES] as const).map(s => (
              <button
                key={s}
                onClick={() => setOrderFilter(s)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide border transition-colors ${
                  orderFilter === s ? 'bg-ink text-paper border-ink' : 'border-smoke text-steel hover:border-steel'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="border border-smoke bg-paper p-12 text-center">
              <p className="text-ash text-sm">No orders{orderFilter !== 'all' ? ` with status "${STATUS_LABEL[orderFilter]}"` : ''} yet.</p>
            </div>
          )}

          {filteredOrders.map(order => {
            const total = order.items.reduce((s, i) => s + i.price * i.quantity, 0)
            return (
              <div key={order.id} className="border border-smoke bg-paper p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{order.user.name ?? order.user.email}</p>
                    <p className="text-xs text-ash">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                    <p className="text-xs text-ash">Order #{order.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-2 py-1 border ${STATUS_COLOR[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mb-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm text-ink">
                      <span>{item.product.name} {item.quantity > 1 && <span className="text-ash">×{item.quantity}</span>}</span>
                      <span>${((item.price * item.quantity) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-smoke pt-1 mt-1 flex justify-between text-sm font-bold text-ink">
                    <span>Total</span>
                    <span>${(total / 100).toFixed(2)}</span>
                  </div>
                </div>

                {order.notes && <p className="text-xs text-ash italic mb-3">{order.notes}</p>}

                {/* Status actions */}
                {order.status !== 'picked_up' && order.status !== 'cancelled' && (
                  <div className="flex gap-2 flex-wrap">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        disabled={updatingOrder === order.id}
                        className="px-3 py-1.5 bg-brand-red text-paper font-bold text-xs tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
                      >
                        Mark Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'picked_up')}
                        disabled={updatingOrder === order.id}
                        className="px-3 py-1.5 bg-brand-red text-paper font-bold text-xs tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
                      >
                        Mark Picked Up
                      </button>
                    )}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      disabled={updatingOrder === order.id}
                      className="px-3 py-1.5 border border-smoke text-steel text-xs font-medium hover:border-steel hover:text-ink transition-colors disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add product modal */}
      {(showAdd || editProduct) && (
        <ProductFormModal
          product={editProduct}
          onClose={() => { setShowAdd(false); setEditProduct(null) }}
          onSaved={saved => {
            if (editProduct) {
              setProducts(p => p.map(x => x.id === saved.id ? saved : x))
            } else {
              setProducts(p => [saved, ...p])
            }
            setShowAdd(false)
            setEditProduct(null)
          }}
        />
      )}
    </div>
  )
}

function ProductFormModal({ product, onClose, onSaved }: {
  product: Product | null
  onClose: () => void
  onSaved: (p: Product) => void
}) {
  const [name,        setName]        = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price,       setPrice]       = useState(product ? String(product.price / 100) : '')
  const [imageUrl,    setImageUrl]    = useState(product?.imageUrl ?? '')
  const [stock,       setStock]       = useState(product ? String(product.stock) : '0')
  const [available,   setAvailable]   = useState(product?.available ?? true)
  const [category,    setCategory]    = useState(product?.category ?? '')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  async function save() {
    if (!name.trim()) { setError('Name required'); return }
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) { setError('Valid price required'); return }

    setSaving(true)
    setError('')
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      price: Math.round(priceNum * 100),
      imageUrl: imageUrl.trim() || null,
      stock: parseInt(stock) || 0,
      available,
      category: category.trim() || null,
    }

    const res = product
      ? await fetch(`/api/store/products/${product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/store/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    if (res.ok) {
      onSaved(await res.json())
    } else {
      const data = await res.json()
      setError(data.error ?? 'Save failed.')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-paper border border-smoke shadow-xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-smoke">
          <h2 className="font-display text-lg text-ink">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-ash hover:text-ink text-xl">×</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {[
            { label: 'Name', value: name, set: setName, placeholder: 'e.g. AscendIt Gi', required: true },
            { label: 'Category', value: category, set: setCategory, placeholder: 'e.g. Gi, No-Gi, Accessories' },
            { label: 'Image URL', value: imageUrl, set: setImageUrl, placeholder: 'https://…' },
          ].map(f => (
            <div key={f.label} className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-widest text-steel">{f.label}{f.required && ' *'}</label>
              <input
                type="text" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                className="w-full px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red"
              />
            </div>
          ))}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-widest text-steel">Description</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Product details, sizing info, etc."
              className="w-full px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red resize-none"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-bold uppercase tracking-widest text-steel">Price (USD) *</label>
              <input
                type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="29.99"
                className="w-full px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-bold uppercase tracking-widest text-steel">Stock</label>
              <input
                type="number" min="0" value={stock} onChange={e => setStock(e.target.value)}
                className="w-full px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={available} onChange={() => setAvailable(a => !a)} />
              <div className={`w-10 h-5 rounded-full transition-colors ${available ? 'bg-brand-red' : 'bg-smoke'}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-paper rounded-full shadow transition-transform ${available ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm text-ink">Visible to students</span>
          </label>

          {error && <p className="text-sm text-brand-red">{error}</p>}

          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="px-5 py-2 bg-brand-red text-paper font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={onClose}
              className="px-5 py-2 border border-smoke text-steel text-sm hover:border-steel transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
