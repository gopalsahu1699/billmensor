'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Receipt, Save, Plus, Trash2, Package, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SelectorModal } from '@/components/ui/SelectorModal'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface InvoiceItem {
    id: string
    product_id: string
    name: string
    hsn_code: string
    quantity: number
    unit_price: number
    tax_rate: number
    tax_amount: number
    discount: number
    total: number
}

interface CustomCharge {
    name: string
    amount: number
}

function CreateInvoiceForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])

    const [selectedCustomerId, setSelectedCustomerId] = useState('')
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
    const [items, setItems] = useState<InvoiceItem[]>([])
    const [generalDiscount, setGeneralDiscount] = useState(0)
    const [roundOff, setRoundOff] = useState(0)
    const [transportCharges, setTransportCharges] = useState(0)
    const [installationCharges, setInstallationCharges] = useState(0)
    const [customCharges, setCustomCharges] = useState<CustomCharge[]>([])
    const [notes, setNotes] = useState('')

    // Subtotals
    const [subtotal, setSubtotal] = useState(0)
    const [taxTotal, setTaxTotal] = useState(0)
    const [grandTotal, setGrandTotal] = useState(0)

    // Modal States
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [activeItemIndex, setActiveItemIndex] = useState<string | null>(null)

    useEffect(() => {
        fetchInitialData()
        if (editId) {
            fetchInvoiceForEdit()
        } else {
            generateInvoiceNumber()
        }
    }, [editId])

    async function fetchInvoiceForEdit() {
        try {
            setLoading(true)
            const { data: inv, error: invError } = await supabase
                .from('invoices')
                .select('*, invoice_items(*)')
                .eq('id', editId)
                .single()

            if (invError) throw invError

            setSelectedCustomerId(inv.customer_id)
            setInvoiceNumber(inv.invoice_number)
            setInvoiceDate(inv.invoice_date)
            setGeneralDiscount(inv.discount || 0)
            setRoundOff(inv.round_off || 0)
            setTransportCharges(inv.transport_charges || 0)
            setInstallationCharges(inv.installation_charges || 0)
            setCustomCharges(inv.custom_charges || [])
            setNotes(inv.notes || '')

            const mappedItems = inv.invoice_items.map((item: any) => ({
                id: item.id,
                product_id: item.product_id || '',
                name: item.name,
                hsn_code: item.hsn_code || '',
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                tax_amount: item.tax_amount,
                discount: item.discount || 0,
                total: item.total
            }))
            setItems(mappedItems)
        } catch (error: any) {
            toast.error('Failed to load invoice for editing')
            router.push('/dashboard/invoices')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        calculateTotals()
    }, [items, generalDiscount, roundOff, transportCharges, installationCharges, customCharges])

    async function fetchInitialData() {
        try {
            const [custRes, prodRes] = await Promise.all([
                supabase.from('customers').select('*').order('name'),
                supabase.from('products').select('*').order('name')
            ])
            setCustomers(custRes.data || [])
            setProducts(prodRes.data || [])
        } catch (error: any) {
            toast.error('Failed to load data')
        }
    }

    async function generateInvoiceNumber() {
        const now = new Date()
        const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`
        const prefix = `INV-${yearMonth}-`

        const { data } = await supabase
            .from('invoices')
            .select('invoice_number')
            .like('invoice_number', `${prefix}%`)
            .order('invoice_number', { ascending: false })
            .limit(1)

        if (data && data.length > 0) {
            const parts = data[0].invoice_number.split('-')
            const lastCounter = parseInt(parts[2]) || 0
            setInvoiceNumber(`${prefix}${(lastCounter + 1).toString().padStart(3, '0')}`)
        } else {
            setInvoiceNumber(`${prefix}001`)
        }
    }

    const addItem = (product: any) => {
        const newItem: InvoiceItem = {
            id: Math.random().toString(36).substr(2, 9),
            product_id: product.id,
            name: product.name,
            hsn_code: product.hsn_code || '',
            quantity: 1,
            unit_price: product.price,
            tax_rate: product.tax_rate,
            tax_amount: (product.price * product.tax_rate) / 100,
            discount: 0,
            total: product.price + (product.price * product.tax_rate) / 100
        }
        setItems([...items, newItem])
    }

    const updateItem = (itemId: string, updates: Partial<InvoiceItem>) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                const updated = { ...item, ...updates }

                // Auto-fill from product selection
                if (updates.product_id) {
                    const product = products.find(p => p.id === updates.product_id)
                    if (product) {
                        updated.name = product.name
                        updated.hsn_code = product.hsn_code || ''
                        updated.unit_price = product.price
                        updated.tax_rate = product.tax_rate
                    }
                }

                // Calculate item total
                const base = updated.quantity * updated.unit_price
                const tax = (base * updated.tax_rate) / 100
                updated.tax_amount = tax
                updated.total = base + tax - updated.discount
                return updated
            }
            return item
        }))
    }

    const removeItem = (itemId: string) => {
        setItems(items.filter(item => item.id !== itemId))
    }

    const calculateTotals = () => {
        let s = 0
        let t = 0
        items.forEach(item => {
            s += item.unit_price * item.quantity
            t += item.tax_amount
        })

        const customTotal = customCharges.reduce((acc, curr) => acc + curr.amount, 0)
        setSubtotal(s)
        setTaxTotal(t)
        setGrandTotal(s + t - generalDiscount + roundOff + transportCharges + installationCharges + customTotal)
    }

    const handleSaveInvoice = async () => {
        if (!selectedCustomerId) return toast.error('Please select a customer')
        if (items.length === 0) return toast.error('Please add at least one item')

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            // 1. Upsert Invoice
            const customer = customers.find(c => c.id === selectedCustomerId)
            const invoicePayload = {
                user_id: userData.user.id,
                customer_id: selectedCustomerId,
                invoice_number: invoiceNumber,
                invoice_date: invoiceDate,
                subtotal,
                tax_total: taxTotal,
                discount: generalDiscount,
                round_off: roundOff,
                transport_charges: transportCharges,
                installation_charges: installationCharges,
                custom_charges: customCharges,
                billing_address: customer?.billing_address || null,
                shipping_address: customer?.shipping_address || null,
                supply_place: customer?.supply_place || null,
                total_amount: grandTotal,
                amount_paid: editId ? undefined : 0, // Don't overwrite on edit unless we add payment logic
                balance_amount: grandTotal,
                notes,
                payment_status: 'unpaid'
            }

            let invoiceId = editId
            if (editId) {
                const { error: invError } = await supabase
                    .from('invoices')
                    .update(invoicePayload)
                    .eq('id', editId)
                if (invError) throw invError

                // Delete old items to re-insert (cleanest approach for line items)
                await supabase.from('invoice_items').delete().eq('invoice_id', editId)
            } else {
                const { data: invoice, error: invError } = await supabase
                    .from('invoices')
                    .insert([invoicePayload])
                    .select()
                    .single()
                if (invError) throw invError
                invoiceId = invoice.id
            }

            // 2. Insert/Update Invoice Items
            const invoiceItems = items.map(item => ({
                user_id: userData.user.id,
                invoice_id: invoiceId,
                product_id: item.product_id || null,
                name: item.name,
                hsn_code: item.hsn_code || null,
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                tax_amount: item.tax_amount,
                discount: item.discount,
                total: item.total
            }))

            const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(invoiceItems)

            if (itemsError) throw itemsError

            toast.success(editId ? 'Invoice updated successfully!' : 'Invoice created successfully!')
            router.push('/dashboard/invoices')
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
                    <h1 className="text-4xl font-black tracking-tight italic uppercase">{editId ? 'Update' : 'New'} <span className="text-blue-500">Invoice</span></h1>
                    <p className="text-slate-400 font-medium tracking-tight whitespace-pre-line">{editId ? 'Modify existing tax invoice details.' : 'Generate professional tax invoices for your clients.'}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveInvoice}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                        {loading ? 'SAVING...' : 'SAVE INVOICE'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Invoice Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Customer & Basic Info</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Select Customer *</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCustomerModalOpen(true)}
                                    className="w-full flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 h-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-left"
                                >
                                    <span className={selectedCustomerId ? "text-slate-900 font-bold" : "text-slate-400"}>
                                        {selectedCustomerId
                                            ? customers.find(c => c.id === selectedCustomerId)?.name || "Select Customer"
                                            : "Choose a customer..."
                                        }
                                    </span>
                                    <ChevronDown size={16} className="text-slate-400" />
                                </button>
                                <SelectorModal
                                    isOpen={isCustomerModalOpen}
                                    onClose={() => setIsCustomerModalOpen(false)}
                                    title="Search Customer"
                                    items={customers}
                                    searchKeys={['name', 'phone', 'email']}
                                    valueKey="id"
                                    selectedValue={selectedCustomerId}
                                    onSelect={(c) => setSelectedCustomerId(c.id)}
                                    renderItem={(c) => (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{c.name}</span>
                                            <span className="text-xs text-slate-500">{c.phone || 'No phone'} • {c.email || 'No email'}</span>
                                        </div>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Invoice #</label>
                                    <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Date</label>
                                    <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Line Items</CardTitle>
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
                                            <th className="pb-3 font-semibold w-[40%]">Item Description</th>
                                            <th className="pb-3 font-semibold text-center">Qty</th>
                                            <th className="pb-3 font-semibold text-center">Rate</th>
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
                                                        <span className="font-black text-slate-900 text-sm uppercase italic tracking-tight">{item.name}</span>
                                                        {item.hsn_code && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">HSN: {item.hsn_code}</span>}
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
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs text-xs">₹</span>
                                                        <input
                                                            type="number"
                                                            value={item.unit_price}
                                                            onChange={(e) => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                                                            className="w-full bg-slate-50 border-none rounded-lg py-2 pl-6 text-right text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-slate-900"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-4 text-center text-sm font-bold text-slate-500 italic">
                                                    {item.tax_rate}%
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-black text-slate-900 text-sm italic">₹{item.total.toLocaleString('en-IN')}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Incl. Tax</span>
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
                                                <td colSpan={6} className="py-12 text-center">
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

                {/* Right: Summary */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-100">Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-slate-400">
                                <span>Subtotal</span>
                                <span>₹ {subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Tax Total</span>
                                <span>₹ {taxTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-sm">Transport</span>
                                    <div className="relative w-24">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-800 border-none rounded px-5 py-1 text-sm text-right focus:ring-1 focus:ring-blue-500 outline-none text-white"
                                            value={transportCharges}
                                            onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-sm">Installation</span>
                                    <div className="relative w-24">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-800 border-none rounded px-5 py-1 text-sm text-right focus:ring-1 focus:ring-blue-500 outline-none text-white"
                                            value={installationCharges}
                                            onChange={(e) => setInstallationCharges(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                                {customCharges.map((charge, index) => (
                                    <div key={index} className="flex items-center justify-between text-slate-400 group">
                                        <div className="flex items-center gap-2 flex-1">
                                            <button
                                                onClick={() => setCustomCharges(customCharges.filter((_, i) => i !== index))}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <input
                                                placeholder="Charge name..."
                                                className="bg-transparent border-none p-0 text-sm focus:ring-0 outline-none text-slate-300 w-full"
                                                value={charge.name}
                                                onChange={(e) => {
                                                    const newCharges = [...customCharges]
                                                    newCharges[index].name = e.target.value
                                                    setCustomCharges(newCharges)
                                                }}
                                            />
                                        </div>
                                        <div className="relative w-24">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-800 border-none rounded px-5 py-1 text-sm text-right focus:ring-1 focus:ring-blue-500 outline-none text-white"
                                                value={charge.amount}
                                                onChange={(e) => {
                                                    const newCharges = [...customCharges]
                                                    newCharges[index].amount = parseFloat(e.target.value) || 0
                                                    setCustomCharges(newCharges)
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => setCustomCharges([...customCharges, { name: '', amount: 0 }])}
                                    className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors font-bold uppercase tracking-widest mt-2"
                                >
                                    <Plus size={14} /> Add Custom Charge
                                </button>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Extra Discount</span>
                                    <div className="relative w-24">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-800 border-none rounded px-5 py-1 text-sm text-right focus:ring-1 focus:ring-blue-500 outline-none text-white"
                                            value={generalDiscount}
                                            onChange={(e) => setGeneralDiscount(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
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
                            <CardTitle className="text-md">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                placeholder="Thanks for your business!"
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
                onSelect={(p) => {
                    if (activeItemIndex) {
                        updateItem(activeItemIndex, { product_id: p.id })
                    } else {
                        addItem(p)
                    }
                }}
                renderItem={(p) => (
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight italic">{p.name}</span>
                            <span className="text-xs text-slate-500">{p.sku || 'No SKU'}</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-sm font-black text-slate-900">₹{p.price.toLocaleString('en-IN')}</span>
                            <span className="block text-xs text-slate-400 tracking-widest font-bold uppercase">{p.tax_rate}% GST</span>
                        </div>
                    </div>
                )}
            />
        </div>
    )
}

export default function CreateInvoicePage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Loading Invoice Studio...</div>}>
            <CreateInvoiceForm />
        </Suspense>
    )
}
