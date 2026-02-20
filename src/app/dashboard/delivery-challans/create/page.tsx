'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Truck, Plus, Trash2, Package, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SelectorModal } from '@/components/ui/SelectorModal'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface ChallanItem {
    id: string
    product_id: string
    name: string
    quantity: number
    unit_price: number
    total: number
}

function CreateChallanForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])

    const [selectedCustomerId, setSelectedCustomerId] = useState('')
    const [challanNumber, setChallanNumber] = useState('')
    const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0])
    const [status, setStatus] = useState('pending')
    const [items, setItems] = useState<ChallanItem[]>([])
    const [notes, setNotes] = useState('')

    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)

    const totalAmount = items.reduce((acc, item) => acc + item.total, 0)

    useEffect(() => {
        fetchInitialData()
        if (editId) {
            fetchChallanForEdit()
        } else {
            generateChallanNumber()
        }
    }, [editId])

    async function fetchInitialData() {
        const [custRes, prodRes] = await Promise.all([
            supabase.from('customers').select('*').order('name'),
            supabase.from('products').select('*').order('name')
        ])
        setCustomers(custRes.data || [])
        setProducts(prodRes.data || [])
    }

    async function generateChallanNumber() {
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
            const lastCounter = parseInt(parts[2]) || 0
            setChallanNumber(`${prefix}${(lastCounter + 1).toString().padStart(3, '0')}`)
        } else {
            setChallanNumber(`${prefix}001`)
        }
    }

    async function fetchChallanForEdit() {
        setLoading(true)
        const { data, error } = await supabase
            .from('delivery_challans')
            .select('*')
            .eq('id', editId)
            .single()

        if (error) {
            toast.error('Failed to load challan for editing')
            router.push('/dashboard/delivery-challans')
            return
        }

        setSelectedCustomerId(data.customer_id)
        setChallanNumber(data.challan_number)
        setChallanDate(data.challan_date)
        setStatus(data.status)
        setNotes(data.notes || '')
        // items stored in DB as JSONB
        setItems((data.items || []).map((item: any) => ({ ...item, id: item.id || Math.random().toString(36).substr(2, 9) })))
        setLoading(false)
    }

    const addItem = (product: any) => {
        const newItem: ChallanItem = {
            id: Math.random().toString(36).substr(2, 9),
            product_id: product.id,
            name: product.name,
            quantity: 1,
            unit_price: product.price,
            total: product.price
        }
        setItems(prev => [...prev, newItem])
    }

    const updateItem = (itemId: string, field: keyof ChallanItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item
            const updated = { ...item, [field]: value }
            updated.total = updated.quantity * updated.unit_price
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
                total_amount: totalAmount,
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
        } catch (error: any) {
            toast.error(error.message)
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
                    <p className="text-slate-400 font-medium tracking-tight">
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
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
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
                                <Plus size={16} />
                                Add Item
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                                            <th className="pb-3 font-semibold w-[45%]">Item</th>
                                            <th className="pb-3 font-semibold text-center">Qty</th>
                                            <th className="pb-3 font-semibold text-center">Rate (₹)</th>
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
                                                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg py-2 text-center text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-slate-900 dark:text-white"
                                                    />
                                                </td>
                                                <td className="py-4 w-28 px-2">
                                                    <input
                                                        type="number"
                                                        value={item.unit_price}
                                                        onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg py-2 text-right text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-slate-900 dark:text-white"
                                                    />
                                                </td>
                                                <td className="py-4 text-right font-black text-slate-900 dark:text-white text-sm italic">
                                                    ₹{item.total.toLocaleString('en-IN')}
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
                                                        <p className="italic text-sm font-medium">No items added. Click "Add Item" to begin.</p>
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
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Status</label>
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
                            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                                <span className="text-xl font-bold">Total Value</span>
                                <span className="text-2xl font-bold text-blue-400">
                                    ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] text-slate-900 dark:text-white"
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
                onSelect={(p) => addItem(p)}
                renderItem={(p) => (
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
