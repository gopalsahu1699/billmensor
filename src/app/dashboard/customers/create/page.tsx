'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { INDIAN_STATES } from '@/lib/constants'
import { MdArrowBack, MdSave, MdVerified, MdPerson, MdAlternateEmail, MdPhoneIphone, MdReceiptLong, MdPinDrop, MdLocationOn, MdLocalShipping, MdPhoneInTalk } from 'react-icons/md'

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
        billing_phone: '',
        shipping_phone: '',
        shipping_gstin: '',
        billing_gstin: '',
        type: 'customer',
    })

    const fetchCustomer = React.useCallback(async () => {
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
                billing_phone: data.billing_phone || '',
                shipping_phone: data.shipping_phone || '',
                shipping_gstin: data.shipping_gstin || '',
                billing_gstin: data.billing_gstin || '',
                type: data.type || 'customer',
            })
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'An error occurred')
            router.push('/dashboard/customers')
        } finally {
            setFetching(false)
        }
    }, [editId, router])

    useEffect(() => {
        if (editId) fetchCustomer()
    }, [editId, fetchCustomer])

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
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="max-w-4xl mx-auto py-20 flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Client Vault...</p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 dark:bg-primary/5 p-8 md:p-12 rounded-[40px] text-white shadow-2xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <Link href="/dashboard/customers">
                        <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:scale-95 group" type="button">
                            <MdArrowBack size={24} className="text-white group-hover:-translate-x-1 transition-transform" />
                        </button>
                    </Link>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tight italic uppercase leading-none">
                            {editId ? 'Modify' : 'Onboard'} <span className="text-primary">Client</span>
                        </h1>
                        <p className="text-slate-400 font-medium tracking-tight">
                            {editId ? 'Update business profile and logistics.' : 'Establish a new business partnership.'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10 w-full md:w-auto">
                    <button
                        type="submit"
                        form="customer-form"
                        disabled={loading}
                        className="w-full md:w-auto flex items-center justify-center gap-3 bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <span className="animate-spin">⌛</span> : (editId ? <MdVerified size={20} /> : <MdSave size={20} />)}
                        {loading ? 'PROCESSING...' : (editId ? 'UPDATE RECORD' : 'SAVE PARTNER')}
                    </button>
                </div>
            </div>

            <form id="customer-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: General Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Primary Identity Card */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                            <span className="p-3 bg-primary/10 text-primary rounded-2xl">
                                <MdPerson size={24} />
                            </span>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 italic uppercase">Global Identity</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Engagement Type</label>
                                <div className="flex gap-3">
                                    {['customer', 'supplier', 'both'].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setForm({ ...form, type: t })}
                                            className={`flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.type === t
                                                ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-100'
                                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Enterprise / Individual Name *</label>
                                <div className="relative">
                                    <MdPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-5 pl-12 pr-6 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 font-bold placeholder:text-slate-300"
                                        placeholder="Enter legal name"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Corridor</label>
                                    <div className="relative">
                                        <MdAlternateEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-4 pl-12 pr-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-300"
                                            placeholder="contact@enterprise.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Primary Mobile</label>
                                    <div className="relative">
                                        <MdPhoneIphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-4 pl-12 pr-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 font-black placeholder:text-slate-300"
                                            placeholder="+91 00000 00000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logistics Hub (Billing & Shipping) */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                            <span className="p-3 bg-primary/10 text-primary rounded-2xl">
                                <MdLocalShipping size={24} />
                            </span>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 italic uppercase">Logistics & Targets</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Billing Block */}
                            <div className="space-y-6 p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 transition-all hover:border-primary/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <MdLocationOn size={16} />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Billing Logic</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                                        <textarea
                                            rows={2}
                                            value={form.billing_address}
                                            onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-sm"
                                            placeholder="Registered office address..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                                        <div className="relative">
                                            <MdPhoneInTalk className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                value={form.billing_phone}
                                                onChange={(e) => setForm({ ...form, billing_phone: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl h-10 pl-9 pr-4 text-xs focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 font-bold"
                                                placeholder="+91..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GSTIN</label>
                                        <div className="relative">
                                            <MdReceiptLong className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                value={form.billing_gstin}
                                                onChange={(e) => setForm({ ...form, billing_gstin: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl h-10 pl-9 pr-4 text-xs font-mono focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 uppercase"
                                                placeholder="Billing GST"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Block */}
                            <div className="space-y-6 p-6 rounded-[32px] bg-primary/5 border border-primary/10 transition-all hover:border-primary/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                        <MdLocalShipping size={16} />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Shipping Logic</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-primary/40 uppercase tracking-widest ml-1">Address</label>
                                        <textarea
                                            rows={2}
                                            value={form.shipping_address}
                                            onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-900 border border-primary/10 rounded-2xl p-4 text-xs focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-sm"
                                            placeholder="Point of delivery..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-primary/40 uppercase tracking-widest ml-1">Phone</label>
                                        <div className="relative">
                                            <MdPhoneInTalk className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" size={14} />
                                            <input
                                                value={form.shipping_phone}
                                                onChange={(e) => setForm({ ...form, shipping_phone: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-900 border border-primary/10 rounded-xl h-10 pl-9 pr-4 text-xs focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 font-bold"
                                                placeholder="Alt shipping contact"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-primary/40 uppercase tracking-widest ml-1">GSTIN</label>
                                        <div className="relative">
                                            <MdReceiptLong className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" size={14} />
                                            <input
                                                value={form.shipping_gstin}
                                                onChange={(e) => setForm({ ...form, shipping_gstin: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-900 border border-primary/10 rounded-xl h-10 pl-9 pr-4 text-xs font-mono focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-slate-100 uppercase"
                                                placeholder="Shipping GSTIN"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setForm({
                                                ...form,
                                                shipping_address: form.billing_address,
                                                shipping_phone: form.billing_phone,
                                                shipping_gstin: form.billing_gstin
                                            })}
                                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 underline underline-offset-4"
                                        >
                                            Duplicate Billing
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Compliance & Tax */}
                <div className="space-y-8">
                    <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl border border-slate-800 relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>

                        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                            <span className="p-3 bg-white/5 text-primary rounded-2xl">
                                <MdReceiptLong size={24} />
                            </span>
                            <h2 className="text-xl font-black italic uppercase">Compliance</h2>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary GSTIN</label>
                                <div className="relative">
                                    <MdReceiptLong className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        value={form.gstin}
                                        onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-5 text-sm font-mono focus:ring-2 focus:ring-primary/40 outline-none text-white uppercase placeholder:text-slate-600 shadow-inner"
                                        placeholder="Global GSTIN"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Place of Supply</label>
                                <div className="relative">
                                    <MdPinDrop className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <select
                                        value={form.supply_place}
                                        onChange={(e) => setForm({ ...form, supply_place: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-10 text-sm focus:ring-2 focus:ring-primary/40 outline-none text-white appearance-none font-black shadow-inner"
                                    >
                                        <option value="" className="bg-slate-900">Select State</option>
                                        {INDIAN_STATES.map(s => (
                                            <option key={s.code} value={s.name} className="bg-slate-900">{s.name}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">expand_more</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-6 rounded-3xl bg-white/5 border border-white/10 italic">
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                <span className="text-primary font-black uppercase mr-2">Note:</span>
                                Accurate logistics and compliance data ensures seamless tax filing and professional document generation across all modules.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-50 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                                <MdPerson size={32} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight italic">Partner Status</h3>
                                <p className="text-xs text-slate-500 mt-1">Status: <span className="text-primary font-black uppercase">Active</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
