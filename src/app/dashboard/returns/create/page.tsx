'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Save, RotateCcw, Search, IndianRupee, ChevronDown, Package, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SelectorModal } from '@/components/ui/SelectorModal'

function CreateReturnForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const type = searchParams.get('type') || 'sales_return'
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [parties, setParties] = useState<any[]>([])
    const [customers, setCustomers] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])

    const [selectedPartyId, setSelectedPartyId] = useState('')
    const [returnNumber, setReturnNumber] = useState('')
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0])
    const [items, setItems] = useState<any[]>([])

    // Totals
    const [subtotal, setSubtotal] = useState(0)
    const [taxTotal, setTaxTotal] = useState(0)
    const [grandTotal, setGrandTotal] = useState(0)
    const [isPartyModalOpen, setIsPartyModalOpen] = useState(false)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [activeItemIndex, setActiveItemIndex] = useState<string | null>(null)

    useEffect(() => {
        fetchInitialData()
        if (editId) {
            fetchReturnForEdit()
        } else {
            generateReturnNumber()
        }
    }, [type, editId])

    async function fetchReturnForEdit() {
        try {
            setLoading(true)
            const { data: ret, error: retError } = await supabase
                .from('returns')
                .select('*, return_items(*)')
                .eq('id', editId)
                .single()

            if (retError) throw retError

            setSelectedPartyId(ret.customer_id)
            setReturnNumber(ret.return_number)
            setReturnDate(ret.return_date)

            const mappedItems = ret.return_items.map((item: any) => ({
                id: item.id,
                product_id: item.product_id || '',
                name: item.name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                tax_amount: item.tax_amount,
                total: item.total
            }))
            setItems(mappedItems)
        } catch (error: any) {
            toast.error('Failed to load return for editing')
            router.push('/dashboard/returns')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        calculateTotals()
    }, [items])

    async function fetchInitialData() {
        try {
            const partyType = type === 'sales_return' ? ['customer', 'both'] : ['supplier', 'both']
            const [partyRes, prodRes] = await Promise.all([
                supabase.from('customers').select('*').in('type', partyType).order('name'),
                supabase.from('products').select('*').order('name')
            ])
            setParties(partyRes.data || [])
            setProducts(prodRes.data || [])
        } catch (error: any) {
            toast.error('Failed to load data')
        }
    }

    async function generateReturnNumber() {
        const prefix = type === 'sales_return' ? 'SR-' : 'PR-'
        const { data } = await supabase
            .from('returns')
            .select('return_number')
            .eq('type', type)
            .order('created_at', { ascending: false })
            .limit(1)

        if (data && data.length > 0) {
            const lastNum = parseInt(data[0].return_number.replace(prefix, '')) || 0
            setReturnNumber(`${prefix}${(lastNum + 1).toString().padStart(4, '0')}`)
        } else {
            setReturnNumber(`${prefix}0001`)
        }
    }

    const addItem = (product: any) => {
        const newItem = {
            id: Math.random().toString(36).substr(2, 9),
            product_id: product.id,
            name: product.name,
            quantity: 1,
            unit_price: type === 'sales_return' ? product.price : (product.purchase_price || 0),
            tax_rate: product.tax_rate,
            tax_amount: ((type === 'sales_return' ? product.price : (product.purchase_price || 0)) * product.tax_rate) / 100,
            total: (type === 'sales_return' ? product.price : (product.purchase_price || 0)) + ((type === 'sales_return' ? product.price : (product.purchase_price || 0)) * product.tax_rate) / 100
        }
        setItems([...items, newItem])
    }

    const updateItem = (itemId: string, updates: any) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                const updated = { ...item, ...updates }

                if (updates.product_id) {
                    const product = products.find(p => p.id === updates.product_id)
                    if (product) {
                        updated.name = product.name
                        updated.unit_price = type === 'sales_return' ? product.price : (product.purchase_price || 0)
                        updated.tax_rate = product.tax_rate
                    }
                }

                const base = updated.quantity * updated.unit_price
                const tax = (base * updated.tax_rate) / 100
                updated.tax_amount = tax
                updated.total = base + tax
                return updated
            }
            return item
        }))
    }

    const removeItem = (itemId: string) => setItems(items.filter(item => item.id !== itemId))

    const calculateTotals = () => {
        let s = 0, t = 0
        items.forEach(i => { s += i.unit_price * i.quantity; t += i.tax_amount })
        setSubtotal(s); setTaxTotal(t); setGrandTotal(s + t)
    }

    const handleSaveReturn = async () => {
        if (!selectedPartyId) return toast.error('Please select a party')
        if (items.length === 0) return toast.error('Please add at least one item')

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            // 1. Upsert Return
            const party = parties.find(p => p.id === selectedPartyId)
            const returnPayload = {
                user_id: userData.user.id,
                customer_id: selectedPartyId,
                return_number: returnNumber,
                return_date: returnDate,
                total_amount: grandTotal,
                billing_address: party?.billing_address || null,
                shipping_address: party?.shipping_address || null,
                supply_place: party?.supply_place || null,
                type: type
            }

            let returnId = editId
            if (editId) {
                // Reverse old stock
                const { data: oldItems } = await supabase.from('return_items').select('*').eq('return_id', editId)
                if (oldItems) {
                    for (const item of oldItems) {
                        if (item.product_id) {
                            const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single()
                            if (prod) {
                                // Revert previous impact
                                const revertedQty = type === 'sales_return'
                                    ? prod.stock_quantity - item.quantity // Was increased, now decrease
                                    : prod.stock_quantity + item.quantity; // Was decreased, now increase
                                await supabase.from('products').update({ stock_quantity: revertedQty }).eq('id', item.product_id)
                            }
                        }
                    }
                }

                const { error: retError } = await supabase
                    .from('returns')
                    .update(returnPayload)
                    .eq('id', editId)
                if (retError) throw retError

                await supabase.from('return_items').delete().eq('return_id', editId)
            } else {
                const { data: returnDoc, error: retError } = await supabase
                    .from('returns')
                    .insert([returnPayload])
                    .select().single()
                if (retError) throw retError
                returnId = returnDoc.id
            }

            const returnItems = items.map(item => ({
                user_id: userData.user.id,
                return_id: returnId,
                product_id: item.product_id || null,
                name: item.name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                tax_amount: item.tax_amount,
                total: item.total
            }))

            const { error: itemsError } = await supabase.from('return_items').insert(returnItems)
            if (itemsError) throw itemsError

            // Stock update logic
            for (const item of items) {
                if (item.product_id) {
                    const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single()
                    if (prod) {
                        const newQty = type === 'sales_return'
                            ? prod.stock_quantity + item.quantity  // Customers returning = more stock
                            : prod.stock_quantity - item.quantity; // You returning to supplier = less stock

                        await supabase.from('products').update({ stock_quantity: newQty }).eq('id', item.product_id)
                    }
                }
            }

            toast.success(editId ? 'Return updated successfully!' : 'Return recorded successfully!')
            router.push('/dashboard/returns')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 dark:bg-primary/5 p-8 md:p-12 rounded-[40px] text-white shadow-2xl border border-slate-800">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight italic uppercase">{editId ? 'Update' : 'New'} <span className="text-blue-500">Return</span></h1>
                    <p className="text-slate-400 font-medium tracking-tight whitespace-pre-line">{editId ? 'Modify existing return document.' : 'Record stock returns and adjust party accounts.'}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveReturn}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                        {loading ? 'SAVING...' : 'SAVE RETURN'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Party & Return Info</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">{type === 'sales_return' ? 'Customer' : 'Supplier'} *</label>
                                <button
                                    type="button"
                                    onClick={() => setIsPartyModalOpen(true)}
                                    className="w-full bg-white border border-slate-200 rounded-md px-3 h-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-left flex items-center justify-between transition-all"
                                >
                                    <span className={selectedPartyId ? "text-slate-900 font-bold uppercase tracking-tight" : "text-slate-400"}>
                                        {selectedPartyId
                                            ? parties.find(p => p.id === selectedPartyId)?.name || "Select Party"
                                            : "Search for a party..."
                                        }
                                    </span>
                                    <ChevronDown size={14} className="text-slate-400" />
                                </button>
                                <SelectorModal
                                    isOpen={isPartyModalOpen}
                                    onClose={() => setIsPartyModalOpen(false)}
                                    title={`Search ${type === 'sales_return' ? 'Customer' : 'Supplier'}`}
                                    items={parties}
                                    searchKeys={['name', 'phone', 'email']}
                                    valueKey="id"
                                    selectedValue={selectedPartyId}
                                    onSelect={(p) => setSelectedPartyId(p.id)}
                                    renderItem={(p) => (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 group-hover:text-blue-500 transition-colors uppercase tracking-tight">{p.name}</span>
                                            <span className="text-xs text-slate-500">{p.phone || 'No phone'} • {p.email || 'No email'}</span>
                                        </div>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Return #</label>
                                    <Input value={returnNumber} onChange={(e) => setReturnNumber(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Date</label>
                                    <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Items Returned</CardTitle>
                            <button
                                onClick={() => {
                                    setActiveItemIndex(null)
                                    setIsProductModalOpen(true)
                                }}
                                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                <Plus size={16} />
                                Add Item
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                                            <th className="pb-3 font-semibold">Item</th>
                                            <th className="pb-3 font-semibold text-center">Qty</th>
                                            <th className="pb-3 font-semibold text-center">Rate</th>
                                            <th className="pb-3 font-semibold text-right">Total</th>
                                            <th className="pb-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {items.map(item => (
                                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 pr-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-slate-900 text-sm uppercase italic tracking-tight">{item.name}</span>
                                                        <button
                                                            onClick={() => {
                                                                setActiveItemIndex(item.id)
                                                                setIsProductModalOpen(true)
                                                            }}
                                                            className="text-[10px] text-blue-500 font-bold uppercase tracking-widest hover:text-blue-600 transition-colors w-fit"
                                                        >
                                                            Replace Product
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-4 w-24">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 border-none rounded-lg py-2 text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-slate-900"
                                                    />
                                                </td>
                                                <td className="py-4 w-32 px-4">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                                                        <input
                                                            type="number"
                                                            value={item.unit_price}
                                                            onChange={(e) => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                                                            className="w-full bg-slate-50 border-none rounded-lg py-2 pl-6 text-right text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-slate-900"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-black text-slate-900 text-sm italic">₹{item.total.toLocaleString('en-IN')}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{item.tax_rate}% Tax Incl.</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right pl-4">
                                                    <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {items.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                                        <Package size={40} strokeWidth={1} className="opacity-20" />
                                                        <p className="italic text-sm font-medium">No items added. Click &quot;Add Item&quot; to begin selection.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-slate-800">
                        <CardHeader><CardTitle className="text-lg">Summary</CardTitle></CardHeader>
                        <CardContent className="space-y-4 font-medium">
                            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>₹ {subtotal.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between text-slate-400"><span>Tax</span><span>₹ {taxTotal.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between pt-4 border-t border-slate-700 text-xl font-bold"><span>Total</span><span className="text-blue-400">₹ {grandTotal.toLocaleString('en-IN')}</span></div>
                        </CardContent>
                    </Card>
                    <Card><CardHeader><CardTitle className="text-md">Inventory Impact</CardTitle></CardHeader>
                        <CardContent><p className="text-xs text-slate-500 italic">{type === 'sales_return' ? 'This will increase your stock levels.' : 'This will decrease your stock levels.'}</p></CardContent>
                    </Card>
                </div>
                <SelectorModal
                    isOpen={isProductModalOpen}
                    onClose={() => setIsProductModalOpen(false)}
                    title="Select Product"
                    items={products}
                    searchKeys={['name', 'sku']}
                    valueKey="id"
                    selectedValue={activeItemIndex ? items.find(i => i.id === activeItemIndex)?.product_id : ''}
                    onSelect={(p) => {
                        if (activeItemIndex) {
                            updateItem(activeItemIndex, { product_id: p.id })
                        } else {
                            addItem(p)
                        }
                    }}
                    renderItem={(p) => (
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors uppercase tracking-tight">{p.name}</span>
                            <span className="text-xs text-slate-500 italic">Rate: ₹{type === 'sales_return' ? p.price : (p.purchase_price || 0)} • Tax: {p.tax_rate}%</span>
                        </div>
                    )}
                />
            </div>
        </div>
    )
}

export default function CreateReturnPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Loading Return Studio...</div>}>
            <CreateReturnForm />
        </Suspense>
    )
}
