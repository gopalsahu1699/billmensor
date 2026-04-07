'use client'

import React, { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MdAdd, MdDelete, MdInventory, MdCheckCircle, MdRefresh, MdExpandMore } from 'react-icons/md'
import { toast } from 'sonner'
import { Profile } from '@/types/print'
import { SelectorModal } from '@/components/ui/SelectorModal'
import { purchaseService } from '@/services/purchase.service'
import { purchaseSchema } from '@/lib/validators'
import { INDIAN_STATES } from '@/lib/constants'

type PriceType = 'selling' | 'mrp' | 'wholesale' | 'purchase'

interface PurchaseItem {
    id: string
    product_id: string
    name: string
    hsn_code: string
    quantity: number
    unit_price: number
    tax_rate: number
    cgst: number
    sgst: number
    igst: number
    tax_amount: number
    discount_type: 'amount' | 'percent'
    discount_rate: number
    per_unit_discount: number
    discount: number
    total: number
    tax_method: 'inclusive' | 'exclusive'
    price_type: PriceType
    image_url?: string
    description?: string
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
}

interface Product {
    id: string;
    name: string;
    sku?: string;
    price: number;
    purchase_price?: number;
    mrp?: number;
    wholesale_price?: number;
    tax_rate: number;
    hsn_code?: string;
    image_url?: string;
    description?: string;
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
    
    // Valuation State
    const [taxMethod, setTaxMethod] = useState<'inclusive' | 'exclusive'>('exclusive')
    const [transportCharges, setTransportCharges] = useState(0)
    const [installationCharges, setInstallationCharges] = useState(0)
    const [customCharges, setCustomCharges] = useState<{ name: string, amount: number }[]>([])
    const [generalDiscount, setGeneralDiscount] = useState(0)
    const [generalDiscountType, setGeneralDiscountType] = useState<'amount' | 'percent'>('amount')
    const [roundOff, setRoundOff] = useState(0)
    
    const [notes, setNotes] = useState('')
    const [billingAddress, setBillingAddress] = useState('')
    const [billingPhone, setBillingPhone] = useState('')
    const [billingGST, setBillingGST] = useState('')
    const [supplyPlace, setSupplyPlace] = useState('')
    
    // UI State
    const [showItemDiscount, setShowItemDiscount] = useState(false)
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [activeItemIndex, setActiveItemIndex] = useState<string | null>(null)

    const hasAnyDiscount = useMemo(() => items.some(i => i.discount > 0), [items])

    const calculateItemTotals = (item: PurchaseItem, forceTaxMethod?: 'inclusive' | 'exclusive'): PurchaseItem => {
        const method = forceTaxMethod || item.tax_method
        let basePrice = item.unit_price
        
        // If inclusive, strip tax first to get base
        if (method === 'inclusive') {
            basePrice = item.unit_price / (1 + item.tax_rate / 100)
        }

        const quantity = item.quantity || 0
        let itemDiscount = 0
        
        if (item.discount_type === 'amount') {
            itemDiscount = (item.per_unit_discount || 0) * quantity
        } else {
            itemDiscount = (basePrice * quantity * (item.discount_rate || 0)) / 100
        }

        const taxableAmount = (basePrice * quantity) - itemDiscount
        const tax = (taxableAmount * item.tax_rate) / 100

        const supplier = suppliers.find(s => s.id === selectedSupplierId)
        const isInterState = profile?.state && supplyPlace &&
            profile.state.toLowerCase() !== supplyPlace.toLowerCase()

        let cgst = 0, sgst = 0, igst = 0
        if (isInterState) {
            igst = Number(tax.toFixed(2))
        } else {
            cgst = Number((tax / 2).toFixed(2))
            sgst = Number((tax / 2).toFixed(2))
        }

        return {
            ...item,
            tax_method: method,
            discount: Number(itemDiscount.toFixed(2)),
            tax_amount: Number(tax.toFixed(2)),
            cgst,
            sgst,
            igst,
            total: Number((taxableAmount + tax).toFixed(2))
        }
    }

