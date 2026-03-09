'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Profile } from '@/types/print'
import { SelectorModal } from '@/components/ui/SelectorModal'
import { MdChevronRight, MdAdd, MdDelete, MdExpandMore, MdInventory } from 'react-icons/md'
import { quotationService } from '@/services/quotation.service'
import { quotationSchema } from '@/lib/validators'
import { INDIAN_STATES } from '@/lib/constants'

type PriceType = 'selling' | 'mrp' | 'wholesale'

interface QuotationItem {
    id: string
    product_id: string
    name: string
    hsn_code: string
    quantity: number
    unit_price: number
    tax_rate: number
    tax_amount: number
    cgst: number
    sgst: number
    igst: number
    discount: number
    total: number
    image_url?: string
    price_type: PriceType
    tax_method: 'inclusive' | 'exclusive'
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
    gstin?: string;
    billing_phone?: string;
    shipping_phone?: string;
    shipping_gstin?: string;
    billing_gstin?: string;
}

interface Product {
    id: string;
    name: string;
    sku?: string;
    price: number;
    mrp?: number;
    purchase_price?: number;
    wholesale_price?: number;
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
    const [profile, setProfile] = useState<Profile | null>(null)

    const [selectedCustomerId, setSelectedCustomerId] = useState('')
    const [quotationNumber, setQuotationNumber] = useState('')
    const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0])
    const [validUntil, setValidUntil] = useState('')
    const [items, setItems] = useState<QuotationItem[]>([])
    const [notes, setNotes] = useState('')
    const [transportCharges, setTransportCharges] = useState(0)
    const [installationCharges, setInstallationCharges] = useState(0)
    const [customCharges, setCustomCharges] = useState<CustomCharge[]>([])
    const [discount, setDiscount] = useState(0)
    const [roundOff, setRoundOff] = useState(0)
    const [billingAddress, setBillingAddress] = useState('')
    const [shippingAddress, setShippingAddress] = useState('')
    const [billingPhone, setBillingPhone] = useState('')
    const [shippingPhone, setShippingPhone] = useState('')
    const [shippingGST, setShippingGST] = useState('')
    const [billingGST, setBillingGST] = useState('')
    const [supplyPlace, setSupplyPlace] = useState('')

    // Totals
    const [subtotal, setSubtotal] = useState(0)
    const [taxTotal, setTaxTotal] = useState(0)
    const [cgstTotal, setCgstTotal] = useState(0)
    const [sgstTotal, setSgstTotal] = useState(0)
    const [igstTotal, setIgstTotal] = useState(0)
    const [taxMethod, setTaxMethod] = useState<'inclusive' | 'exclusive'>('inclusive')
    const [grandTotal, setGrandTotal] = useState(0)

    // Modal States
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [activeItemIndex, setActiveItemIndex] = useState<string | null>(null)

    const calculateTotals = React.useCallback(() => {
        let baseTotal = 0
        let t = 0
        let cgst = 0
        let sgst = 0
        let igst = 0

        items.forEach(item => {
            t += item.tax_amount
            cgst += item.cgst || 0
            sgst += item.sgst || 0
            igst += item.igst || 0
        })

        const customTotal = customCharges.reduce((acc, curr) => acc + curr.amount, 0)

        // Sum up base amounts from items
        const itemsBaseTotal = items.reduce((sum, item) => {
            if (item.tax_method === 'inclusive') {
                const grossLine = (item.unit_price * item.quantity) - (item.discount || 0)
                return sum + (grossLine / (1 + item.tax_rate / 100))
            } else {
                return sum + ((item.unit_price * item.quantity) - (item.discount || 0))
            }
        }, 0)

        setSubtotal(Number(itemsBaseTotal.toFixed(2)))
        setTaxTotal(Number(t.toFixed(2)))
        setCgstTotal(cgst)
        setSgstTotal(sgst)
        setIgstTotal(igst)

        // Grand Total = Sum of inclusive line totals + Charges - Discount + Round Off
        const itemsTotal = items.reduce((acc, item) => acc + item.total, 0)
        setGrandTotal(Number((itemsTotal + transportCharges + installationCharges + customTotal - discount + roundOff).toFixed(2)))
    }, [items, transportCharges, installationCharges, customCharges, discount, roundOff])

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
            setDiscount(quo.discount || 0)
            setTransportCharges(quo.transport_charges || 0)
            setInstallationCharges(quo.installation_charges || 0)
            setCustomCharges(quo.custom_charges || [])
            setRoundOff(quo.round_off || 0)
            setBillingAddress(quo.billing_address || '')
            setShippingAddress(quo.shipping_address || '')
            setBillingPhone(quo.billing_phone || '')
            setShippingPhone(quo.shipping_phone || '')
            setShippingGST(quo.shipping_gstin || '')
            setBillingGST(quo.billing_gstin || '')
            setSupplyPlace(quo.supply_place || '')

            const mappedItems = quo.quotation_items.map((item: any) => ({
                id: item.id,
                product_id: item.product_id || '',
                name: item.name,
                hsn_code: item.hsn_code || '',
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                tax_amount: item.tax_amount,
                cgst: item.cgst || 0,
                sgst: item.sgst || 0,
                igst: item.igst || 0,
                discount: item.discount || 0,
                total: item.total,
                image_url: item.image_url || '',
                price_type: 'selling' as PriceType,
                tax_method: item.tax_method || 'inclusive',
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

    useEffect(() => {
        if (selectedCustomerId && !editId) {
            const customer = customers.find(c => c.id === selectedCustomerId)
            if (customer) {
                setBillingAddress(customer.billing_address || '')
                setShippingAddress(customer.shipping_address || '')
                setBillingPhone(customer.billing_phone || customer.phone || '')
                setShippingPhone(customer.shipping_phone || customer.phone || '')
                setShippingGST(customer.shipping_gstin || customer.gstin || '')
                setBillingGST(customer.gstin || '')
                setSupplyPlace(customer.supply_place || '')
            }
        }
    }, [selectedCustomerId, customers, editId])

    const getProductPrice = (product: Product, priceType: PriceType): number => {
        switch (priceType) {
            case 'mrp': return product.mrp || product.price
            case 'wholesale': return product.wholesale_price || product.price
            default: return product.price
        }
    }

    const addItem = (product: Product) => {
        // product.price is the GST-inclusive selling price
        const inclusivePrice = product.price
        const basePrice = inclusivePrice / (1 + product.tax_rate / 100)
        const taxAmount = inclusivePrice - basePrice

        const newItem: QuotationItem = {
            id: Math.random().toString(36).substr(2, 9),
            product_id: product.id,
            name: product.name,
            hsn_code: product.hsn_code || '',
            quantity: 1,
            unit_price: inclusivePrice,
            tax_rate: product.tax_rate,
            tax_amount: Number(taxAmount.toFixed(2)),
            cgst: 0,
            sgst: 0,
            igst: 0,
            discount: 0,
            total: Number(inclusivePrice.toFixed(2)),
            image_url: product.image_url || '',
            price_type: 'selling',
            tax_method: taxMethod
        }
        setItems([...items, newItem])
    }

    const addCustomItem = () => {
        const newItem: QuotationItem = {
            id: Math.random().toString(36).substr(2, 9),
            product_id: '',
            name: '',
            hsn_code: '',
            quantity: 1,
            unit_price: 0,
            tax_rate: 18,
            tax_amount: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            discount: 0,
            total: 0,
            price_type: 'selling',
            tax_method: taxMethod
        }
        setItems([...items, newItem])
    }

    const calculateItemTotals = (item: QuotationItem, updates: Partial<QuotationItem>): QuotationItem => {
        const updated = { ...item, ...updates }

        // ✅ TAX LOGIC
        let grossAmount = 0
        let baseAmount = 0
        let tax = 0

        if (updated.tax_method === 'inclusive') {
            grossAmount = (updated.quantity * updated.unit_price) - (updated.discount || 0)
            baseAmount = grossAmount / (1 + updated.tax_rate / 100)
            tax = grossAmount - baseAmount
        } else {
            baseAmount = (updated.quantity * updated.unit_price) - (updated.discount || 0)
            tax = baseAmount * (updated.tax_rate / 100)
            grossAmount = baseAmount + tax
        }

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
        updated.total = Number(grossAmount.toFixed(2))

        return updated
    }

    const changePriceType = (itemId: string, newPriceType: PriceType) => {
        const item = items.find(i => i.id === itemId)
        if (!item) return
        const product = products.find(p => p.id === item.product_id)
        if (!product) return
        const newPrice = getProductPrice(product, newPriceType)
        updateItem(itemId, { unit_price: newPrice, price_type: newPriceType })
    }

    const updateItem = (itemId: string, updates: Partial<QuotationItem>) => {
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item

            let updated = { ...item, ...updates }

            // Auto-fill from product selection
            if (updates.product_id) {
                const product = products.find(p => p.id === updates.product_id)
                if (product) {
                    updated.name = product.name
                    updated.hsn_code = product.hsn_code || ''
                    updated.unit_price = product.price
                    updated.tax_rate = product.tax_rate
                    updated.image_url = product.image_url || ''
                }
            }

            return calculateItemTotals(item, updated)
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
                customer_id: selectedCustomerId,
                quotation_number: quotationNumber,
                quotation_date: quotationDate,
                expiry_date: validUntil || null,
                subtotal,
                tax_total: taxTotal,
                cgst_total: cgstTotal,
                sgst_total: sgstTotal,
                igst_total: igstTotal,
                billing_address: billingAddress,
                shipping_address: shippingAddress,
                billing_phone: billingPhone,
                shipping_phone: shippingPhone,
                shipping_gstin: shippingGST,
                billing_gstin: billingGST,
                supply_place: supplyPlace,
                total_amount: grandTotal,
                discount: discount,
                transport_charges: transportCharges,
                installation_charges: installationCharges,
                custom_charges: customCharges,
                round_off: roundOff,
                notes,
                status: 'draft',
                items: items.map(item => ({
                    product_id: item.product_id || undefined,
                    name: item.name,
                    hsn_code: item.hsn_code || null,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    tax_rate: item.tax_rate,
                    cgst: item.cgst || 0,
                    sgst: item.sgst || 0,
                    igst: item.igst || 0,
                    tax_amount: item.tax_amount,
                    discount: item.discount,
                    total: item.total,
                    image_url: item.image_url || null,
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
                                    <MdExpandMore size={16} className="text-slate-400" />
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

                    {/* Billing & Shipping Details */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-2xl space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-50 dark:border-white/5 pb-6">
                            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">local_shipping</span>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 italic uppercase">Logistics & Targets</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Billing Section */}
                            <div className="space-y-6 p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 italic shadow-inner">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary text-sm">payments</span>
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Billing Address</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                                        <textarea
                                            value={billingAddress}
                                            onChange={(e) => setBillingAddress(e.target.value)}
                                            rows={2}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-500 shadow-sm"
                                            placeholder="Point of Billing..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                                            <input
                                                value={billingPhone}
                                                onChange={(e) => setBillingPhone(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl h-12 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 shadow-sm"
                                                placeholder="+91..."
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GSTIN</label>
                                            <input
                                                value={billingGST}
                                                onChange={(e) => setBillingGST(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl h-12 px-4 text-sm font-mono focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 shadow-sm uppercase"
                                                placeholder="Billing GSTIN"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Place of Supply</label>
                                        <div className="relative">
                                            <select
                                                value={supplyPlace}
                                                onChange={(e) => setSupplyPlace(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl h-12 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 appearance-none font-black shadow-sm"
                                            >
                                                <option value="">Select State</option>
                                                {INDIAN_STATES.map(s => (
                                                    <option key={s.code} value={s.name}>{s.name}</option>
                                                ))}
                                            </select>
                                            <MdExpandMore size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Section */}
                            <div className="space-y-6 p-6 rounded-3xl bg-primary/5 border border-primary/10 italic shadow-inner">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-sm">local_shipping</span>
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/70">Shipping Address</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-primary/40 uppercase tracking-widest ml-1">Location</label>
                                        <textarea
                                            value={shippingAddress}
                                            onChange={(e) => setShippingAddress(e.target.value)}
                                            rows={2}
                                            className="w-full bg-white dark:bg-slate-900 border border-primary/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-500 shadow-sm"
                                            placeholder="Point of Delivery..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-primary/40 uppercase tracking-widest ml-1">Phone</label>
                                            <input
                                                value={shippingPhone}
                                                onChange={(e) => setShippingPhone(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-primary/10 rounded-2xl h-12 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 shadow-sm"
                                                placeholder="+91..."
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-primary/40 uppercase tracking-widest ml-1">Shipping GSTIN</label>
                                            <input
                                                value={shippingGST}
                                                onChange={(e) => setShippingGST(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-primary/10 rounded-2xl h-12 px-4 text-sm font-mono focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 shadow-sm uppercase"
                                                placeholder="Shipping GSTIN"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            onClick={() => {
                                                setShippingAddress(billingAddress)
                                                setShippingPhone(billingPhone)
                                                setShippingGST(billingGST)
                                            }}
                                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 underline underline-offset-4"
                                        >
                                            Duplicate Billing
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">inventory_2</span>
                                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 italic uppercase">Invoiceables</h2>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={addCustomItem}
                                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 active:scale-95"
                                >
                                    <MdAdd size={16} />
                                    Custom Item
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveItemIndex(null)
                                        setIsProductModalOpen(true)
                                    }}
                                    className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                                >
                                    <MdAdd size={16} className="text-white" />
                                    Add Item
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="pb-4 w-[40%]">Description</th>
                                        <th className="pb-4 text-center">Qty</th>
                                        <th className="pb-4 text-center">Rate (₹)</th>
                                        <th className="pb-4 text-center">Disc (₹)</th>
                                        <th className="pb-4 text-right">Amount</th>
                                        <th className="pb-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {items.map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-6 pr-6">
                                                <div className="flex flex-col gap-1">
                                                    {!item.product_id ? (
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                                            placeholder="Custom Item Name..."
                                                            className="bg-transparent border-b border-slate-200 dark:border-slate-800 focus:border-primary outline-none font-black text-slate-900 dark:text-slate-100 text-sm uppercase italic tracking-tight py-1"
                                                        />
                                                    ) : (
                                                        <span className="font-black text-slate-900 dark:text-slate-100 text-sm uppercase italic tracking-tight">{item.name}</span>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        {item.product_id && item.hsn_code && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">HSN: {item.hsn_code}</span>}
                                                        {!item.product_id && (
                                                            <input
                                                                type="text"
                                                                value={item.hsn_code}
                                                                onChange={(e) => updateItem(item.id, { hsn_code: e.target.value })}
                                                                placeholder="HSN Code..."
                                                                className="bg-transparent border-none p-0 text-[10px] text-slate-400 font-bold uppercase tracking-widest focus:ring-0 outline-none w-20"
                                                            />
                                                        )}
                                                    </div>
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
                                            <td className="py-6 w-36 px-2">
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        value={item.unit_price}
                                                        onChange={(e) => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-6 text-right text-sm focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 font-black"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <div className="flex gap-1">
                                                        {(['inclusive', 'exclusive'] as const).map(m => (
                                                            <button
                                                                key={m}
                                                                type="button"
                                                                onClick={() => updateItem(item.id, { tax_method: m })}
                                                                className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider transition-all ${item.tax_method === m
                                                                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                                    }`}
                                                            >
                                                                {m === 'inclusive' ? 'Incl. GST' : 'Excl. GST'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {item.product_id && (() => {
                                                        const prod = products.find(p => p.id === item.product_id)
                                                        if (!prod) return null
                                                        const hasMultiplePrices = (prod.mrp && prod.mrp !== prod.price) || (prod.wholesale_price && prod.wholesale_price !== prod.price)
                                                        if (!hasMultiplePrices) return null
                                                        return (
                                                            <div className="flex gap-0.5 mt-0.5">
                                                                {(['selling', 'mrp', 'wholesale'] as PriceType[]).map(pt => {
                                                                    const price = getProductPrice(prod, pt)
                                                                    if (pt === 'mrp' && !prod.mrp) return null
                                                                    if (pt === 'wholesale' && !prod.wholesale_price) return null
                                                                    const label = pt === 'selling' ? 'Sell' : pt === 'mrp' ? 'MRP' : 'W.Sale'
                                                                    return (
                                                                        <button
                                                                            key={pt}
                                                                            type="button"
                                                                            onClick={() => changePriceType(item.id, pt)}
                                                                            className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all ${item.price_type === pt
                                                                                ? 'bg-primary text-white shadow-sm'
                                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                                                }`}
                                                                            title={`₹${price.toLocaleString('en-IN')}`}
                                                                        >
                                                                            {label}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                        )
                                                    })()}
                                                </div>
                                            </td>
                                            <td className="py-6 w-28 px-2">
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        value={item.discount || 0}
                                                        onChange={(e) => updateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-6 text-right text-sm focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 font-black"
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-black text-slate-900 dark:text-slate-100 text-sm italic">₹{item.total.toLocaleString('en-IN')}</span>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">GST</span>
                                                        <select
                                                            value={item.tax_rate}
                                                            onChange={(e) => updateItem(item.id, { tax_rate: parseFloat(e.target.value) })}
                                                            className="bg-slate-50 dark:bg-slate-800 border-none text-[10px] font-black text-primary p-0 h-auto w-auto focus:ring-0 cursor-pointer"
                                                        >
                                                            {[0, 5, 12, 18, 28].map(r => (
                                                                <option key={r} value={r}>{r}%</option>
                                                            ))}
                                                        </select>
                                                        <span className="text-[10px] text-slate-400 font-bold">= ₹{item.tax_amount.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <span className="text-[10px] text-green-600 font-bold">Base: ₹{item.tax_method === 'inclusive' ? (item.total - item.tax_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : (item.total / (1 + item.tax_rate / 100)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 text-right pl-4">
                                                <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                    <MdDelete size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-slate-600">
                                                    <MdInventory size={48} strokeWidth={1} className="opacity-20" />
                                                    <p className="italic text-sm font-medium">No items added to this quotation yet.<br />Click &quot;Add Item&quot; to pick your first product.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Observations</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add specific terms or follow-up notes..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl p-5 text-sm focus:ring-2 focus:ring-primary/10 outline-none text-slate-900 dark:text-slate-100 min-h-[150px] font-medium placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Summary & Sidebar items */}
                <div className="space-y-8">
                    <div className="bg-slate-900 dark:bg-slate-900/40 p-10 rounded-[40px] text-white shadow-2xl border border-slate-800 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>

                        <h3 className="text-xl font-black italic uppercase tracking-tight mb-8">Valuation</h3>

                        <div className="mb-8 p-1 bg-slate-800 rounded-2xl flex gap-1">
                            {(['inclusive', 'exclusive'] as const).map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                        setTaxMethod(m)
                                        setItems(prev => prev.map(item => calculateItemTotals(item, { tax_method: m })))
                                    }}
                                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${taxMethod === m
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'text-slate-400 hover:bg-slate-700/50'
                                        }`}
                                >
                                    {m === 'inclusive' ? 'Inclusive' : 'Exclusive'}
                                </button>
                            ))}
                        </div>

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
                                <div className="flex justify-between items-center text-slate-300 font-bold uppercase tracking-widest text-[10px] mt-4 border-t border-slate-800 pt-4">
                                    <span className="text-primary">Extra Discount</span>
                                    <input
                                        type="number"
                                        className="w-24 bg-slate-800 border-none rounded px-3 py-1 text-right focus:ring-1 focus:ring-primary outline-none text-white text-[11px]"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-[20px]">exposure_zero</span>
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-300">Round Off</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => {
                                                const currentTotalWithoutRoundOff = items.reduce((acc, item) => acc + item.total, 0) + transportCharges + installationCharges + customCharges.reduce((acc, curr) => acc + curr.amount, 0) - discount
                                                const roundedTotal = Math.round(currentTotalWithoutRoundOff)
                                                setRoundOff(Number((roundedTotal - currentTotalWithoutRoundOff).toFixed(2)))
                                            }}
                                            className="bg-primary text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/80 transition-all shadow-xl shadow-primary/20 active:scale-95"
                                        >
                                            Auto Balance
                                        </button>
                                        <div className="relative w-28">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-mono">₹</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-7 py-2 text-sm text-right focus:ring-2 focus:ring-primary outline-none text-white font-mono"
                                                value={roundOff}
                                                onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-800 flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Net Total</p>
                                    <h4 className="text-3xl font-black italic">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                                </div>
                            </div>
                        </div>
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
                            <div className="flex gap-2 justify-end text-[9px] text-slate-400 font-bold">
                                {p.mrp ? <span>MRP: ₹{p.mrp.toLocaleString('en-IN')}</span> : null}
                                {p.wholesale_price ? <span>W: ₹{p.wholesale_price.toLocaleString('en-IN')}</span> : null}
                            </div>
                            <span className="block text-[10px] text-slate-400 tracking-widest font-black uppercase">{p.tax_rate}% GST incl.</span>
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
