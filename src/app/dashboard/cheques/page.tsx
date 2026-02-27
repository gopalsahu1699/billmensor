'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Cheque } from '@/types/index'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { 
    MdAdd, MdSearch, MdMoreVert, MdVisibility, MdEdit, MdDelete, 
    MdCreditCard, MdCheckCircle, MdCancel, MdAccessTime, MdMoney
} from 'react-icons/md'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: MdAccessTime },
    deposited: { label: 'Deposited', color: 'bg-blue-100 text-blue-700', icon: MdMoney },
    cleared: { label: 'Cleared', color: 'bg-green-100 text-green-700', icon: MdCheckCircle },
    bounced: { label: 'Bounced', color: 'bg-red-100 text-red-700', icon: MdCancel },
    cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-700', icon: MdCancel },
}

export default function ChequesPage() {
    const [cheques, setCheques] = useState<Cheque[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'receive' | 'issue'>('all')
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        cheque_number: '',
        bank_name: '',
        amount: '',
        cheque_date: '',
        deposit_date: '',
        type: 'receive' as 'receive' | 'issue',
        customer_id: '',
        notes: '',
    })

    useEffect(() => {
        fetchCheques()
    }, [])

    async function fetchCheques() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('cheques')
                .select('*, customers(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setCheques(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('cheques')
                .insert({
                    user_id: user.id,
                    cheque_number: form.cheque_number,
                    bank_name: form.bank_name,
                    amount: parseFloat(form.amount),
                    cheque_date: form.cheque_date,
                    deposit_date: form.deposit_date || null,
                    type: form.type,
                    customer_id: form.customer_id || null,
                    notes: form.notes,
                    status: 'pending'
                })

            if (error) throw error
            toast.success('Cheque added successfully')
            setShowModal(false)
            resetForm()
            fetchCheques()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    function resetForm() {
        setForm({
            cheque_number: '',
            bank_name: '',
            amount: '',
            cheque_date: '',
            deposit_date: '',
            type: 'receive',
            customer_id: '',
            notes: '',
        })
    }

    async function updateStatus(id: string, status: string) {
        try {
            const { error } = await supabase
                .from('cheques')
                .update({ status })
                .eq('id', id)

            if (error) throw error
            toast.success('Status updated')
            fetchCheques()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    async function deleteCheque(id: string) {
        if (!confirm('Are you sure you want to delete this cheque?')) return

        try {
            const { error } = await supabase.from('cheques').delete().eq('id', id)
            if (error) throw error
            toast.success('Cheque deleted')
            fetchCheques()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredCheques = cheques.filter(c => {
        const matchesSearch = 
            c.cheque_number.toLowerCase().includes(search.toLowerCase()) ||
            c.bank_name?.toLowerCase().includes(search.toLowerCase())
        const matchesFilter = filter === 'all' || c.type === filter
        return matchesSearch && matchesFilter
    })

    const totals = {
        pending: filteredCheques.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
        cleared: filteredCheques.filter(c => c.status === 'cleared').reduce((sum, c) => sum + c.amount, 0),
    }

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
                    <div className="w-14 h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center">
                        <MdCreditCard className="text-purple-600" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Cheque Management</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Track and manage cheques received and issued</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-purple-600/20"
                >
                    <MdAdd size={20} />
                    Add Cheque
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 uppercase">Pending Cheques</p>
                    <p className="text-xl font-black text-yellow-600">₹{totals.pending.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 uppercase">Cleared Cheques</p>
                    <p className="text-xl font-black text-green-600">₹{totals.cleared.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 uppercase">Total Cheques</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{filteredCheques.length}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'receive', 'issue'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold ${
                                filter === f 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            {f === 'all' ? 'All' : f === 'receive' ? 'Receive' : 'Issue'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cheques List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {filteredCheques.length === 0 ? (
                    <div className="py-20 text-center">
                        <MdCreditCard size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No cheques found</h3>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase">Cheque #</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase">Type</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase">Bank</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase">Date</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase">Amount</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase">Status</th>
                                <th className="text-right px-6 py-4 text-xs font-black text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredCheques.map((cheque) => {
                                const status = statusConfig[cheque.status] || statusConfig.pending
                                const StatusIcon = status.icon

                                return (
                                    <tr key={cheque.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 font-mono text-sm font-bold">{cheque.cheque_number}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                cheque.type === 'receive' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {cheque.type === 'receive' ? 'Receive' : 'Issue'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{cheque.bank_name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-slate-500">{cheque.cheque_date ? format(new Date(cheque.cheque_date), 'dd MMM') : 'N/A'}</td>
                                        <td className="px-6 py-4 font-bold">₹{cheque.amount.toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${status.color}`}>
                                                <StatusIcon size={12} />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {cheque.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(cheque.id, 'deposited')}
                                                            className="p-2 hover:bg-blue-50 rounded-xl"
                                                            title="Mark Deposited"
                                                        >
                                                            <MdMoney size={16} className="text-blue-500" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(cheque.id, 'cleared')}
                                                            className="p-2 hover:bg-green-50 rounded-xl"
                                                            title="Mark Cleared"
                                                        >
                                                            <MdCheckCircle size={16} className="text-green-500" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(cheque.id, 'bounced')}
                                                            className="p-2 hover:bg-red-50 rounded-xl"
                                                            title="Mark Bounced"
                                                        >
                                                            <MdCancel size={16} className="text-red-500" />
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                    onClick={() => deleteCheque(cheque.id)}
                                                    className="p-2 hover:bg-red-50 rounded-xl"
                                                >
                                                    <MdDelete size={16} className="text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8">
                        <h2 className="text-xl font-black mb-6">Add Cheque</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, type: 'receive' })}
                                    className={`flex-1 py-3 rounded-xl font-bold ${form.type === 'receive' ? 'bg-green-600 text-white' : 'bg-slate-100'}`}
                                >
                                    Receive
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, type: 'issue' })}
                                    className={`flex-1 py-3 rounded-xl font-bold ${form.type === 'issue' ? 'bg-red-600 text-white' : 'bg-slate-100'}`}
                                >
                                    Issue
                                </button>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase mb-2">Cheque Number *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.cheque_number}
                                    onChange={(e) => setForm({ ...form, cheque_number: e.target.value })}
                                    className="w-full bg-slate-50 border rounded-xl py-3 px-4"
                                    placeholder="123456"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase mb-2">Bank Name</label>
                                <input
                                    type="text"
                                    value={form.bank_name}
                                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                                    className="w-full bg-slate-50 border rounded-xl py-3 px-4"
                                    placeholder="State Bank"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase mb-2">Amount *</label>
                                    <input
                                        type="number"
                                        required
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        className="w-full bg-slate-50 border rounded-xl py-3 px-4"
                                        placeholder="50000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase mb-2">Cheque Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.cheque_date}
                                        onChange={(e) => setForm({ ...form, cheque_date: e.target.value })}
                                        className="w-full bg-slate-50 border rounded-xl py-3 px-4"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 border rounded-xl font-black"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-black"
                                >
                                    {saving ? 'Saving...' : 'Add Cheque'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
