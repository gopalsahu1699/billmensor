'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Wallet, CheckCircle2, Loader2, ChevronDown, Calendar, Hash } from 'lucide-react'
import { toast } from 'sonner'
import { SelectorModal } from '@/components/ui/SelectorModal'

function CreatePaymentForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])
    const [selectedCustomerId, setSelectedCustomerId] = useState('')
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)

    // Form fields
    const [paymentNumber, setPaymentNumber] = useState('')
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [amount, setAmount] = useState(0)
    const [paymentMode, setPaymentMode] = useState('cash')
    const [referenceNumber, setReferenceNumber] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        fetchInitialData()
        if (editId) {
            fetchPaymentForEdit()
        } else {
            generatePaymentNumber()
        }
    }, [editId])

    async function fetchInitialData() {
        const { data } = await supabase.from('customers').select('*').order('name')
        setCustomers(data || [])
    }

    async function generatePaymentNumber() {
        const prefix = 'PMT-IN-'
        const { data } = await supabase
            .from('payments')
            .select('payment_number')
            .eq('type', 'payment_in')
            .like('payment_number', `${prefix}%`)
            .order('payment_number', { ascending: false })
            .limit(1)

        if (data && data.length > 0) {
            const parts = data[0].payment_number.split('-')
            const lastCounter = parseInt(parts[2]) || 0
            setPaymentNumber(`${prefix}${(lastCounter + 1).toString().padStart(4, '0')}`)
        } else {
            setPaymentNumber(`${prefix}0001`)
        }
    }

    async function fetchPaymentForEdit() {
        setLoading(true)
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('id', editId)
            .single()

        if (error) {
            toast.error('Failed to load payment details')
            router.push('/dashboard/payments-in')
            return
        }

        setSelectedCustomerId(data.customer_id)
        setPaymentNumber(data.payment_number)
        setPaymentDate(data.payment_date)
        setAmount(data.amount)
        setPaymentMode(data.payment_mode)
        setReferenceNumber(data.reference_number || '')
        setNotes(data.notes || '')
        setLoading(false)
    }

    const handleSave = async () => {
        if (!selectedCustomerId) return toast.error('Please select a customer')
        if (amount <= 0) return toast.error('Please enter a valid amount')

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const customer = customers.find(c => c.id === selectedCustomerId)
            const payload = {
                user_id: userData.user.id,
                customer_id: selectedCustomerId,
                payment_number: paymentNumber,
                payment_date: paymentDate,
                amount: amount,
                type: 'payment_in',
                payment_mode: paymentMode,
                reference_number: referenceNumber,
                billing_address: customer?.billing_address || null,
                shipping_address: customer?.shipping_address || null,
                supply_place: customer?.supply_place || null,
                notes: notes
            }

            if (editId) {
                const { error } = await supabase.from('payments').update(payload).eq('id', editId)
                if (error) throw error
            } else {
                const { error } = await supabase.from('payments').insert([payload])
                if (error) throw error
            }

            toast.success(editId ? 'Payment updated successfully!' : 'Payment recorded successfully!')
            router.push('/dashboard/payments-in')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-10 max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
            {/* Studio Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 dark:bg-primary/5 p-8 md:p-12 rounded-[40px] text-white shadow-2xl border border-slate-800">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight italic uppercase">
                        {editId ? 'Edit' : 'Record'} <span className="text-green-500">Payment-In</span>
                    </h1>
                    <p className="text-slate-400 font-medium tracking-tight whitespace-pre-line">
                        {editId ? 'Update transition details for this receipt.' : 'Document funds received from your customers.'}
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
                        className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-green-500 transition-all shadow-xl shadow-green-600/20 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                        {loading ? 'SAVING...' : editId ? 'UPDATE PAYMENT' : 'RECORD RECEIPT'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest text-slate-500">Customer *</label>
                            <button
                                type="button"
                                onClick={() => setIsCustomerModalOpen(true)}
                                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 h-14 text-sm focus:ring-4 focus:ring-green-500/10 outline-none text-left transition-all"
                            >
                                <span className={selectedCustomerId ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400'}>
                                    {selectedCustomerId
                                        ? customers.find(c => c.id === selectedCustomerId)?.name || 'Select Customer'
                                        : 'Choose a customer...'}
                                </span>
                                <ChevronDown size={20} className="text-slate-400" />
                            </button>
                            <SelectorModal
                                isOpen={isCustomerModalOpen}
                                onClose={() => setIsCustomerModalOpen(false)}
                                title="Search Customer"
                                items={customers}
                                searchKeys={['name', 'phone']}
                                valueKey="id"
                                selectedValue={selectedCustomerId}
                                onSelect={(c) => setSelectedCustomerId(c.id)}
                                renderItem={(c) => (
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 group-hover:text-green-600 transition-colors uppercase tracking-tight">{c.name}</span>
                                        <span className="text-xs text-slate-500">{c.phone || 'No phone'}</span>
                                    </div>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-widest text-slate-500">Amount (₹) *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-8 pr-4 text-lg font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-green-500/10 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-widest text-slate-500">Payment Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-green-500/10 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest text-slate-500">Notes / Remarks</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-4 text-sm font-medium text-slate-900 dark:text-white focus:ring-4 focus:ring-green-500/10 outline-none transition-all min-h-[120px]"
                                placeholder="Payment received for invoice #..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Reference</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Receipt #</label>
                                <Input
                                    value={paymentNumber}
                                    onChange={(e) => setPaymentNumber(e.target.value)}
                                    className="font-bold border-slate-200 dark:border-slate-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Mode</label>
                                <select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-12 text-sm focus:ring-4 focus:ring-green-500/10 outline-none font-bold"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank">Bank Transfer</option>
                                    <option value="upi">UPI / QR</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ref # (Optional)</label>
                                <Input
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    placeholder="Txn ID, Cheque #"
                                    className="font-medium border-slate-200 dark:border-slate-800"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-600 text-white overflow-hidden shadow-xl shadow-green-600/20">
                        <div className="p-6 space-y-2">
                            <p className="text-green-100 text-[10px] font-black uppercase tracking-widest">Total Receipt</p>
                            <h2 className="text-4xl font-black italic tracking-tight">₹ {amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default function CreatePaymentInPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Loading Receipt Studio...</div>}>
            <CreatePaymentForm />
        </Suspense>
    )
}
