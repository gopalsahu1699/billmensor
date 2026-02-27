'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PaymentReminder, Invoice } from '@/types/index'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'
import {
    MdAdd, MdSearch, MdSend, MdAccessTime, MdCheckCircle, MdClose,
    MdMessage, MdMail, MdPhone, MdEvent, MdVisibility, MdDelete
} from 'react-icons/md'

    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: MdAccessTime },
    sent: { label: 'Sent', color: 'bg-green-100 text-green-700', icon: MdCheckCircle },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: MdClose },
}

export default function PaymentRemindersPage() {
    const [reminders, setReminders] = useState<PaymentReminder[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [sending, setSending] = useState(false)
    const [form, setForm] = useState({
        invoice_id: '',
        reminder_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
        message: '',
    })

    useEffect(() => {
        fetchData()
    }, [])

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
        } catch (error: any) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        
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
            setForm({ invoice_id: '', reminder_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'), message: '' })
            fetchData()
        } catch (error: any) {
            toast.error(error.message)
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
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSending(false)
        }
    }

    async function deleteReminder(id: string) {
        if (!confirm('Delete this reminder?')) return

        try {
            const { error } = await supabase.from('payment_reminders').delete().eq('id', id)
            if (error) throw error
            toast.success('Reminder deleted')
            fetchData()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const pendingReminders = reminders.filter(r => r.status === 'pending')
    const sentReminders = reminders.filter(r => r.status === 'sent')

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
                        <div className="w-14 h-14 bg-orange-600/10 rounded-2xl flex items-center justify-center">
                        <MdSend size={28} className="text-orange-600" />
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
                        <MdAdd size={20} />
                    Schedule Reminder
                </button>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <MdMessage size={24} />
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
                        <MdSend size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No reminders scheduled</h3>
                        <p className="text-slate-500 mt-1">Schedule reminders for unpaid invoices</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {reminders.map((reminder) => {
                            const status = statusConfig[reminder.status] || statusConfig.pending
                            const StatusIcon = status.icon

                            return (
                                <div key={reminder.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            reminder.status === 'sent' 
                                                ? 'bg-green-100 dark:bg-green-900/30' 
                                                : 'bg-yellow-100 dark:bg-yellow-900/30'
                                        }`}>
                    {reminder.status === 'sent' ? (
                                                <MdCheckCircle size={18} className="text-green-600" />
                                            ) : (
                                                <MdAccessTime size={18} className="text-yellow-600" />
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
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-500"
                                            >
                                                <MdSend size={12} />
                                                Send Now
                                            </button>
                                        )}
                                        {reminder.sent_via && (
                                            <span className="text-xs text-slate-500">
                                                via {reminder.sent_via}
                                            </span>
                                        )}
                                        <button 
                                            onClick={() => deleteReminder(reminder.id)}
                                            className="p-2 hover:bg-red-50 rounded-xl"
                                        >
                                            <MdDelete size={16} className="text-red-400" />
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
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8">
                        <h2 className="text-xl font-black mb-6">Schedule Payment Reminder</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase mb-2">Invoice *</label>
                                <select
                                    required
                                    value={form.invoice_id}
                                    onChange={(e) => setForm({ ...form, invoice_id: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4"
                                >
                                    <option value="">Select invoice</option>
                                    {invoices.map((inv) => (
                                        <option key={inv.id} value={inv.id}>
                                            {inv.invoice_number} - {inv.customers?.name} (₹{inv.total_amount?.toLocaleString('en-IN')})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase mb-2">Reminder Date</label>
                                <input
                                    type="date"
                                    value={form.reminder_date}
                                    onChange={(e) => setForm({ ...form, reminder_date: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase mb-2">Message (Optional)</label>
                                <textarea
                                    rows={3}
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4"
                                    placeholder="Dear Customer, this is a friendly reminder..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-black"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-black"
                                >
                                    Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
