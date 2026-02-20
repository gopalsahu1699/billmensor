'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { toast } from 'sonner'
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    User,
    Package,
    ArrowRight,
    Zap,
    X,
    CreditCard,
    Wallet,
    Banknote,
    ChevronDown
} from 'lucide-react'
import { SelectorModal } from '@/components/ui/SelectorModal'
import { cn } from '../../../lib/utils'

export default function POSPage() {
    const router = useRouter()
    const [products, setProducts] = useState<any[]>([])
    const [customers, setCustomers] = useState<any[]>([])
    const [cart, setCart] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
    const [paymentMode, setPaymentMode] = useState('cash')
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const [prodRes, custRes] = await Promise.all([
                supabase.from('products').select('*').order('name'),
                supabase.from('customers').select('*').order('name')
            ])

            if (prodRes.error) throw prodRes.error
            if (custRes.error) throw custRes.error

            setProducts(prodRes.data || [])
            setCustomers(custRes.data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
    )

    const addToCart = (product: any) => {
        const existing = cart.find(item => item.id === product.id)
        if (existing) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ))
        } else {
            setCart([...cart, { ...product, quantity: 1 }])
        }
    }

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.id !== productId))
    }

    const updateQuantity = (productId: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const total = subtotal // Add tax/discount logic here if needed

    const checkout = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty!')
            return
        }

        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            // 1. Create Sales Invoice
            const { data: invoice, error: invError } = await supabase
                .from('invoices')
                .insert([{
                    user_id: userData.user.id,
                    customer_id: selectedCustomer?.id || null, // Allow null for walk-ins if supported by schema, or use a default party
                    invoice_number: `POS-${Date.now().toString().slice(-6)}`,
                    invoice_date: new Date().toISOString().split('T')[0],
                    subtotal: subtotal,
                    total_amount: total,
                    amount_paid: total,
                    balance_amount: 0,
                    payment_status: 'paid', // POS is typically paid
                    billing_address: selectedCustomer?.billing_address || null,
                    shipping_address: selectedCustomer?.shipping_address || null,
                    supply_place: selectedCustomer?.supply_place || null,
                    notes: `POS Transaction - Mode: ${paymentMode}`
                }])
                .select()
                .single()

            if (invError) throw invError

            // 2. Create Sales Invoice Items
            const invoiceItems = cart.map(item => ({
                user_id: userData.user.id,
                invoice_id: invoice.id,
                product_id: item.id,
                name: item.name,
                quantity: item.quantity,
                unit_price: item.price,
                tax_rate: item.tax_rate || 0,
                tax_amount: (item.price * item.quantity * (item.tax_rate || 0)) / 100,
                total: item.price * item.quantity
            }))

            const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems)
            if (itemsError) throw itemsError

            toast.success('Transaction completed successfully!')
            setCart([])
            setSelectedCustomer(null)
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Left Column: Product Selection */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Zap className="text-blue-500" fill="currentColor" size={20} />
                            Terminal
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">Quick item search and selection</p>
                    </div>
                    <div className="relative group w-full max-w-xs">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Scan SKU or name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-transparent focus:border-blue-500/20 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-medium"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => addToCart(p)}
                                className="flex flex-col text-left bg-slate-50 dark:bg-white/5 border border-transparent hover:border-blue-600/30 hover:bg-blue-600/5 p-4 rounded-2xl transition-all group active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 mb-3 shadow-sm border border-slate-100 dark:border-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <Package size={20} />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate w-full mb-1">{p.name}</h3>
                                <p className="text-xs font-black text-blue-600 dark:text-blue-400 leading-none">₹ {(p.price || 0).toLocaleString('en-IN')}</p>
                            </button>
                        ))}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                            <Package size={48} strokeWidth={1} className="mb-4 text-slate-200 dark:text-slate-800" />
                            <p className="font-medium italic">No products found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Cart & Checkout */}
            <div className="w-full lg:w-[400px] flex flex-col bg-slate-900 border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative">
                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                        <ShoppingCart size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white leading-none">Cart</h2>
                        <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest mt-1 block">Checkout Ledger</span>
                    </div>
                    <button onClick={() => setCart([])} className="ml-auto p-2 text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 size={18} />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                    {cart.map((item) => (
                        <div key={item.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl group animate-in slide-in-from-right-2 duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-sm font-black text-white mb-0.5">{item.name}</h4>
                                    <p className="text-[10px] text-blue-400 font-black">₹ {(item.price || 0).toLocaleString('en-IN')} / unit</p>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition-all">
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1 border border-white/5">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-all active:scale-90">
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-8 text-center text-xs font-black text-white">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-all active:scale-90">
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <span className="text-sm font-black text-white">₹ {(item.price * item.quantity || 0).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 py-10">
                            <ShoppingCart size={32} strokeWidth={1} className="mb-2" />
                            <p className="text-xs font-bold uppercase tracking-widest italic">Order is empty</p>
                        </div>
                    )}
                </div>

                {/* Checkout Section */}
                <div className="p-6 bg-black/40 border-t border-white/5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsCustomerModalOpen(true)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50 transition-all font-bold text-left flex items-center justify-between"
                            >
                                <span className={selectedCustomer ? "text-white" : "text-slate-400"}>
                                    {selectedCustomer ? selectedCustomer.name : "Walk-in Customer"}
                                </span>
                                <ChevronDown size={14} className="text-slate-500" />
                            </button>
                            <SelectorModal
                                isOpen={isCustomerModalOpen}
                                onClose={() => setIsCustomerModalOpen(false)}
                                title="Select Customer"
                                items={customers}
                                searchKeys={['name', 'phone', 'email']}
                                valueKey="id"
                                selectedValue={selectedCustomer?.id}
                                onSelect={(c) => setSelectedCustomer(c)}
                                renderItem={(c) => (
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors uppercase tracking-tight">{c.name}</span>
                                        <span className="text-xs text-slate-500">{c.phone || 'No phone'} • {c.email || 'No email'}</span>
                                    </div>
                                )}
                            />
                        </div>
                        <select
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50 transition-all font-bold"
                            value={paymentMode}
                            onChange={(e) => setPaymentMode(e.target.value)}
                        >
                            <option value="cash">Cash Payment</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="upi">UPI / QuickPay</option>
                        </select>
                    </div>

                    <div className="space-y-2 border-b border-white/5 pb-4">
                        <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span>₹ {(subtotal || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black text-white">
                            <span>Total Amount</span>
                            <span className="text-blue-400">₹ {(total || 0).toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <button
                        onClick={checkout}
                        disabled={cart.length === 0}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 group"
                    >
                        Checkout Order
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    )
}
