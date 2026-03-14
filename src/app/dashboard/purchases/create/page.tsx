'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MdAdd, MdDelete, MdChevronLeft, MdCheckCircle, MdRefresh, MdExpandMore } from 'react-icons/md'
import { toast } from 'sonner'
import { Profile } from '@/types/print'
import { SelectorModal } from '@/components/ui/SelectorModal'
import { purchaseService } from '@/services/purchase.service'
import { purchaseSchema } from '@/lib/validators'

interface PurchaseItem {
    id: string
    product_id: string
    name: string
    quantity: number
    unit_price: number
    tax_rate: number
    cgst: number
    sgst: number
    igst: number
    tax_amount: number
    discount: number
    total: number
}

interface Customer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    billing_address?: string;
    shipping_address?: string;
    supply_place?: string;
}

interface Product {
    id: string;
    name: string;
    sku?: string;
    price: number;
    purchase_price?: number;
    tax_rate: number;
    hsn_code?: string;
    image_url?: string;
}

function CreatePurchaseForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [suppliers, setSuppliers] = useState<Customer[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [profile, setProfile] = useState<Profile | null>(null)

    const [selectedSupplierId, setSelectedSupplierId] = useState('')
    const [purchaseNumber, setPurchaseNumber] = useState('')
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
    const [items, setItems] = useState<PurchaseItem[]>([])

    // Totals
    const [subtotal, setSubtotal] = useState(0)
    const [taxTotal, setTaxTotal] = useState(0)
    const [cgstTotal, setCgstTotal] = useState(0)
    const [sgstTotal, setSgstTotal] = useState(0)
    const [igstTotal, setIgstTotal] = useState(0)
    const [discount, setDiscount] = useState(0)
    const [roundOff, setRoundOff] = useState(0)
    const [grandTotal, setGrandTotal] = useState(0)
    const hasAnyDiscount = items.some(item => (item.discount || 0) > 0)
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [activeItemIndex, setActiveItemIndex] = useState<string | null>(null)

    const calculateTotals = React.useCallback(() => {
        let taxableTotal = 0
        let t = 0
        let cgst = 0
        let sgst = 0
        let igst = 0

        items.forEach(item => {
            const itemTaxable = (item.unit_price * item.quantity) - (item.discount || 0)
            taxableTotal += itemTaxable
            t += item.tax_amount
            cgst += item.cgst || 0
            sgst += item.sgst || 0
            igst += item.igst || 0
        })

        setSubtotal(taxableTotal)
        setTaxTotal(t)
        setCgstTotal(cgst)
        setSgstTotal(sgst)
        setIgstTotal(igst)

        // Grand Total = Sum of (Taxable Amount + Tax) - General Discount + Round Off
        const itemsTotal = items.reduce((acc, item) => acc + item.total, 0)
        setGrandTotal(itemsTotal - discount + roundOff)
    }, [items, discount, roundOff])

    useEffect(() => {
        calculateTotals()
    }, [calculateTotals])

    const fetchInitialData = React.useCallback(async () => {
        try {
            const [suppRes, prodRes, profileRes] = await Promise.all([
                supabase.from('customers').select('*').in('type', ['supplier', 'both']).order('name'),
                supabase.from('products').select('*').order('name'),
                supabase.from('profiles').select('*').single()
            ])
            setSuppliers((suppRes.data as Customer[]) || [])
            setProducts((prodRes.data as Product[]) || [])
            setProfile(profileRes.data)
        } catch (error: unknown) {
            console.error('Initial data fetch error:', error)
            toast.error('Failed to load data')
        }
    }, [])

    const generatePurchaseNumber = React.useCallback(async () => {
        const { data } = await supabase
            .from('purchases')
            .select('purchase_number')
            .order('created_at', { ascending: false })
            .limit(1)

        if (data && data.length > 0) {
            const lastNum = parseInt(data[0].purchase_number.replace('PUR-', '')) || 0
            setPurchaseNumber(`PUR-${(lastNum + 1).toString().padStart(4, '0')}`)
        } else {
            setPurchaseNumber('PUR-0001')
        }
    }, [])

    const fetchPurchaseForEdit = React.useCallback(async () => {
        if (!editId) return
        try {
            setLoading(true)
            const { data: pur, error: purError } = await supabase
                .from('purchases')
                .select('*, purchase_items(*)')
                .eq('id', editId)
                .single()

            if (purError) throw purError

            setSelectedSupplierId(pur.supplier_id)
            setPurchaseNumber(pur.purchase_number)
            setPurchaseDate(pur.purchase_date)

            const mappedItems = pur.purchase_items.map((item: PurchaseItem) => ({
                id: item.id,
                product_id: item.product_id || '',
                name: item.name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                cgst: item.cgst || 0,
                sgst: item.sgst || 0,
                igst: item.igst || 0,
                tax_amount: item.tax_amount,
                discount: item.discount || 0,
                total: item.total
            }))
            setItems(mappedItems)
            setDiscount(pur.discount || 0)
            setRoundOff(pur.round_off || 0)
        } catch (error: unknown) {
            console.error('Fetch purchase for edit error:', error)
            toast.error('Failed to load purchase for editing')
            router.push('/dashboard/purchases')
        } finally {
            setLoading(false)
        }
    }, [editId, router])

    useEffect(() => {
        fetchInitialData()
        if (editId) {
            fetchPurchaseForEdit()
        } else {
            generatePurchaseNumber()
        }
    }, [editId, fetchInitialData, fetchPurchaseForEdit, generatePurchaseNumber])

    const addItem = (product: Product) => {
        const newItem: PurchaseItem = {
            id: Math.random().toString(36).substr(2, 9),
            product_id: product.id,
            name: product.name,
            quantity: 1,
            unit_price: product.purchase_price || 0,
            tax_rate: product.tax_rate,
            cgst: 0,
            sgst: 0,
            igst: 0,
            tax_amount: ((product.purchase_price || 0) * product.tax_rate) / 100,
            discount: 0,
            total: (product.purchase_price || 0) + ((product.purchase_price || 0) * product.tax_rate) / 100
        }
        setItems([...items, newItem])
    }

    const updateItem = (itemId: string, updates: Partial<PurchaseItem>) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                const updated = { ...item, ...updates }

                // Auto-fill from product selection
                if (updates.product_id) {
                    const product = products.find(p => p.id === updates.product_id)
                    if (product) {
                        updated.name = product.name
                        updated.unit_price = product.purchase_price || 0
                        updated.tax_rate = product.tax_rate
                    }
                }

                // Calculate item total
                const base = updated.quantity * updated.unit_price
                const taxableAmount = base - (updated.discount || 0)
                const tax = (taxableAmount * updated.tax_rate) / 100

                // Determine CGST/SGST vs IGST
                const supplier = suppliers.find(s => s.id === selectedSupplierId)
                const isInterState = profile?.state && supplier?.supply_place &&
                    profile.state.toLowerCase() !== supplier.supply_place.toLowerCase()

                if (isInterState) {
                    updated.igst = Number(tax.toFixed(2))
                    updated.cgst = 0
                    updated.sgst = 0
                } else {
                    updated.igst = 0
                    updated.cgst = Number((tax / 2).toFixed(2))
                    updated.sgst = Number((tax / 2).toFixed(2))
                }

                updated.tax_amount = Number(tax.toFixed(2))
                updated.total = Number((taxableAmount + tax).toFixed(2))
                return updated
            }
            return item
        }))
    }

    const removeItem = (itemId: string) => {
        setItems(items.filter(item => item.id !== itemId))
    }

    const handleSavePurchase = async () => {
        if (!selectedSupplierId) return toast.error('Please select a supplier')
        if (items.length === 0) return toast.error('Please add at least one item')

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const supplier = suppliers.find(s => s.id === selectedSupplierId)
            const purchasePayload = {
                // user_id handled by service
                supplier_id: selectedSupplierId,
                purchase_number: purchaseNumber,
                purchase_date: purchaseDate,
                subtotal,
                tax_total: taxTotal,
                cgst_total: cgstTotal,
                sgst_total: sgstTotal,
                igst_total: igstTotal,
                discount,
                round_off: roundOff,
                total_amount: grandTotal,
                billing_address: supplier?.billing_address || null,
                shipping_address: supplier?.shipping_address || null,
                supply_place: supplier?.supply_place || null,
                payment_status: 'draft',
                status: 'draft',
                items: items.map(item => ({
                    product_id: item.product_id || null,
                    name: item.name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    tax_rate: item.tax_rate,
                    cgst: item.cgst || 0,
                    sgst: item.sgst || 0,
                    igst: item.igst || 0,
                    tax_amount: item.tax_amount,
                    discount: item.discount || 0,
                    total: item.total
                }))
            }

            // Zod Validation
            const validatedData = purchaseSchema.parse(purchasePayload)

            if (editId) {
                // Reverse old stock
                const { data: oldItems } = await supabase.from('purchase_items').select('*').eq('purchase_id', editId)
                if (oldItems) {
                    for (const item of oldItems) {
                        if (item.product_id) {
                            await supabase.rpc('decrement_stock', {
                                pid: item.product_id,
                                qty: item.quantity
                            })
                        }
                    }
                }

                // @ts-expect-error: Supabase type mismatch hack for now
                await purchaseService.update(editId, validatedData)
            } else {
                // @ts-expect-error: Supabase type mismatch hack for now
                await purchaseService.create(validatedData)
            }

            // 3. Update Inventory Stock (Increase)
            for (const item of items) {
                if (item.product_id) {
                    const { error: stockError } = await supabase.rpc('increment_stock', {
                        pid: item.product_id,
                        qty: item.quantity
                    })

                    if (stockError) {
                        const { data: product } = await supabase
                            .from('products')
                            .select('stock_quantity')
                            .eq('id', item.product_id)
                            .single();

                        if (product) {
                            await supabase
                                .from('products')
                                .update({ stock_quantity: (product.stock_quantity || 0) + item.quantity })
                                .eq('id', item.product_id);
                        }
                    }
                }
            }

            toast.success(editId ? 'Purchase updated successfully!' : 'Purchase recorded and stock updated!')
            router.push('/dashboard/purchases')
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'An error occurred'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 dark:bg-primary/5 p-8 md:p-12 rounded-[40px] text-white shadow-2xl border border-slate-800">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight italic uppercase">{editId ? 'Update' : 'New'} <span className="text-blue-500">Purchase</span></h1>
                    <p className="text-slate-300 font-medium tracking-tight">{editId ? 'Modify existing stock entry record.' : 'Record stock entry from your suppliers.'}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSavePurchase}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <MdRefresh size={20} className="animate-spin" /> : <MdCheckCircle size={20} />}
                        {loading ? 'RECORDING...' : 'SAVE PURCHASE'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Purchase Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Supplier & Info</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Select Supplier *</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCustomerModalOpen(true)}
                                    className="w-full bg-white border border-slate-200 rounded-md px-3 h-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-left flex items-center justify-between transition-all"
                                >
                                    <span className={selectedSupplierId ? "text-slate-900 font-bold uppercase tracking-tight" : "text-slate-400"}>
                                        {selectedSupplierId
                                            ? suppliers.find(s => s.id === selectedSupplierId)?.name || "Select Supplier"
                                            : "Search for a supplier..."
                                        }
                                    </span>
                                    <MdExpandMore size={14} className="text-slate-400" />
                                </button>
                                <SelectorModal
                                    isOpen={isCustomerModalOpen}
                                    onClose={() => setIsCustomerModalOpen(false)}
                                    title="Search Supplier"
                                    items={suppliers}
                                    searchKeys={['name', 'phone', 'email']}
                                    valueKey="id"
                                    selectedValue={selectedSupplierId}
                                    onSelect={(s) => setSelectedSupplierId(s.id)}
                                    renderItem={(s) => (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 group-hover:text-blue-500 transition-colors uppercase tracking-tight">{s.name}</span>
                                            <span className="text-xs text-slate-500">{s.phone || 'No phone'} • {s.email || 'No email'}</span>
                                        </div>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Bill #</label>
                                    <Input value={purchaseNumber} onChange={(e) => setPurchaseNumber(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Date</label>
                                    <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Items Purchased</CardTitle>
                            <button
                                onClick={() => {
                                    setActiveItemIndex(null)
                                    setIsProductModalOpen(true)
                                }}
                                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                <MdAdd size={16} />
                                Add Item
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                                            <th className="pb-3 font-semibold w-[35%]">Item Description</th>
                                            <th className="pb-3 font-semibold text-center">Qty</th>
                                            <th className="pb-3 font-semibold text-center">Cost Price</th>
                                            {hasAnyDiscount && <th className="pb-3 font-semibold text-center">Disc (₹)</th>}
                                            <th className="pb-3 font-semibold text-center">Tax %</th>
                                            <th className="pb-3 font-semibold text-right">Total (₹)</th>
                                            <th className="pb-3 font-semibold text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {items.map((item) => (
                                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 pr-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-slate-900 text-sm">{item.name}</span>
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
                                                {hasAnyDiscount && (
                                                    <td className="py-4 w-28 px-2">
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                                                            <input
                                                                type="number"
                                                                value={item.discount || 0}
                                                                onChange={(e) => updateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                                                                className="w-full bg-slate-50 border-none rounded-lg py-2 pl-6 text-right text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-slate-900"
                                                            />
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="py-4 text-center text-sm font-bold text-slate-500 italic">
                                                    {item.tax_rate}%
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-black text-slate-900 text-sm">₹{item.total.toLocaleString('en-IN')}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Incl. Tax</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right pl-4">
                                                    <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                        <MdDelete size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {items.length === 0 && (
                                            <tr>
                                                <td colSpan={hasAnyDiscount ? 7 : 6} className="py-12 text-center text-slate-400">
                                                    No items added. Click &quot;Add Item&quot; to start.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Summary */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-100">Bill Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-slate-300">
                                <span>Subtotal</span>
                                <span>₹ {subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>Tax Total</span>
                                <span>₹ {taxTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-slate-700">
                                <div className="flex justify-between items-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                                    <span className="text-blue-400">Extra Discount</span>
                                    <input
                                        type="number"
                                        className="w-24 bg-slate-800 border-none rounded px-3 py-1 text-right focus:ring-1 focus:ring-blue-500 outline-none text-white text-[11px]"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                                    <span className="text-slate-400">Round Off</span>
                                    <input
                                        type="number"
                                        className="w-24 bg-slate-800 border-none rounded px-3 py-1 text-right focus:ring-1 focus:ring-blue-500 outline-none text-white text-[11px]"
                                        value={roundOff}
                                        onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                                <span className="text-xl font-bold">Grand Total</span>
                                <span className="text-2xl font-bold text-blue-400">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-md font-bold">Inventory Impact</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-slate-500 leading-relaxed italic">
                                Saving this purchase will automatically increase the stock levels for the selected products in your inventory.
                            </p>
                        </CardContent>
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
                            <span className="text-xs text-slate-500 italic">Cost: ₹{p.purchase_price || 0} • Tax: {p.tax_rate}%</span>
                        </div>
                    )}
                />
            </div>
        </div>
    )
}

export default function CreatePurchasePage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Loading Purchase Studio...</div>}>
            <CreatePurchaseForm />
        </Suspense>
    )
}