    const { subtotal, taxTotal, cgstTotal, sgstTotal, igstTotal, grandTotal } = useMemo(() => {
        let sub = 0, tax = 0, c = 0, s = 0, i = 0
        items.forEach(item => {
            const method = item.tax_method
            let base = item.unit_price
            if (method === 'inclusive') base = item.unit_price / (1 + item.tax_rate / 100)
            sub += base * item.quantity - item.discount
            tax += item.tax_amount
            c += item.cgst
            s += item.sgst
            i += item.igst
        })

        const extraCharges = transportCharges + installationCharges + customCharges.reduce((acc, curr) => acc + curr.amount, 0)
        let totalDiscount = generalDiscount
        if (generalDiscountType === 'percent') {
            totalDiscount = (sub * generalDiscount) / 100
        }

        const grand = sub + tax + extraCharges - totalDiscount + roundOff
        return {
            subtotal: Number(sub.toFixed(2)),
            taxTotal: Number(tax.toFixed(2)),
            cgstTotal: Number(c.toFixed(2)),
            sgstTotal: Number(s.toFixed(2)),
            igstTotal: Number(i.toFixed(2)),
            grandTotal: Number(grand.toFixed(2))
        }
    }, [items, transportCharges, installationCharges, customCharges, generalDiscount, generalDiscountType, roundOff])

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
            const lastPart = data[0].purchase_number.split('-')[1]
            const lastNum = parseInt(lastPart) || 0
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
            setNotes(pur.notes || '')
            setBillingAddress(pur.billing_address || '')
            setBillingPhone(pur.billing_phone || '')
            setBillingGST(pur.billing_gstin || '')
            setSupplyPlace(pur.supply_place || '')
            setGeneralDiscount(pur.discount || 0)
            setRoundOff(pur.round_off || 0)
            setTransportCharges(pur.transport_charges || 0)
            setInstallationCharges(pur.installation_charges || 0)
            setCustomCharges(pur.custom_charges || [])

            const mappedItems = pur.purchase_items.map((item: any) => ({
                id: item.id,
                product_id: item.product_id || '',
                name: item.name,
                hsn_code: item.hsn_code || '',
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                cgst: item.cgst || 0,
                sgst: item.sgst || 0,
                igst: item.igst || 0,
                tax_amount: item.tax_amount,
                discount: item.discount || 0,
                discount_type: 'amount',
                per_unit_discount: (item.discount || 0) / item.quantity,
                discount_rate: 0,
                tax_method: 'exclusive',
                price_type: 'purchase',
                total: item.total
            }))
            setItems(mappedItems)
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

    useEffect(() => {
        if (selectedSupplierId && !editId) {
            const supplier = suppliers.find(s => s.id === selectedSupplierId)
            if (supplier) {
                setBillingAddress(supplier.billing_address || '')
                setBillingPhone(supplier.phone || '')
                setBillingGST(supplier.gstin || '')
                setSupplyPlace(supplier.supply_place || '')
            }
        }
    }, [selectedSupplierId, suppliers, editId])

    const addItem = (product: Product) => {
        const cost = product.purchase_price || 0
        const newItem: PurchaseItem = {
            id: Math.random().toString(36).substr(2, 9),
            product_id: product.id,
            name: product.name,
            hsn_code: product.hsn_code || '',
            quantity: 1,
            unit_price: cost,
            tax_rate: product.tax_rate,
            tax_amount: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            discount: 0,
            discount_type: 'amount',
            discount_rate: 0,
            per_unit_discount: 0,
            tax_method: taxMethod,
            price_type: 'purchase',
            total: 0,
            image_url: product.image_url || '',
            description: product.description || ''
        }
        setItems([...items, calculateItemTotals(newItem)])
    }

