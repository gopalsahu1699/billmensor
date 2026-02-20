'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function CreateCustomerPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(!!editId)
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        billing_address: '',
        shipping_address: '',
        supply_place: '',
        gstin: '',
        type: 'customer',
    })

    useEffect(() => {
        if (editId) fetchCustomer()
    }, [editId])

    async function fetchCustomer() {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', editId)
                .single()

            if (error) throw error
            setForm({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                billing_address: data.billing_address || '',
                shipping_address: data.shipping_address || '',
                supply_place: data.supply_place || '',
                gstin: data.gstin || '',
                type: data.type || 'customer',
            })
        } catch (error: any) {
            toast.error(error.message)
            router.push('/dashboard/customers')
        } finally {
            setFetching(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            if (editId) {
                const { error } = await supabase
                    .from('customers')
                    .update({ ...form })
                    .eq('id', editId)

                if (error) throw error
                toast.success('Customer updated successfully')
            } else {
                const { error } = await supabase
                    .from('customers')
                    .insert([{ ...form, user_id: userData.user.id }])

                if (error) throw error
                toast.success('Customer added successfully')
            }
            router.push('/dashboard/customers')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="max-w-3xl mx-auto py-20 flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-slate-500 font-medium">Loading customer details...</p>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/customers">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                        <span className="material-symbols-outlined text-slate-400">arrow_back</span>
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">
                        {editId ? 'Update Client' : 'Onboard New Client'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {editId ? 'Modify existing client business profile.' : 'Configure client business details and contact info.'}
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-8 space-y-6">
                    {/* Type Selector */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Client Type</label>
                        <div className="flex gap-3">
                            {['customer', 'supplier', 'both'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setForm({ ...form, type: t })}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${form.type === t
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">person</span>
                            <input
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                placeholder="Enter client name"
                            />
                        </div>
                    </div>

                    {/* Email and Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">alternate_email</span>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">phone_iphone</span>
                                <input
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                    placeholder="+91 9999900000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* GSTIN and Supply Place */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">GSTIN</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">receipt_long</span>
                                <input
                                    value={form.gstin}
                                    onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono"
                                    placeholder="22AAAAA0000A1Z5"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Place of Supply</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">pin_drop</span>
                                <input
                                    value={form.supply_place}
                                    onChange={(e) => setForm({ ...form, supply_place: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                    placeholder="e.g. Maharashtra"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Addresses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Billing Address</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[18px]">location_on</span>
                                <textarea
                                    rows={3}
                                    value={form.billing_address}
                                    onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                    placeholder="Street address, City, ZIP..."
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Shipping Address</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[18px]">local_shipping</span>
                                <textarea
                                    rows={3}
                                    value={form.shipping_address}
                                    onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                    placeholder="Shipping location if different..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <Link href="/dashboard/customers">
                        <button type="button" className="px-8 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 transition-all">
                            Cancel
                        </button>
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">{editId ? 'verified' : 'save'}</span>
                        {loading ? 'Processing...' : (editId ? 'Update Client Record' : 'Save Customer Record')}
                    </button>
                </div>
            </form>
        </div>
    )
}
