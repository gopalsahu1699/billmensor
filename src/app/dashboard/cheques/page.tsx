'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Cheque } from '@/types/index'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { 
    MdAdd, MdSearch, MdDelete, 
    MdCreditCard, MdCheckCircle, MdCancel, MdAccessTime, MdMoney,
    MdClose, MdExpandMore
} from 'react-icons/md'
import { FormField } from '@/components/ui/form/FormField'
import { SmartInput, SmartNumberInput, SmartTextarea } from '@/components/ui/form/smart-inputs'
import { SelectorModal } from '@/components/ui/SelectorModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { friendlyError } from '@/lib/friendly-errors'

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number }> }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: MdAccessTime },
    deposited: { label: 'Deposited', color: 'bg-blue-100 text-blue-700', icon: MdMoney },
    cleared: { label: 'Cleared', color: 'bg-green-100 text-green-700', icon: MdCheckCircle },
    bounced: { label: 'Bounced', color: 'bg-red-100 text-red-700', icon: MdCancel },
    cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-700', icon: MdCancel },
}

interface PartyOption {
    id: string
    name: string
    phone?: string
}

interface ChequeForm {
    cheque_number: string
    bank_name: string
    amount: string
    cheque_date: string
    deposit_date: string
    type: 'receive' | 'issue'
    customer_id: string
    notes: string
}

interface ChequeErrors {
    cheque_number?: string
    amount?: string
    cheque_date?: string
}

const INITIAL_FORM: ChequeForm = {
    cheque_number: '',
    bank_name: '',
    amount: '',
    cheque_date: '',
    deposit_date: '',
    type: 'receive',
    customer_id: '',
    notes: '',
}