    const updateItem = (itemId: string, updates: Partial<PurchaseItem>) => {
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item
            const updated = { ...item, ...updates }
            if (updates.product_id) {
                const prod = products.find(p => p.id === updates.product_id)
                if (prod) {
                    updated.name = prod.name
                    updated.unit_price = prod.purchase_price || 0
                    updated.tax_rate = prod.tax_rate
                    updated.hsn_code = prod.hsn_code || ''
                }
            }
            return calculateItemTotals(updated)
        }))
    }

    const removeItem = (itemId: string) => setItems(items.filter(i => i.id !== itemId))

    const handleSavePurchase = async () => {
        if (!selectedSupplierId) return toast.error('Please select a supplier')
        if (items.length === 0) return toast.error('Please add at least one item')

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const purchasePayload = {
                supplier_id: selectedSupplierId,
                purchase_number: purchaseNumber,
                purchase_date: purchaseDate,
                subtotal,
                tax_total: taxTotal,
                cgst_total: cgstTotal,
                sgst_total: sgstTotal,
                igst_total: igstTotal,
                discount: generalDiscount,
                round_off: roundOff,
                transport_charges: transportCharges,
                installation_charges: installationCharges,
                custom_charges: customCharges,
                total_amount: grandTotal,
                billing_address: billingAddress,
                billing_phone: billingPhone,
                billing_gstin: billingGST,
                supply_place: supplyPlace,
                payment_status: 'draft',
                status: 'draft',
                notes,
                items: items.map(item => ({
                    product_id: item.product_id || null,
                    name: item.name,
                    hsn_code: item.hsn_code || null,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    tax_rate: item.tax_rate,
                    cgst: item.cgst || 0,
                    sgst: item.sgst || 0,
                    igst: item.igst || 0,
                    tax_amount: item.tax_amount,
                    discount: item.discount || 0,
                    total: item.total,
                    description: item.description || null
                }))
            }

            const validatedData = purchaseSchema.parse(purchasePayload)

            if (editId) {
                // Stock reversal logic
                const { data: oldItems } = await supabase.from('purchase_items').select('*').eq('purchase_id', editId)
                if (oldItems) {
                    for (const item of oldItems) {
                        if (item.product_id) {
                            await supabase.rpc('decrement_stock', { pid: item.product_id, qty: item.quantity })
                        }
                    }
                }
                // @ts-expect-error type hack
                await purchaseService.update(editId, validatedData)
            } else {
                // @ts-expect-error type hack
                await purchaseService.create(validatedData)
            }

            // Update Stock
            for (const item of items) {
                if (item.product_id) {
                    await supabase.rpc('increment_stock', { pid: item.product_id, qty: item.quantity })
                }
            }

            toast.success(editId ? 'Purchase updated!' : 'Purchase recorded and stock updated!')
            router.push('/dashboard/purchases')
        } catch (error: any) {
            toast.error(error.message || 'Failed to save purchase')
        } finally {
            setLoading(false)
        }
    }

    const changePriceType = (itemId: string, type: PriceType) => {
        const item = items.find(i => i.id === itemId)
        if (!item || !item.product_id) return
        const prod = products.find(p => p.id === item.product_id)
        if (!prod) return

        let newPrice = prod.purchase_price || 0
        if (type === 'mrp') newPrice = prod.mrp || 0
        if (type === 'selling') newPrice = prod.price || 0
        if (type === 'wholesale') newPrice = prod.wholesale_price || 0

        updateItem(itemId, { unit_price: newPrice, price_type: type })
    }

    return (
        <div className="space-y-10 max-w-screen-2xl mx-auto pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 p-8 md:p-12 rounded-[40px] text-white shadow-2xl border border-slate-800 backdrop-blur-xl">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight italic uppercase">{editId ? 'Modify' : 'Record'} <span className="text-primary">Acquisition</span></h1>
                    <p className="text-slate-300 font-medium tracking-[0.2em] text-[10px] uppercase italic">Inventory & Stock Inflow Studio</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => router.back()} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest active:scale-95">Cancel</button>
                    <button onClick={handleSavePurchase} disabled={loading} className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50">
                        {loading ? <MdRefresh size={20} className="animate-spin" /> : <MdCheckCircle size={20} />}
                        {loading ? 'SYNCING...' : 'SAVE PURCHASE'}
                    </button>
                </div>
            </div>

            {/* Logistics & Supplier Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Side: Supplier & Basic Info */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">local_shipping</span>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 italic uppercase">Logistics</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Universal Date</label>
                                <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 font-bold appearance-none italic" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Bill / Reference #</label>
                                <input type="text" value={purchaseNumber} onChange={(e) => setPurchaseNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 font-black italic shadow-inner" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">person</span>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 italic uppercase">Supplier</h2>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor Target</label>
                            <button type="button" onClick={() => setIsCustomerModalOpen(true)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-5 px-5 text-sm flex items-center justify-between group shadow-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-700/50">
                                <div className="flex flex-col text-left">
                                    <span className={selectedSupplierId ? "text-slate-900 dark:text-slate-100 font-black uppercase tracking-tight italic" : "text-slate-400 font-bold italic"}>
                                        {selectedSupplierId ? suppliers.find(s => s.id === selectedSupplierId)?.name : "Find Supplier..."}
                                    </span>
                                    {selectedSupplierId && <span className="text-[10px] text-slate-400 font-bold">{suppliers.find(s => s.id === selectedSupplierId)?.phone}</span>}
                                </div>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">search</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Detailed Addresses */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                    <div className="flex items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                        <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">contact_page</span>
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 italic uppercase">Logistical Contact</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6 p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 italic shadow-inner">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Supplier Location</h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address Detail</label>
                                    <textarea value={billingAddress} onChange={e => setBillingAddress(e.target.value)} rows={2} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 shadow-sm resize-none" placeholder="Billing location..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                                        <input value={billingPhone} onChange={e => setBillingPhone(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl h-11 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 shadow-sm font-bold" placeholder="+91..." />
                                    </div>
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier GST</label>
                                        <input value={billingGST} onChange={e => setBillingGST(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl h-11 px-4 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 shadow-sm uppercase font-bold" placeholder="GSTIN No." />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Place of Supply</label>
                                <div className="relative">
                                    <select
                                        value={supplyPlace}
                                        onChange={(e) => setSupplyPlace(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl h-12 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 appearance-none font-black shadow-inner cursor-pointer"
                                    >
                                        <option value="">Select State</option>
                                        {INDIAN_STATES.map(s => (
                                            <option key={s.code} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                    <MdExpandMore size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 italic">Tax Rule</p>
                                <p className="text-[10px] text-slate-500 font-bold leading-tight uppercase italic">
                                    {(profile?.state && supplyPlace && profile.state.toLowerCase() === supplyPlace.toLowerCase()) 
                                        ? "Intra-State Detected: CGST + SGST applied." 
                                        : supplyPlace ? "Inter-State Detected: IGST applied." : "Sync with Supplier state for accurate Tax."
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Line Items Card */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6">
                    <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">inventory_2</span>
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 italic uppercase">Acquisition Items</h2>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowItemDiscount(!showItemDiscount)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border active:scale-95 ${showItemDiscount || hasAnyDiscount ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 font-bold'}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">percent</span>
                            {showItemDiscount || hasAnyDiscount ? 'Discount Hub' : 'Add Discount'}
                        </button>
                        <button type="button" onClick={() => setIsProductModalOpen(true)} className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95">
                            <MdAdd size={16} /> Add Item
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                <th className="pb-4 w-[35%]">Description</th>
                                <th className="pb-4 text-center">Qty</th>
                                <th className="pb-4 text-center">Cost (₹)</th>
                                {(showItemDiscount || hasAnyDiscount) && <th className="pb-4 text-center">Discount</th>}
                                <th className="pb-4 text-right">Amount (₹)</th>
                                <th className="pb-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {items.map(item => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors italic">
                                    <td className="py-6 pr-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-black text-slate-900 dark:text-slate-100 text-sm uppercase italic tracking-tight">{item.name}</span>
                                            <div className="flex flex-col gap-2 mt-2">
                                                {item.hsn_code && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">HSN: {item.hsn_code}</span>}
                                                <textarea
                                                    value={item.description || ''}
                                                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                                    placeholder="Product description..."
                                                    rows={1}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg p-2 text-[10px] focus:ring-1 focus:ring-primary/20 outline-none text-slate-600 dark:text-slate-400 resize-none font-medium"
                                                    onInput={(e) => {
                                                        const target = e.target as HTMLTextAreaElement;
                                                        target.style.height = 'auto';
                                                        target.style.height = target.scrollHeight + 'px';
                                                    }}
                                                />
                                            </div>
                                            <button type="button" onClick={() => { setActiveItemIndex(item.id); setIsProductModalOpen(true); }} className="text-[10px] text-primary font-bold uppercase tracking-widest w-fit hover:underline">Replace Item</button>
                                        </div>
                                    </td>
                                    <td className="py-6 w-24">
                                        <input type="number" value={item.quantity} onChange={e => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 text-center text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none shadow-inner" />
                                    </td>
                                    <td className="py-6 w-40 px-2">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">₹</span>
                                            <input type="number" value={item.unit_price} onChange={e => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-7 text-right text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none shadow-inner" />
                                        </div>
                                        <div className="flex flex-col gap-1 mt-1.5 px-1">
                                            <div className="flex gap-0.5">
                                                {(['inclusive', 'exclusive'] as const).map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => updateItem(item.id, { tax_method: m })}
                                                        className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider transition-all ${item.tax_method === m
                                                            ? 'bg-primary text-white shadow-sm'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700'
                                                            }`}
                                                    >
                                                        {m === 'inclusive' ? 'Incl.' : 'Excl.'}
                                                    </button>
                                                ))}
                                            </div>
                                            {item.product_id && (
                                                <div className="flex gap-0.5 mt-0.5">
                                                    {(['purchase', 'mrp', 'selling'] as PriceType[]).map(pt => {
                                                        const p = products.find(prod => prod.id === item.product_id)
                                                        if (!p) return null
                                                        if (pt === 'mrp' && !p.mrp) return null
                                                        if (pt === 'selling' && !p.price) return null
                                                        return (
                                                            <button
                                                                key={pt}
                                                                type="button"
                                                                onClick={() => changePriceType(item.id, pt)}
                                                                className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all ${item.price_type === pt
                                                                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 font-bold hover:bg-slate-300'
                                                                    }`}
                                                            >
                                                                {pt}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    {(showItemDiscount || hasAnyDiscount) && (
                                        <td className="py-6 w-40 px-2">
                                            <div className="space-y-2">
                                                <div className="flex gap-1 justify-center">
                                                    {(['amount', 'percent'] as const).map(t => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            onClick={() => updateItem(item.id, { discount_type: t })}
                                                            className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${item.discount_type === t
                                                                ? 'bg-primary text-white shadow-sm'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700'
                                                                }`}
                                                        >
                                                            {t === 'amount' ? 'Flat' : '% Off'}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="relative">
                                                     <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black italic">
                                                         {item.discount_type === 'amount' ? '₹' : '%'}
                                                     </span>
                                                     <input
                                                         type="number"
                                                         value={item.discount_type === 'amount' ? (item.per_unit_discount || 0) : (item.discount_rate || 0)}
                                                         onChange={(e) => {
                                                             const val = parseFloat(e.target.value) || 0
                                                             if (item.discount_type === 'amount') {
                                                                 updateItem(item.id, { per_unit_discount: val })
                                                             } else {
                                                                 updateItem(item.id, { discount_rate: val })
                                                             }
                                                         }}
                                                         className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-6 text-right text-xs focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 font-black shadow-inner"
                                                     />
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    <td className="py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-black text-slate-900 dark:text-slate-100 text-sm italic">₹{item.total.toLocaleString('en-IN')}</span>
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="text-[10px] text-slate-400 font-black uppercase">GST</span>
                                                <select
                                                    value={item.tax_rate}
                                                    onChange={(e) => updateItem(item.id, { tax_rate: parseFloat(e.target.value) })}
                                                    className="bg-slate-50 dark:bg-slate-800 border-none text-[10px] font-black text-primary p-0 h-auto w-auto focus:ring-0 cursor-pointer uppercase italic"
                                                >
                                                    {[0, 5, 12, 18, 28].map(r => (
                                                        <option key={r} value={r}>{r}%</option>
                                                    ))}
                                                </select>
                                                <span className="text-[10px] text-slate-400 font-black">= ₹{item.tax_amount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 text-right pl-4">
                                        <button onClick={() => removeItem(item.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors active:scale-90"><MdDelete size={20} /></button>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30 italic">
                                            <MdInventory size={64} className="text-slate-400" strokeWidth={1} />
                                            <p className="text-sm font-black uppercase tracking-widest text-slate-500">Logistics floor is empty.<br />Add items above to start inflow.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Grid: Observations & Valuation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Observations */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 h-full italic">
                        <div className="flex items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">draw</span>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 italic uppercase">Remarks</h2>
                        </div>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl p-8 text-sm focus:ring-2 focus:ring-primary/20 outline-none min-h-[300px] shadow-inner font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-300" placeholder="Acquisition notes, freight conditions, or credit terms..." />
                    </div>
                </div>

                {/* Valuation Sidebar */}
                <div className="lg:col-span-1 space-y-8 sticky top-8">
                    <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl border border-slate-800 relative overflow-hidden backdrop-blur-xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />
                        
                        <h3 className="text-xl font-black italic uppercase tracking-tight mb-8">Valuation Hub</h3>

                        {/* Global Tax Toggle */}
                        <div className="mb-8 p-1 bg-slate-800/80 rounded-2xl flex gap-1 shadow-inner italic">
                            {(['inclusive', 'exclusive'] as const).map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                        setTaxMethod(m)
                                        setItems(items.map(i => calculateItemTotals(i, m)))
                                    }}
                                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${taxMethod === m
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'text-slate-500 hover:bg-slate-700/50'
                                        }`}
                                >
                                    {m} Method
                                </button>
                            ))}
                        </div>

                        <div className="space-y-6 italic">
                             <div className="flex justify-between items-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                 <span>Base Subtotal</span>
                                 <span className="text-slate-100">₹{subtotal.toLocaleString('en-IN')}</span>
                             </div>
                             <div className="flex justify-between items-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                 <span>GST Aggregate</span>
                                 <span className="text-slate-100">₹{taxTotal.toLocaleString('en-IN')}</span>
                             </div>

                             <div className="pt-6 border-t border-slate-800 space-y-4">
                                  <div className="flex justify-between items-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                      <span>Freight / Transport</span>
                                      <input type="number" value={transportCharges} onChange={e => setTransportCharges(parseFloat(e.target.value) || 0)} className="w-24 bg-slate-800 border-none rounded px-3 py-1.5 text-right text-xs focus:ring-1 focus:ring-primary outline-none text-white font-black" />
                                  </div>
                                  <div className="flex justify-between items-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                      <span>Installation</span>
                                      <input type="number" value={installationCharges} onChange={e => setInstallationCharges(parseFloat(e.target.value) || 0)} className="w-24 bg-slate-800 border-none rounded px-3 py-1.5 text-right text-xs focus:ring-1 focus:ring-primary outline-none text-white font-black" />
                                  </div>

                                  {customCharges.map((charge, idx) => (
                                      <div key={idx} className="flex justify-between items-center group">
                                          <div className="flex items-center gap-1">
                                              <button type="button" onClick={() => setCustomCharges(prev => prev.filter((_, i) => i !== idx))} className="opacity-0 group-hover:opacity-100 text-red-400 transition-all"><MdDelete size={14}/></button>
                                              <input placeholder="Extra..." value={charge.name} onChange={e => {
                                                  const n = [...customCharges]; n[idx].name = e.target.value; setCustomCharges(n)
                                              }} className="bg-transparent border-none p-0 text-[10px] font-black uppercase text-slate-300 focus:ring-0 outline-none w-20" />
                                          </div>
                                          <input type="number" value={charge.amount} onChange={e => {
                                              const n = [...customCharges]; n[idx].amount = parseFloat(e.target.value) || 0; setCustomCharges(n)
                                          }} className="w-24 bg-slate-800 border-none rounded px-3 py-1.5 text-right text-xs focus:ring-1 focus:ring-primary outline-none text-white font-black" />
                                      </div>
                                  ))}
                                  <button type="button" onClick={() => setCustomCharges([...customCharges, { name: '', amount: 0 }])} className="text-[10px] font-black text-primary hover:text-primary/70 uppercase tracking-widest flex items-center gap-1"><MdAdd size={14} /> Add Charge</button>
                             </div>

                             <div className="pt-6 border-t border-slate-800 space-y-4">
                                  <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-black uppercase text-primary tracking-widest">Extra Discount</span>
                                      <div className="flex gap-1">
                                          {(['amount', 'percent'] as const).map(t => (
                                              <button
                                                  key={t}
                                                  type="button"
                                                  onClick={() => setGeneralDiscountType(t)}
                                                  className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest transition-all ${generalDiscountType === t ? 'bg-primary text-white shadow-sm' : 'bg-slate-800 text-slate-500 font-bold hover:bg-slate-700'}`}
                                              >
                                                  {t === 'amount' ? 'Flat' : '%'}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                                  <div className="relative">
                                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-black italic">{generalDiscountType === 'amount' ? '₹' : '%'}</span>
                                       <input type="number" value={generalDiscount} onChange={e => setGeneralDiscount(parseFloat(e.target.value) || 0)} className="w-full bg-slate-800 border-none rounded-xl py-3 text-right text-xs focus:ring-1 focus:ring-primary outline-none text-white font-black shadow-inner" />
                                  </div>
                             </div>

                             <div className="pt-6 border-t border-slate-800 space-y-4">
                                  <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-800/40 border border-white/5 italic">
                                       <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Balance Adjust</span>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const rawTotal = subtotal + taxTotal + transportCharges + installationCharges + customCharges.reduce((a,c) => a+c.amount, 0) - (generalDiscountType === 'percent' ? (subtotal * generalDiscount / 100) : generalDiscount)
                                                    setRoundOff(Number((Math.round(rawTotal) - rawTotal).toFixed(2)))
                                                }}
                                                className="text-[10px] font-black text-primary hover:text-primary/70 uppercase text-left active:scale-95 transition-all"
                                            >
                                                Auto Round
                                            </button>
                                       </div>
                                       <input type="number" step="0.01" value={roundOff} onChange={e => setRoundOff(parseFloat(e.target.value) || 0)} className="w-24 bg-slate-900 border-none rounded-xl px-4 py-2 text-right text-xs font-mono font-black text-white focus:ring-1 focus:ring-primary" />
                                  </div>
                             </div>

                             <div className="pt-10 border-t border-slate-800 flex justify-between items-end">
                                 <div className="space-y-1">
                                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">Net Outflow</p>
                                     <h4 className="text-4xl font-black italic tracking-tighter shadow-sm">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                                 </div>
                             </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 italic active:scale-95 transition-all cursor-default">
                        <div className="bg-primary/10 p-4 rounded-3xl text-primary shadow-inner shadow-primary/10"><MdInventory size={28} /></div>
                        <div className="text-left">
                            <p className="text-[11px] font-black uppercase text-slate-900 dark:text-slate-100 italic tracking-tight">Active Stock Syncer</p>
                            <p className="text-[10px] text-slate-500 font-bold leading-tight uppercase opacity-70">Logistics confirmation will auto-increment product storage.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <SelectorModal
                isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Target Supplier" items={suppliers} searchKeys={['name', 'phone', 'email']} valueKey="id" selectedValue={selectedSupplierId} onSelect={s => setSelectedSupplierId(s.id)}
                renderItem={s => (
                    <div className="flex flex-col text-left italic">
                        <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight italic text-lg leading-tight">{s.name}</span>
                        <div className="flex gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                            <span>Ph: {s.phone || 'N/A'}</span>
                            {s.gstin && <span className="text-primary font-mono italic">GST: {s.gstin}</span>}
                        </div>
                    </div>
                )}
            />

            <SelectorModal
                isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Stockable Resources" items={products} searchKeys={['name', 'sku']} valueKey="id"
                onSelect={p => { if (activeItemIndex) { updateItem(activeItemIndex, { product_id: p.id }); } else { addItem(p); } }}
                renderItem={p => (
                    <div className="flex justify-between items-center italic text-left">
                        <div className="flex flex-col">
                            <span className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight italic text-base">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase mt-0.5">{p.sku || 'NO SKU TARGET'}</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-sm font-black text-primary italic">Cost: ₹{p.purchase_price?.toLocaleString('en-IN')}</span>
                            <div className="flex gap-2 justify-end text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                <span>MRP: ₹{p.mrp?.toLocaleString('en-IN') || 'N/A'}</span>
                                <span>{p.tax_rate}% GST</span>
                            </div>
                        </div>
                    </div>
                )}
            />
        </div>
    )
}

export default function CreatePurchasePage() {
    return (
        <Suspense fallback={<div className="p-20 text-center italic font-black text-primary animate-pulse tracking-[0.4em] uppercase">Loading Purchase Studio...</div>}>
            <CreatePurchaseForm />
        </Suspense>
    )
}
