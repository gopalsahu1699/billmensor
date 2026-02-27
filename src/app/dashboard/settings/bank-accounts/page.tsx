'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BankAccount } from '@/types/index'
import { toast } from 'sonner'
import { IoAdd, IoBusiness, IoCard, IoTrash, IoCreate, IoStar, IoStarOutline, IoSearch, IoWallet } from 'react-icons/io5'
import { FaPlus, FaStar, FaStarHalfAlt } from 'react-icons/fa'

export default function BankAccountsPage() {
    const [accounts, setAccounts] = useState<BankAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [form, setForm] = useState({
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        account_holder_name: '',
        upi_id: '',
        is_primary: false,
    })

    useEffect(() => {
        fetchAccounts()
    }, [])

    async function fetchAccounts() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('bank_accounts')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('is_primary', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error
            setAccounts(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    function openEdit(account: BankAccount) {
        setForm({
            bank_name: account.bank_name || '',
            account_number: account.account_number || '',
            ifsc_code: account.ifsc_code || '',
            account_holder_name: account.account_holder_name || '',
            upi_id: account.upi_id || '',
            is_primary: account.is_primary,
        })
        setEditingId(account.id)
        setShowModal(true)
    }

    async function saveAccount(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            if (editingId) {
                const { error } = await supabase
                    .from('bank_accounts')
                    .update(form)
                    .eq('id', editingId)

                if (error) throw error
                toast.success('Account updated successfully')
            } else {
                const { error } = await supabase
                    .from('bank_accounts')
                    .insert({
                        ...form,
                        user_id: user.id,
                        is_active: true
                    })

                if (error) throw error
                toast.success('Account added successfully')
            }

            setShowModal(false)
            resetForm()
            fetchAccounts()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    function resetForm() {
        setForm({
            bank_name: '',
            account_number: '',
            ifsc_code: '',
            account_holder_name: '',
            upi_id: '',
            is_primary: false,
        })
        setEditingId(null)
    }

    async function setPrimary(id: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Unset all primaries first
            await supabase
                .from('bank_accounts')
                .update({ is_primary: false })
                .eq('user_id', user.id)

            // Set new primary
            const { error } = await supabase
                .from('bank_accounts')
                .update({ is_primary: true })
                .eq('id', id)

            if (error) throw error
            toast.success('Primary account updated')
            fetchAccounts()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    async function deleteAccount(id: string) {
        if (!confirm('Are you sure you want to delete this account?')) return

        try {
            const { error } = await supabase
                .from('bank_accounts')
                .update({ is_active: false })
                .eq('id', id)

            if (error) throw error
            toast.success('Account deleted successfully')
            fetchAccounts()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredAccounts = accounts.filter(a => 
        a.bank_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.account_number?.includes(search) ||
        a.account_holder_name?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-600/10 rounded-2xl flex items-center justify-center">
                        <IoWallet className="text-green-600" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Bank Accounts</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your business bank accounts</p>
                    </div>
                </div>
                <button 
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-green-600/20"
                >
                    <FaPlus size={20} />
                    Add Account
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search accounts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-green-600/20 outline-none"
                />
            </div>

            {/* Accounts Grid */}
            {filteredAccounts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 py-20 text-center">
                    <IoBusiness size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No bank accounts</h3>
                    <p className="text-slate-500 mt-1">Add your bank accounts to show on invoices</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAccounts.map((account) => (
                        <div key={account.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden">
                            {account.is_primary && (
                                <div className="absolute top-4 right-4">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                                        <FaStar size={12} fill="currentColor" />
                                        Primary
                                    </span>
                                </div>
                            )}
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                                <IoBusiness className="text-white" size={24} />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{account.bank_name || 'Bank Name'}</h3>
                            <p className="text-slate-500 text-sm mt-1">{account.account_holder_name || 'Account Holder'}</p>
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <IoCard size={16} className="text-slate-400" />
                                    <span className="font-mono text-sm text-slate-600 dark:text-slate-300">
                                        •••• {account.account_number?.slice(-4)}
                                    </span>
                                </div>
                            </div>
                            {account.upi_id && (
                                <p className="text-xs text-slate-500 mt-2">UPI: {account.upi_id}</p>
                            )}
                            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                {!account.is_primary && (
                                    <button
                                        onClick={() => setPrimary(account.id)}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold text-slate-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                                    >
                                        <FaStar size={14} />
                                        Set Primary
                                    </button>
                                )}
                                <button
                                    onClick={() => openEdit(account)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <IoCreate size={18} className="text-slate-400" />
                                </button>
                                <button 
                                    onClick={() => deleteAccount(account.id)}
                                    className="p-2 hover:bg-red-50 dark:hover/20 rounded-lg:bg-red-900 transition-colors"
                                >
                                    <IoTrash size={18} className="text-red-400" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 shadow-2xl">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">
                            {editingId ? 'Edit Bank Account' : 'Add Bank Account'}
                        </h2>
                        <form onSubmit={saveAccount} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Bank Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.bank_name}
                                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-green-600/20 outline-none"
                                    placeholder="State Bank of India"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Account Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.account_number}
                                        onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-green-600/20 outline-none font-mono"
                                        placeholder="1234567890"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">IFSC Code *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.ifsc_code}
                                        onChange={(e) => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-green-600/20 outline-none font-mono"
                                        placeholder="SBIN0001234"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Account Holder Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.account_holder_name}
                                    onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-green-600/20 outline-none"
                                    placeholder="John Enterprises"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">UPI ID</label>
                                <input
                                    type="text"
                                    value={form.upi_id}
                                    onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-green-600/20 outline-none"
                                    placeholder="john@upi"
                                />
                            </div>
                            <label className="flex items-center gap-3 pt-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_primary}
                                    onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-600"
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-400">Set as primary account</span>
                            </label>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-black text-sm uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : (editingId ? 'Update' : 'Add Account')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
