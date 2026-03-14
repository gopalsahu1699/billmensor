'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { IoAdd, IoTrash, IoCube, IoChevronDown, IoCheckmarkCircle, IoSync } from 'react-icons/io5'
import { toast } from 'sonner'
import { Profile } from '@/types/print'
import { SelectorModal } from '@/components/ui/SelectorModal'

interface ChallanItem {
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

function CreateChallanForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<Customer[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [profile, setProfile] = useState<Profile | null>(null)

    const [selectedCustomerId, setSelectedCustomerId] = useState('')
    const [challanNumber, setChallanNumber] = useState('')
    const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0])
    const [status, setStatus] = useState('pending')
    const [items, setItems] = useState<ChallanItem[]>([])
    const [notes, setNotes] = useState('')

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
            const [custRes, prodRes, profileRes] = await Promise.all([
                supabase.from('customers').select('*').order('name'),
                supabase.from('products').select('*').order('name'),
                supabase.from('profiles').select('*').single()
            ])
            setCustomers((custRes.data as Customer[]) || [])
            setProducts((prodRes.data as Product[]) || [])
            setProfile(profileRes.data)
        } catch (error: unknown) {
            console.error('Initial data fetch error:', error)
            toast.error('Failed to load data')
        }
    }, [])

    const generateChallanNumber = React.useCallback(async () => {
        const now = new Date()
        const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`
        const prefix = `DC-${yearMonth}-`
        const { data } = await supabase
            .from('delivery_challans')
            .select('challan_number')
            .like('challan_number', `${prefix}%`)
            .order('challan_number', { ascending: false })
            .limit(1)

        if (data && data.length > 0) {
            const parts = data[0].challan_number.split('-')
            const lastCounter = parseInt(parts[parts.length - 1]) || 0
            setChallanNumber(`${prefix}${(lastCounter + 1).toString().padStart(3, '0')}`)
        } else {
            setChallanNumber(`${prefix}001`)
        }
    }, [])

    const fetchChallanForEdit = React.useCallback(async () => {
        if (!editId) return
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('delivery_challans')
                .select('*')
                .eq('id', editId)
                .single()

            if (error) throw error

            setSelectedCustomerId(data.customer_id)
            setChallanNumber(data.challan_number)
            setChallanDate(data.challan_date)
            setStatus(data.status)
            setNotes(data.notes || '')
            setItems((data.items || []).map((item: ChallanItem) => ({
                ...item,
                id: item.id || Math.random().toString(36).substr(2, 9),
                cgst: item.cgst || 0,
                sgst: item.sgst || 0,
                igst: item.igst || 0,
                discount: item.discount || 0
            })))
            setDiscount(data.discount || 0)
            setRoundOff(data.round_off || 0)
        } catch (error: unknown) {
            console.error('Fetch challan for edit error:', error)
            toast.error('Failed to load challan for editing')
            router.push('/dashboard/delivery-challans')
        } finally {
            setLoading(false)
        }
    }, [editId, router])

    useEffect(() => {
        fetchInitialData()
        if (editId) {
            fetchChallanForEdit()
        } else {
            generateChallanNumber()
        }
    }, [editId, fetchInitialData, fetchChallanForEdit, generateChallanNumber])

    const addItem = (product: Product) => {
        const newItem: ChallanItem = {
            id: Math.random().toString(36).substr(2, 9),
            product_id: product.id,
            name: product.name,
            quantity: 1,
            unit_price: product.price,
            tax_rate: product.tax_rate,
            cgst: 0,
            sgst: 0,
            igst: 0,
            tax_amount: (product.price * product.tax_rate) / 100,
            discount: 0,
            total: product.price + (product.price * product.tax_rate) / 100
        }
        setItems(prev => [...prev, newItem])
    }

    const updateItem = (itemId: string, updates: Partial<ChallanItem>) => {
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item
            const updated = { ...item, ...updates }

            // Calculate item total
            const base = updated.quantity * updated.unit_price
            const taxableAmount = base - (updated.discount || 0)
            const tax = (taxableAmount * updated.tax_rate) / 100

            // Determine CGST/SGST vs IGST
            const customer = customers.find(c => c.id === selectedCustomerId)
            const isInterState = profile?.state && customer?.supply_place &&
                profile.state.toLowerCase() !== customer.supply_place.toLowerCase()

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
        }))
    }

    const removeItem = (itemId: string) => {
        setItems(prev => prev.filter(i => i.id !== itemId))
    }

    const handleSave = async () => {
        if (!selectedCustomerId) return toast.error('Please select a customer')

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const customer = customers.find(c => c.id === selectedCustomerId)
            const payload = {
                user_id: userData.user.id,
                customer_id: selectedCustomerId,
                challan_number: challanNumber,
                challan_date: challanDate,
                status,
                subtotal,
                tax_total: taxTotal,
                cgst_total: cgstTotal,
                sgst_total: sgstTotal,
                igst_total: igstTotal,
                discount,
                round_off: roundOff,
                total_amount: grandTotal,
                items,
                billing_address: customer?.billing_address || null,
                shipping_address: customer?.shipping_address || null,
                supply_place: customer?.supply_place || null,
                notes
            }

            if (editId) {
                const { error } = await supabase.from('delivery_challans').update(payload).eq('id', editId)
                if (error) throw error
            } else {
                const { error } = await supabase.from('delivery_challans').insert([payload])
                if (error) throw error
            }

            toast.success(editId ? 'Delivery Challan updated!' : 'Delivery Challan created!')
            router.push('/dashboard/delivery-challans')
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'An error occurred'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-10 max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
            {/* Studio Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 dark:bg-primary/5 p-8 md:p-12 rounded-[40px] text-white shadow-2xl border border-slate-800">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight italic uppercase">
                        {editId ? 'Update' : 'New'} <span className="text-blue-500">Challan</span>
                    </h1>
                    <p className="text-slate-300 font-medium tracking-tight">
                        {editId ? 'Edit delivery challan details.' : 'Create a new delivery challan for goods dispatch.'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <IoSync size={20} className="animate-spin" /> : <IoCheckmarkCircle size={20} />}
                        {loading ? 'SAVING...' : editId ? 'UPDATE' : 'SAVE CHALLAN'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Challan Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Customer & Basic Info</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Customer *</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCustomerModalOpen(true)}
                                    className="w-full flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 h-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-left"
                                >
                                    <span className={selectedCustomerId ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400'}>
                                        {selectedCustomerId
                                            ? customers.find(c => c.id === selectedCustomerId)?.name || 'Select Customer'
                                            : 'Choose a customer...'}
                                    </span>
                                    <IoChevronDown size={16} className="text-slate-400" />
                                </button>
                                <SelectorModal
                                    isOpen={isCustomerModalOpen}
                                    onClose={() => setIsCustomerModalOpen(false)}
                                    title="Search Customer"
                                    items={customers}
                                    searchKeys={['name', 'phone', 'email']}
                                    valueKey="id"
                                    selectedValue={selectedCustomerId}
                                    onSelect={(c: Customer) => setSelectedCustomerId(c.id)}
                                    renderItem={(c: Customer) => (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{c.name}</span>
                                            <span className="text-xs text-slate-500">{c.phone || 'No phone'} • {c.email || 'No email'}</span>
                                        </div>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Challan #</label>
                                    <Input value={challanNumber} onChange={(e) => setChallanNumber(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
                                    <Input type="date" value={challanDate} onChange={(e) => setChallanDate(e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Line Items */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Items</CardTitle>
                            <button
                                onClick={() => setIsProductModalOpen(true)}
                                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                <IoAdd size={16} />
                                Add Item
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                                            <th className="pb-3 font-semibold w-[35%]">Item</th>
                                            <th className="pb-3 font-semibold text-center">Qty</th>
                                            <th className="pb-3 font-semibold text-center">Rate (₹)</th>
                                            {hasAnyDiscount && <th className="pb-3 font-semibold text-center">Disc (₹)</th>}
                                            <th className="pb-3 font-semibold text-right">Total (₹)</th>
                                            <th className="pb-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {items.map((item) => (
                                            <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                <td className="py-4 pr-4">
                                                    <span className="font-black text-slate-900 dark:text-white text-sm uppercase italic tracking-tight">{item.name}</span>
                                                </td>
                                                <td className="py-4 w-20">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg py-2 text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-slate-900 dark:text-white"
                                                    />
                                                </td>
                                                <td className="py-4 w-28 px-2">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                                                        <input
                                                            type="number"
                                                            value={item.unit_price}
                                                            onChange={(e) => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg py-2 pl-6 text-right text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-slate-900 dark:text-white"
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
                                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg py-2 pl-6 text-right text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-slate-900 dark:text-white"
                                                            />
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="py-4 text-right font-black text-slate-900 dark:text-white text-sm italic">
                                                    ₹{item.total.toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-4 text-right pl-4">
                                                    <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                        <IoTrash size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {items.length === 0 && (
                                            <tr>
                                                <td colSpan={hasAnyDiscount ? 6 : 5} className="py-12 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                                        <IoCube size={40} strokeWidth={1} className="opacity-20" />
                                                        <p className="italic text-sm font-medium">No items added. Click &quot;Add Item&quot; to begin.</p>
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

                {/* Right: Summary */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-slate-800 sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-100">Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-300">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="invoiced">Invoiced</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
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
                                <span className="text-2xl font-bold text-blue-400">
                                    ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-md">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-25 text-slate-900 dark:text-white"
                                placeholder="Delivery instructions, vehicle details, etc."
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <SelectorModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                title="Search Product"
                items={products}
                searchKeys={['name', 'sku']}
                valueKey="id"
                onSelect={(p: Product) => addItem(p)}
                renderItem={(p: Product) => (
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight italic">{p.name}</span>
                            <span className="text-xs text-slate-500">{p.sku || 'No SKU'}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">₹{p.price?.toLocaleString('en-IN')}</span>
                    </div>
                )}
            />
        </div>
    )
}

export default function CreateChallanPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Loading Challan Studio...</div>}>
            <CreateChallanForm />
        </Suspense>
    )
}
