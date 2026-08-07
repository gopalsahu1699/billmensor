'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PaymentReminder, Invoice } from '@/types/index'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'
import { cn } from '@/lib/utils'
import {
    MdAdd, MdSend, MdAccessTime, MdCheckCircle, MdClose,
    MdMessage, MdDelete
} from 'react-icons/md'
import { FormField } from '@/components/ui/form/FormField'
import { SmartSelect, SmartTextarea } from '@/components/ui/form/smart-inputs'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { friendlyError } from '@/lib/friendly-errors'

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number }> }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: MdAccessTime },
    sent: { label: 'Sent', color: 'bg-green-100 text-green-700', icon: MdCheckCircle },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: MdClose },
}

interface ReminderForm {
    invoice_id: string
    reminder_date: string
    message: string
}

interface ReminderErrors {
    invoice_id?: string
    reminder_date?: string
}

export default function PaymentRemindersPage() {
    const [reminders, setReminders] = useState<PaymentReminder[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [sending, setSending] = useState(false)
    const [form, setForm] = useState<ReminderForm>({
        invoice_id: '',
        reminder_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
        message: '',
    })
    const [errors, setErrors] = useState<ReminderErrors>({})
    const [confirmDelete, setConfirmDelete] = useState<PaymentReminder | null>(null)

    const today = format(new Date(), 'yyyy-MM-dd')

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (!showModal) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowModal(false)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showModal])

    async function fetchData() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const [remindersRes, invoicesRes] = await Promise.all([
                supabase
                    .from('payment_reminders')
                    .select('*, invoices(*)')
                    .eq('user_id', user.id)
                    .order('reminder_date', { ascending: false }),
                supabase
                    .from('invoices')
                    .select('*, customers(*)')
                    .eq('user_id', user.id)
                    .eq('payment_status', 'unpaid')
                    .neq('status', 'cancelled')
                    .neq('status', 'void')
                    .order('invoice_date', { ascending: false })
            ])

            setReminders(remindersRes.data || [])
            setInvoices(invoicesRes.data || [])
        } catch (error: unknown) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    function updateField(key: keyof ReminderForm, value: string) {
        setForm((f) => ({ ...f, [key]: value }))
        setErrors((e) => ({ ...e, [key]: '' }))
    }

    const validateForm = (): ReminderErrors => {
        const errs: ReminderErrors = {}
        if (!form.invoice_id) errs.invoice_id = 'Please select an invoice.'
        if (!form.reminder_date) errs.reminder_date = 'Please select the reminder date.'
        return errs
    }

    const blurValidate = (field: keyof ReminderErrors) => {
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
                .from('payment_reminders')
                .insert({
                    user_id: user.id,
                    invoice_id: form.invoice_id,
                    reminder_date: form.reminder_date,
                    message: form.message,
                    status: 'pending'
                })

            if (error) throw error
            toast.success('Reminder scheduled successfully')
            setShowModal(false)
            setErrors({})
            setForm({ invoice_id: '', reminder_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'), message: '' })
            fetchData()
        } catch (error: unknown) {
            toast.error(friendlyError(error))
        } finally {
            setSaving(false)
        }
    }

    async function sendNow(reminder: PaymentReminder) {
        setSending(true)

        // Simulate sending (in production, integrate with WhatsApp/SMS API)
        await new Promise(resolve => setTimeout(resolve, 1500))

        try {
            const { error } = await supabase
                .from('payment_reminders')
                .update({
                    status: 'sent',
                    sent_date: new Date().toISOString(),
                    sent_via: 'whatsapp'
                })
                .eq('id', reminder.id)

            if (error) throw error
            toast.success('Reminder sent successfully!')
            fetchData()
        } catch (error: unknown) {
            toast.error(friendlyError(error))
        } finally {
            setSending(false)
        }
    }

    async function confirmDeleteReminder() {
        if (!confirmDelete) return

        try {
            const { error } = await supabase.from('payment_reminders').delete().eq('id', confirmDelete.id)
            if (error) throw error
            toast.success('Reminder deleted')
            fetchData()
        } catch (error: unknown) {
            toast.error(friendlyError(error))
        } finally {
            setConfirmDelete(null)
        }
    }

    const pendingReminders = reminders.filter(r => r.status === 'pending')
    const sentReminders = reminders.filter(r => r.status === 'sent')

    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-600/10 rounded-2xl flex items-center justify-center">
                        <MdSend size={28} className="text-orange-600" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Payment Reminders</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Automate payment collection via WhatsApp & SMS</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-orange-600/20"
                >
                    <MdAdd size={20} aria-hidden="true" />
                    Schedule Reminder
                </button>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <MdMessage size={24} aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Automated Reminders</h3>
                        <p className="text-green-100 text-sm">
                            Send WhatsApp and SMS reminders to customers for pending payments
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 uppercase">Pending Reminders</p>
                    <p className="text-2xl font-black text-yellow-600">{pendingReminders.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 uppercase">Sent Successfully</p>
                    <p className="text-2xl font-black text-green-600">{sentReminders.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 uppercase">Unpaid Invoices</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{invoices.length}</p>
                </div>
            </div>

            {/* Reminders List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Scheduled Reminders</h2>
                </div>

                {reminders.length === 0 ? (
                    <div className="py-20 text-center">
                        <MdSend size={48} className="mx-auto text-slate-300 mb-4" aria-hidden="true" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No reminders scheduled</h3>
                        <p className="text-slate-500 mt-1">Schedule reminders for unpaid invoices</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {reminders.map((reminder) => {
                            const status = statusConfig[reminder.status] || statusConfig.pending

                            return (
                                <div key={reminder.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            reminder.status === 'sent'
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : 'bg-yellow-100 dark:bg-yellow-900/30'
                                        }`}>
                                            {reminder.status === 'sent' ? (
                                                <MdCheckCircle size={18} className="text-green-600" aria-hidden="true" />
                                            ) : (
                                                <MdAccessTime size={18} className="text-yellow-600" aria-hidden="true" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                Invoice: {reminder.invoices?.invoice_number}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {reminder.invoices?.customers?.name} • 
                                                ₹{reminder.invoices?.total_amount?.toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {reminder.reminder_date ? format(new Date(reminder.reminder_date), 'dd MMM yyyy') : 'Not scheduled'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${status.color}`}>
                                            {status.label}
                                        </span>
                                        {reminder.status === 'pending' && (
                                            <button
                                                onClick={() => sendNow(reminder)}
                                                disabled={sending}
                                                aria-busy={sending}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-500 disabled:opacity-60"
                                            >
                                                <MdSend size={12} aria-hidden="true" />
                                                Send Now
                                            </button>
                                        )}
                                        {reminder.sent_via && (
                                            <span className="text-xs text-slate-500">
                                                via {reminder.sent_via}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setConfirmDelete(reminder)}
                                            aria-label={`Delete reminder for invoice ${reminder.invoices?.invoice_number ?? ''}`}
                                            className="p-2 hover:bg-red-50 rounded-xl"
                                        >
                                            <MdDelete size={16} className="text-red-400" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Schedule Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="schedule-reminder-title"
                        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 id="schedule-reminder-title" className="text-xl font-black">Schedule Payment Reminder</h2>
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
                            <FormField
                                label="Invoice"
                                required
                                error={errors.invoice_id}
                                description="The unpaid invoice you want to remind about."
                            >
                                {({ id, describedBy, invalid }) => (
                                    <SmartSelect
                                        id={id}
                                        autoFocus
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        value={form.invoice_id}
                                        onChange={(e) => updateField('invoice_id', e.target.value)}
                                        placeholderOption="Select invoice"
                                    >
                                        {invoices.map((inv) => (
                                            <option key={inv.id} value={inv.id}>
                                                {inv.invoice_number} - {inv.customers?.name} (₹{inv.total_amount?.toLocaleString('en-IN')})
                                            </option>
                                        ))}
                                    </SmartSelect>
                                )}
                            </FormField>

                            <FormField
                                label="Reminder date"
                                required
                                error={errors.reminder_date}
                                description="When the reminder should be sent."
                                hint="Defaults to 3 days from today."
                            >
                                {({ id, describedBy, invalid }) => (
                                    <div>
                                        <input
                                            id={id}
                                            type="date"
                                            aria-invalid={invalid}
                                            aria-describedby={describedBy}
                                            min={today}
                                            value={form.reminder_date}
                                            onChange={(e) => updateField('reminder_date', e.target.value)}
                                            onBlur={() => blurValidate('reminder_date')}
                                            className={cn(
                                                'w-full bg-slate-50 dark:bg-slate-800/40 border rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-primary/25',
                                                invalid
                                                    ? 'border-red-300 dark:border-red-500/40 bg-red-50/40 dark:bg-red-500/5'
                                                    : 'border-slate-200/80 dark:border-white/10'
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => updateField('reminder_date', today)}
                                            className="mt-1.5 text-xs font-bold text-orange-600 hover:underline"
                                        >
                                            Set to today
                                        </button>
                                    </div>
                                )}
                            </FormField>

                            <FormField label="Message" hint={form.message ? `${form.message.length}/500` : 'Optional'}>
                                {({ id, describedBy }) => (
                                    <SmartTextarea
                                        id={id}
                                        aria-describedby={describedBy}
                                        rows={3}
                                        maxLength={500}
                                        value={form.message}
                                        onValueChange={(v) => updateField('message', v)}
                                        placeholder="Dear Customer, this is a friendly reminder..."
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
                                    className="flex-1 h-11 rounded-2xl bg-orange-600 text-white text-sm font-black inline-flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors disabled:opacity-60"
                                >
                                    {saving && (
                                        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    )}
                                    {saving ? 'Scheduling...' : 'Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={confirmDeleteReminder}
                title="Delete reminder?"
                description="Are you sure you want to delete this reminder? This cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    )
}
