'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { SelectorModal } from '@/components/ui/SelectorModal'
import { ChevronDown, Plus, Trash2, Package } from 'lucide-react'
import { quotationService } from '@/services/quotation.service'
import { quotationSchema } from '@/lib/validators'

interface QuotationItem {
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
    image_url?: string
}


interface CustomCharge {
    name: string
    amount: number
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
    tax_rate: number;
    hsn_code?: string;
    image_url?: string;
}

function CreateQuotationForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<Customer[]>([])
    const [products, setProducts] = useState<Product[]>([])

    const [selectedCustomerId, setSelectedCustomerId] = useState('')
    const [quotationNumber, setQuotationNumber] = useState('')
    const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0])
    const [validUntil, setValidUntil] = useState('')
    const [items, setItems] = useState<QuotationItem[]>([])
    const [notes, setNotes] = useState('')
    const [transportCharges, setTransportCharges] = useState(0)
    const [installationCharges, setInstallationCharges] = useState(0)
    const [customCharges, setCustomCharges] = useState<CustomCharge[]>([])

    // Totals
    const [subtotal, setSubtotal] = useState(0)
    const [taxTotal, setTaxTotal] = useState(0)
    const [grandTotal, setGrandTotal] = useState(0)

    // Modal States
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [activeItemIndex, setActiveItemIndex] = useState<string | null>(null)

    const calculateTotals = React.useCallback(() => {
        let s = 0
        let t = 0
        items.forEach(item => {
            s += item.unit_price * item.quantity
            t += item.tax_amount
        })
        const customTotal = customCharges.reduce((acc, curr) => acc + curr.amount, 0)
        setSubtotal(s)
        setTaxTotal(t)
        setGrandTotal(s + t + transportCharges + installationCharges + customTotal)
    }, [items, transportCharges, installationCharges, customCharges])

    useEffect(() => {
        calculateTotals()
    }, [calculateTotals])

    const fetchInitialData = React.useCallback(async () => {
        try {
            const [custRes, prodRes] = await Promise.all([
                supabase.from('customers').select('*').order('name'),
                supabase.from('products').select('*').order('name')
            ])
            setCustomers((custRes.data as Customer[]) || [])
            setProducts((prodRes.data as Product[]) || [])
        } catch (error: unknown) {
            console.error('Initial data fetch error:', error)
            toast.error('Failed to load data')
        }
    }, [])

    const generateQuotationNumber = React.useCallback(async () => {
        const now = new Date()
        const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`
        const prefix = `QUO-${yearMonth}-`

        const { data } = await supabase
            .from('quotations')
            .select('quotation_number')
            .like('quotation_number', `${prefix}%`)
            .order('quotation_number', { ascending: false })
            .limit(1)

        if (data && data.length > 0) {
            const parts = data[0].quotation_number.split('-')
            const lastCounter = parseInt(parts[2]) || 0
            setQuotationNumber(`${prefix}${(lastCounter + 1).toString().padStart(3, '0')}`)
        } else {
            setQuotationNumber(`${prefix}001`)
        }
    }, [])

    const fetchQuotationForEdit = React.useCallback(async () => {
        if (!editId) return
        try {
            setLoading(true)
            const { data: quo, error: quoError } = await supabase
                .from('quotations')
                .select('*, quotation_items(*)')
                .eq('id', editId)
                .single()

            if (quoError) throw quoError

            setSelectedCustomerId(quo.customer_id)
            setQuotationNumber(quo.quotation_number)
            setQuotationDate(quo.quotation_date)
            setValidUntil(quo.expiry_date || '')
            setNotes(quo.notes || '')

            const mappedItems = quo.quotation_items.map((item: QuotationItem) => ({
                id: item.id,
                product_id: item.product_id || '',
                name: item.name,
                hsn_code: item.hsn_code || '',
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                tax_amount: item.tax_amount,
                discount: item.discount || 0,
                total: item.total,
                image_url: item.image_url || '',
            }))

            setItems(mappedItems)
        } catch (error: unknown) {
            console.error('Fetch quotation for edit error:', error)
            toast.error('Failed to load quotation for editing')
            router.push('/dashboard/quotations')
        } finally {
            setLoading(false)
        }
    }, [editId, router])

    useEffect(() => {
        fetchInitialData()
        if (editId) {
            fetchQuotationForEdit()
        } else {
            generateQuotationNumber()
        }
    }, [editId, fetchInitialData, fetchQuotationForEdit, generateQuotationNumber])

    const addItem = (product: Product) => {
        const newItem: QuotationItem = {
            id: Math.random().toString(36).substr(2, 9),
            product_id: product.id,
            name: product.name,
            hsn_code: product.hsn_code || '',
            quantity: 1,
            unit_price: product.price,
            tax_rate: product.tax_rate,
            tax_amount: (product.price * product.tax_rate) / 100,
            discount: 0,
            total: product.price + (product.price * product.tax_rate) / 100,
            image_url: product.image_url || '',
        }
        setItems([...items, newItem])
    }

    const updateItem = (itemId: string, updates: Partial<QuotationItem>) => {
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
                updated.total = base + tax - (updated.discount || 0)
                return updated
            }
            return item
        }))
    }

    const removeItem = (itemId: string) => {
        setItems(items.filter(item => item.id !== itemId))
    }

    const handleSaveQuotation = async () => {
        if (!selectedCustomerId) return toast.error('Please select a customer')
        if (items.length === 0) return toast.error('Please add at least one item')

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            // 1. Prepare Payload
            const customer = customers.find(c => c.id === selectedCustomerId)
            const quotationPayload = {
                // user_id handled by service
                customer_id: selectedCustomerId,

                quotation_number: quotationNumber,
                quotation_date: quotationDate,
                expiry_date: validUntil || null,
                subtotal,
                tax_total: taxTotal,
                cgst_total: 0, // Placeholder
                sgst_total: 0, // Placeholder
                igst_total: 0, // Placeholder
                billing_address: customer?.billing_address || null,
                shipping_address: customer?.shipping_address || null,
                supply_place: customer?.supply_place || null,
                total_amount: grandTotal,
                notes,
                status: 'draft',
                items: items.map(item => ({
                    product_id: item.product_id || undefined,
                    name: item.name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    tax_rate: item.tax_rate,
                    cgst: 0, // Placeholder
                    sgst: 0, // Placeholder
                    igst: 0, // Placeholder
                    tax_amount: item.tax_amount,
                    discount: item.discount,
                    total: item.total
                }))
            }

            // Validation
            const validatedData = quotationSchema.parse(quotationPayload)

            if (editId) {
                // @ts-expect-error: Supabase type mismatch hack for now
                await quotationService.update(editId, validatedData)
            } else {
                // @ts-expect-error: Supabase type mismatch hack for now
                await quotationService.create(validatedData)
            }

            toast.success(editId ? 'Quotation updated successfully!' : 'Quotation created successfully!')
            router.push('/dashboard/quotations')
        } catch (error: unknown) {
            console.error('Save quotation error:', error)
            toast.error('Failed to save quotation')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 dark:bg-primary/5 p-8 md:p-12 rounded-[40px] text-white shadow-2xl border border-slate-800">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight italic uppercase">{editId ? 'Update' : 'New'} <span className="text-primary">Quotation</span></h1>
                    <p className="text-slate-300 font-medium tracking-tight">{editId ? 'Modify existing estimation details.' : 'Generate professional estimates for potential deals.'}</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => router.back()} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-sm uppercase tracking-widest">Cancel</button>
                    <button
                        onClick={handleSaveQuotation}
                        disabled={loading}
                        className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[20px]">{loading ? 'sync' : 'verified'}</span>
                        {loading ? 'GENERATING...' : 'SAVE QUOTATION'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Basic Info */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">person</span>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 italic uppercase">Proforma Details</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select Client</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCustomerModalOpen(true)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-left flex items-center justify-between"
                                >
                                    <span className={selectedCustomerId ? "text-slate-900 dark:text-slate-100 font-bold uppercase tracking-tight" : "text-slate-400"}>
                                        {selectedCustomerId
                                            ? customers.find(c => c.id === selectedCustomerId)?.name || "Select Client"
                                            : "Search for a client..."
                                        }
                                    </span>
                                    <ChevronDown size={16} className="text-slate-400" />
                                </button>
                                <SelectorModal
                                    isOpen={isCustomerModalOpen}
                                    onClose={() => setIsCustomerModalOpen(false)}
                                    title="Search Client"
                                    items={customers}
                                    searchKeys={['name', 'phone', 'email']}
                                    valueKey="id"
                                    selectedValue={selectedCustomerId}
                                    onSelect={(c) => setSelectedCustomerId(c.id)}
                                    renderItem={(c) => (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors uppercase tracking-tight">{c.name}</span>
                                            <span className="text-xs text-slate-500">{c.phone || 'No phone'} • {c.email || 'No email'}</span>
                                        </div>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Quote #</label>
                                    <input
                                        type="text"
                                        value={quotationNumber}
                                        onChange={(e) => setQuotationNumber(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 font-bold"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                                    <input
                                        type="date"
                                        value={quotationDate}
                                        onChange={(e) => setQuotationDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Expiry Date (Optional)</label>
                            <input
                                type="date"
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                                className="w-full max-w-xs bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 font-bold"
                            />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">inventory_2</span>
                                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 italic uppercase">Invoiceables</h2>
                            </div>
                            <button
                                onClick={() => {
                                    setActiveItemIndex(null)
                                    setIsProductModalOpen(true)
                                }}
                                className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                            >
                                <Plus size={16} className="text-white" />
                                Add Item
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="pb-4 w-[45%]">Description</th>
                                        <th className="pb-4 text-center">Qty</th>
                                        <th className="pb-4 text-center">Rate</th>
                                        <th className="pb-4 text-right">Total</th>
                                        <th className="pb-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {items.map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-6 pr-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black text-slate-900 dark:text-slate-100 text-sm uppercase italic tracking-tight">{item.name}</span>
                                                    {item.hsn_code && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">HSN: {item.hsn_code}</span>}
                                                    <button
                                                        onClick={() => {
                                                            setActiveItemIndex(item.id)
                                                            setIsProductModalOpen(true)
                                                        }}
                                                        className="text-[10px] text-primary font-bold uppercase tracking-widest hover:text-primary/80 transition-colors w-fit"
                                                    >
                                                        Replace Product
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-6 w-24">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 text-center text-sm focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 font-black"
                                                />
                                            </td>
                                            <td className="py-6 w-32 px-4">
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        value={item.unit_price}
                                                        onChange={(e) => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-6 text-right text-sm focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 font-black"
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-black text-slate-900 dark:text-slate-100 text-sm italic">₹{item.total.toLocaleString('en-IN')}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{item.tax_rate}% GST Incl.</span>
                                                </div>
                                            </td>
                                            <td className="py-6 text-right pl-4">
                                                <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-slate-600">
                                                    <Package size={48} strokeWidth={1} className="opacity-20" />
                                                    <p className="italic text-sm font-medium">No items added to this quotation yet.<br />Click &quot;Add Item&quot; to pick your first product.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Summary & Sidebar items */}
                <div className="space-y-8">
                    <div className="bg-slate-900 dark:bg-slate-900/40 p-10 rounded-[40px] text-white shadow-2xl border border-slate-800 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>

                        <h3 className="text-xl font-black italic uppercase tracking-tight mb-8">Valuation</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                                <span>Subtotal</span>
                                <span className="text-slate-200">₹{subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                                <span>Tax Aggregate</span>
                                <span className="text-slate-200">₹{taxTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                <div className="flex justify-between items-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                                    <span>Transport</span>
                                    <input
                                        type="number"
                                        className="w-24 bg-slate-800 border-none rounded px-3 py-1 text-right focus:ring-1 focus:ring-primary outline-none text-white text-[11px]"
                                        value={transportCharges}
                                        onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                                    <span>Installation</span>
                                    <input
                                        type="number"
                                        className="w-24 bg-slate-800 border-none rounded px-3 py-1 text-right focus:ring-1 focus:ring-primary outline-none text-white text-[11px]"
                                        value={installationCharges}
                                        onChange={(e) => setInstallationCharges(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                {customCharges.map((charge, index) => (
                                    <div key={index} className="flex justify-between items-center text-slate-300 font-bold uppercase tracking-widest text-[10px] group">
                                        <div className="flex items-center gap-1 flex-1">
                                            <button
                                                onClick={() => setCustomCharges(customCharges.filter((_, i) => i !== index))}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-500 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                            </button>
                                            <input
                                                placeholder="Charge name..."
                                                className="bg-transparent border-none p-0 text-[10px] focus:ring-0 outline-none text-slate-200 w-full"
                                                value={charge.name}
                                                onChange={(e) => {
                                                    const newCharges = [...customCharges]
                                                    newCharges[index].name = e.target.value
                                                    setCustomCharges(newCharges)
                                                }}
                                            />
                                        </div>
                                        <input
                                            type="number"
                                            className="w-24 bg-slate-800 border-none rounded px-3 py-1 text-right focus:ring-1 focus:ring-primary outline-none text-white text-[11px]"
                                            value={charge.amount}
                                            onChange={(e) => {
                                                const newCharges = [...customCharges]
                                                newCharges[index].amount = parseFloat(e.target.value) || 0
                                                setCustomCharges(newCharges)
                                            }}
                                        />
                                    </div>
                                ))}

                                <button
                                    onClick={() => setCustomCharges([...customCharges, { name: '', amount: 0 }])}
                                    className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors font-black uppercase tracking-widest mt-2"
                                >
                                    <span className="material-symbols-outlined text-[14px]">add</span> Add Charge
                                </button>
                            </div>
                            <div className="pt-6 border-t border-slate-800 flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Net Total</p>
                                    <h4 className="text-3xl font-black italic">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Observations</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add specific terms or follow-up notes..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl p-5 text-sm focus:ring-2 focus:ring-primary/10 outline-none text-slate-900 dark:text-slate-100 min-h-37.5 font-medium placeholder:text-slate-400"
                        />
                    </div>
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
                    <div className="flex justify-between items-center text-left">
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors uppercase tracking-tight italic">{p.name}</span>
                            <span className="text-xs text-slate-500">{p.sku || 'No SKU'}</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-sm font-black text-slate-900 dark:text-slate-100">₹{p.price.toLocaleString('en-IN')}</span>
                            <span className="block text-[10px] text-slate-400 tracking-widest font-black uppercase">{p.tax_rate}% GST</span>
                        </div>
                    </div>
                )}
            />
        </div>
    )
}

export default function CreateQuotationPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Loading Quotation Studio...</div>}>
            <CreateQuotationForm />
        </Suspense>
    )
}