export default function ChequesPage() {
    const router = useRouter()
    const [cheques, setCheques] = useState<Cheque[]>([])
    const [customers, setCustomers] = useState<PartyOption[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'receive' | 'issue'>('all')
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<ChequeForm>(INITIAL_FORM)
    const [errors, setErrors] = useState<ChequeErrors>({})
    const [isPartyModalOpen, setIsPartyModalOpen] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState<Cheque | null>(null)

    useEffect(() => {
        fetchCheques()
        fetchCustomers()
    }, [])

    useEffect(() => {
        if (!showModal) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowModal(false)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showModal])

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
        } catch (error: unknown) {
            toast.error(friendlyError(error))
        } finally {
            setLoading(false)
        }
    }

    async function fetchCustomers() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data } = await supabase
                .from('customers')
                .select('id, name, phone')
                .eq('user_id', user.id)
                .order('name')
            setCustomers((data as PartyOption[]) || [])
        } catch (error: unknown) {
            console.error('Fetch customers error:', error)
        }
    }

    function updateField(key: keyof ChequeForm, value: ChequeForm[keyof ChequeForm]) {
        setForm((f) => ({ ...f, [key]: value }))
        setErrors((e) => ({ ...e, [key]: '' }))
    }

    const validateForm = (): ChequeErrors => {
        const errs: ChequeErrors = {}
        if (!form.cheque_number.trim()) errs.cheque_number = 'Please enter the cheque number.'
        const amountNum = Number(form.amount)
        if (!form.amount || isNaN(amountNum) || amountNum <= 0) errs.amount = 'Please enter the amount.'
        if (!form.cheque_date) errs.cheque_date = 'Please select the cheque date.'
        return errs
    }

    const blurValidate = (field: keyof ChequeErrors) => {
        const all = validateForm()
        setErrors((e) => ({ ...e, [field]: all[field] ?? '' }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const validationErrors = validateForm()
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
            return
        }

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
            setErrors({})
            fetchCheques()
        } catch (error: unknown) {
            toast.error(friendlyError(error))
        } finally {
            setSaving(false)
        }
    }

    function resetForm() {
        setForm(INITIAL_FORM)
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
        } catch (error: unknown) {
            toast.error(friendlyError(error))
        }
    }

    async function confirmDeleteCheque() {
        if (!confirmDelete) return

        try {
            const { error } = await supabase.from('cheques').delete().eq('id', confirmDelete.id)
            if (error) throw error
            toast.success('Cheque deleted')
            fetchCheques()
        } catch (error: unknown) {
            toast.error(friendlyError(error))
        } finally {
            setConfirmDelete(null)
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center">
                        <MdCreditCard className="text-purple-600" size={28} aria-hidden="true" />
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
                    <MdAdd size={20} aria-hidden="true" />
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
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} aria-hidden="true" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search cheques"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'receive', 'issue'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            aria-pressed={filter === f}
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
                        <MdCreditCard size={48} className="mx-auto text-slate-300 mb-4" aria-hidden="true" />
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
                                                <StatusIcon size={12} aria-hidden="true" />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {cheque.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(cheque.id, 'deposited')}
                                                            aria-label="Mark as deposited"
                                                            className="p-2 hover:bg-blue-50 rounded-xl"
                                                        >
                                                            <MdMoney size={16} className="text-blue-500" aria-hidden="true" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(cheque.id, 'cleared')}
                                                            aria-label="Mark as cleared"
                                                            className="p-2 hover:bg-green-50 rounded-xl"
                                                        >
                                                            <MdCheckCircle size={16} className="text-green-500" aria-hidden="true" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(cheque.id, 'bounced')}
                                                            aria-label="Mark as bounced"
                                                            className="p-2 hover:bg-red-50 rounded-xl"
                                                        >
                                                            <MdCancel size={16} className="text-red-500" aria-hidden="true" />
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                    onClick={() => setConfirmDelete(cheque)}
                                                    aria-label={`Delete cheque ${cheque.cheque_number}`}
                                                    className="p-2 hover:bg-red-50 rounded-xl"
                                                >
                                                    <MdDelete size={16} className="text-red-400" aria-hidden="true" />
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
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-cheque-title"
                        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 id="add-cheque-title" className="text-xl font-black">Add Cheque</h2>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                aria-label="Close dialog"
                                className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                            >
                                <MdClose size={20} aria-hidden="true" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} noValidate className="space-y-4">
                            <FormField label="Direction" description="Are you receiving or issuing this cheque?">
                                {({ labelId }) => (
                                    <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={form.type === 'receive'}
                                            onClick={() => updateField('type', 'receive')}
                                            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                                                form.type === 'receive'
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                            }`}
                                        >
                                            Receive
                                        </button>
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={form.type === 'issue'}
                                            onClick={() => updateField('type', 'issue')}
                                            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                                                form.type === 'issue'
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                            }`}
                                        >
                                            Issue
                                        </button>
                                    </div>
                                )}
                            </FormField>

                            <FormField label="Cheque number" required error={errors.cheque_number}>
                                {({ id, describedBy, invalid }) => (
                                    <SmartInput
                                        id={id}
                                        autoFocus
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        value={form.cheque_number}
                                        onChange={(e) => updateField('cheque_number', e.target.value)}
                                        onBlur={() => blurValidate('cheque_number')}
                                        placeholder="123456"
                                        maxLength={20}
                                    />
                                )}
                            </FormField>

                            <FormField label="Bank name" hint={form.bank_name ? undefined : 'Optional'}>
                                {({ id, describedBy }) => (
                                    <SmartInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        value={form.bank_name}
                                        onChange={(e) => updateField('bank_name', e.target.value)}
                                        placeholder="e.g. State Bank of India"
                                        maxLength={60}
                                    />
                                )}
                            </FormField>

                            <FormField label="Party" description="Optional — the customer related to this cheque.">
                                {({ id, describedBy }) => (
                                    <button
                                        type="button"
                                        id={id}
                                        aria-describedby={describedBy}
                                        onClick={() => setIsPartyModalOpen(true)}
                                        className={cn(
                                            'w-full flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 px-4 h-12 text-sm font-medium text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/25'
                                        )}
                                    >
                                        <span className={form.customer_id ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}>
                                            {form.customer_id
                                                ? customers.find(c => c.id === form.customer_id)?.name || 'Select Party'
                                                : 'Choose a party...'}
                                        </span>
                                        <MdExpandMore size={20} className="text-slate-400 shrink-0" aria-hidden="true" />
                                    </button>
                                )}
                            </FormField>
                            <SelectorModal
                                isOpen={isPartyModalOpen}
                                onClose={() => setIsPartyModalOpen(false)}
                                title="Select Party"
                                items={customers}
                                searchKeys={['name', 'phone']}
                                valueKey="id"
                                selectedValue={form.customer_id}
                                onSelect={(c) => updateField('customer_id', c.id)}
                                renderItem={(c) => (
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors uppercase tracking-tight">{c.name}</span>
                                        <span className="text-xs text-slate-500">{c.phone || 'No phone'}</span>
                                    </div>
                                )}
                                emptyMessage="No customers found"
                                createLabel="Create Customer"
                                onCreateNew={() => router.push('/dashboard/customers/create')}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Amount" required error={errors.amount} description="Cheque amount in ₹.">
                                    {({ id, describedBy, invalid }) => (
                                        <SmartNumberInput
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={invalid}
                                            invalid={invalid}
                                            value={form.amount}
                                            onValueChange={(v) => updateField('amount', v === undefined ? '' : String(v))}
                                            onBlur={() => blurValidate('amount')}
                                            prefix="₹"
                                            decimals={2}
                                            min={0}
                                            placeholder="0.00"
                                        />
                                    )}
                                </FormField>
                                <FormField label="Cheque date" required error={errors.cheque_date}>
                                    {({ id, describedBy, invalid }) => (
                                        <input
                                            id={id}
                                            type="date"
                                            aria-invalid={invalid}
                                            aria-describedby={describedBy}
                                            value={form.cheque_date}
                                            onChange={(e) => updateField('cheque_date', e.target.value)}
                                            onBlur={() => blurValidate('cheque_date')}
                                            className={cn(
                                                'w-full bg-slate-50 dark:bg-slate-800/40 border rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-primary/25',
                                                invalid
                                                    ? 'border-red-300 dark:border-red-500/40 bg-red-50/40 dark:bg-red-500/5'
                                                    : 'border-slate-200/80 dark:border-white/10'
                                            )}
                                        />
                                    )}
                                </FormField>
                            </div>

                            <FormField label="Deposit date" hint={form.deposit_date ? undefined : 'Optional'} description="When the cheque was or will be deposited.">
                                {({ id, describedBy }) => (
                                    <input
                                        id={id}
                                        type="date"
                                        aria-describedby={describedBy}
                                        min={form.cheque_date || undefined}
                                        value={form.deposit_date}
                                        onChange={(e) => updateField('deposit_date', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-primary/25"
                                    />
                                )}
                            </FormField>

                            <FormField label="Notes" hint={form.notes ? `${form.notes.length}/300` : 'Optional'}>
                                {({ id, describedBy }) => (
                                    <SmartTextarea
                                        id={id}
                                        aria-describedby={describedBy}
                                        rows={2}
                                        maxLength={300}
                                        value={form.notes}
                                        onValueChange={(v) => updateField('notes', v)}
                                        placeholder="Any remarks about this cheque..."
                                    />
                                )}
                            </FormField>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 h-11 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    aria-busy={saving}
                                    className="flex-1 h-11 rounded-2xl bg-purple-600 text-white text-sm font-black inline-flex items-center justify-center gap-2 hover:bg-purple-500 transition-colors disabled:opacity-60"
                                >
                                    {saving && (
                                        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    )}
                                    {saving ? 'Saving...' : 'Add Cheque'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={confirmDeleteCheque}
                title="Delete cheque?"
                description={`Are you sure you want to delete cheque ${confirmDelete?.cheque_number ?? ''}? This cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    )
}
