'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MdArrowBack, MdPerson, MdPayments, MdReceiptLong, MdExpandMore, MdCalendarToday } from 'react-icons/md'
import { toast } from 'sonner'
import { SelectorModal } from '@/components/ui/SelectorModal'
import { FormField } from '@/components/ui/form/FormField'
import { FormSection } from '@/components/ui/form/FormSection'
import { FormActions } from '@/components/ui/form/FormActions'
import { SmartInput, SmartNumberInput, SmartSelect, SmartTextarea } from '@/components/ui/form/smart-inputs'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { validatePositiveNumber } from '@/lib/field-validation'
import { friendlyError } from '@/lib/friendly-errors'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { paymentSchema } from '@/lib/validators'
import { paymentService } from '@/services/payment.service'
import { cn } from '@/lib/utils'

interface Customer {
    id: string;
    name: string;
    phone?: string;
    billing_address?: string;
    shipping_address?: string;
    supply_place?: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    total_amount: number;
    amount_paid: number;
    balance_amount: number;
    payment_status: string;
}

interface FormErrors {
    customer?: string
    payment_number?: string
    amount?: string
    payment_date?: string
    payment_mode?: string
}

function CreatePaymentForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(!!editId)
    const [dirty, setDirty] = useState(false)
    const [errors, setErrors] = useState<FormErrors>({})
    const [showSummary, setShowSummary] = useState(false)
    const { confirmLeave } = useUnsavedChanges(dirty)

    const [customers, setCustomers] = useState<Customer[]>([])
    const [selectedCustomerId, setSelectedCustomerId] = useState('')
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)

    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
    const [loadedInvoiceId, setLoadedInvoiceId] = useState<string | null>(null)

    // Form fields
    const [paymentNumber, setPaymentNumber] = useState('')
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [amount, setAmount] = useState(0)
    const [paymentMode, setPaymentMode] = useState('cash')
    const [referenceNumber, setReferenceNumber] = useState('')
    const [notes, setNotes] = useState('')

    const today = new Date().toISOString().split('T')[0]

    const markChanged = () => {
        setDirty(true)
        setShowSummary(false)
    }

    const validateForm = (): FormErrors => {
        const errs: FormErrors = {}
        if (!selectedCustomerId) errs.customer = 'Please select a customer.'
        if (!paymentNumber.trim()) errs.payment_number = 'Please enter the receipt number.'
        if (!amount || amount <= 0) {
            errs.amount = 'Please enter the amount.'
        } else {
            const positive = validatePositiveNumber(amount, 'amount')
            if (positive) errs.amount = positive
        }
        if (!paymentDate) errs.payment_date = 'Please select the payment date.'
        if (!paymentMode) errs.payment_mode = 'Please select the payment mode.'
        return errs
    }

    const blurValidate = (field: keyof FormErrors) => {
        const all = validateForm()
        setErrors((e) => ({ ...e, [field]: all[field] ?? '' }))
    }

    const fetchInitialData = React.useCallback(async () => {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const { data } = await supabase.from('customers').select('*').eq('user_id', userData.user.id).order('name')
            setCustomers((data as Customer[]) || [])
        } catch (error: unknown) {
            console.error('Initial data fetch error:', error)
        }
    }, [])

    const fetchCustomerInvoices = React.useCallback(async (customerId: string) => {
        if (!customerId) return
        try {
            const { data } = await supabase
                .from('invoices')
                .select('id, invoice_number, total_amount, amount_paid, balance_amount, payment_status')
                .eq('customer_id', customerId)
                .neq('payment_status', 'paid')
                .order('created_at', { ascending: false })
            setInvoices((data as Invoice[]) || [])
        } catch (error: unknown) {
            console.error('Fetch invoices error:', error)
        }
    }, [])

    const generatePaymentNumber = React.useCallback(async () => {
        const prefix = 'PMT-IN-'
        try {
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
        } catch (error: unknown) {
            console.error('Payment number generation error:', error)
        }
    }, [])

    const fetchPaymentForEdit = React.useCallback(async () => {
        if (!editId) return
        try {
            setFetching(true)
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
            setSelectedInvoiceId(data.invoice_id)
            setLoadedInvoiceId(data.invoice_id)
            setPaymentNumber(data.payment_number)
            setPaymentDate(data.payment_date)
            setAmount(data.amount)
            setPaymentMode(data.payment_mode)
            setReferenceNumber(data.reference_number || '')
            setNotes(data.notes || '')

            if (data.customer_id) {
                fetchCustomerInvoices(data.customer_id)
            }
        } catch (error: unknown) {
            console.error('Fetch payment for edit error:', error)
        } finally {
            setFetching(false)
        }
    }, [editId, router, fetchCustomerInvoices])

    useEffect(() => {
        fetchInitialData()
        if (editId) {
            fetchPaymentForEdit()
        } else {
            generatePaymentNumber()
        }
    }, [editId, fetchInitialData, fetchPaymentForEdit, generatePaymentNumber])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        const validationErrors = validateForm()
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            setShowSummary(true)
            document.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')?.focus()
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const customer = customers.find(c => c.id === selectedCustomerId)
            const payload = {
                user_id: userData.user.id,
                customer_id: selectedCustomerId,
                invoice_id: selectedInvoiceId || null,
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

            const validatedData = paymentSchema.parse(payload)

            if (editId) {
                // Reconcile the old invoice first so its balance reflects the
                // removal of this receipt before it is re-pointed elsewhere.
                if (loadedInvoiceId && loadedInvoiceId !== selectedInvoiceId) {
                    await paymentService.reconcileInvoice(loadedInvoiceId)
                }
                await paymentService.update(editId, validatedData)
            } else {
                await paymentService.create(validatedData)
            }

            // Keep the linked invoice's received/balance/status in sync with the payments ledger
            if (selectedInvoiceId) {
                await paymentService.reconcileInvoice(selectedInvoiceId)
            }

            toast.success(editId ? 'Payment updated successfully!' : 'Payment recorded successfully!')
            router.push('/dashboard/payments-in')
        } catch (error: unknown) {
            toast.error(friendlyError(error))
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        if (!confirmLeave()) return
        router.back()
    }

    if (fetching) {
        return (
            <div className="max-w-4xl mx-auto py-20 flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading payment...</p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-32 px-4 md:px-6 animate-in fade-in duration-500">
            {/* Studio Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 bg-slate-900 dark:bg-primary/5 p-6 md:p-10 rounded-[32px] text-white shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] pointer-events-none" aria-hidden="true"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleCancel}
                        aria-label="Back to payments-in"
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:scale-95"
                    >
                        <MdArrowBack size={22} className="text-white" aria-hidden="true" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight">
                            {editId ? 'Edit' : 'Record'} <span className="text-green-500">Payment-In</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-sm mt-0.5">
                            {editId ? 'Update receipt details for this payment.' : 'Document funds received from your customers.'}
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true"></span>
                    Required fields are marked with *
                </div>
            </div>

            <form id="payment-form" onSubmit={handleSave} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {showSummary && (
                    <div className="lg:col-span-3">
                        <InlineAlert variant="error" title="Please fix the following before saving:">
                            <ul className="list-disc list-inside space-y-1">
                                {Object.values(errors).filter(Boolean).map((msg, i) => (
                                    <li key={i}>{msg}</li>
                                ))}
                            </ul>
                        </InlineAlert>
                    </div>
                )}

                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <FormSection
                        title="Party & Invoice"
                        description="Who is paying and which invoice (if any) this receipt settles."
                        icon={<MdPerson size={22} aria-hidden="true" />}
                    >
                        <FormField
                            label="Customer"
                            required
                            error={errors.customer}
                            description="The customer making this payment."
                        >
                            {({ id, describedBy, invalid }) => (
                                <button
                                    type="button"
                                    id={id}
                                    aria-describedby={describedBy}
                                    data-invalid={invalid ? 'true' : undefined}
                                    onClick={() => setIsCustomerModalOpen(true)}
                                    className={cn(
                                        'w-full flex items-center justify-between rounded-2xl border bg-slate-50 dark:bg-slate-800/40 px-4 h-12 text-sm font-medium text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/25',
                                        invalid
                                            ? 'border-red-300 dark:border-red-500/40 bg-red-50/40 dark:bg-red-500/5'
                                            : 'border-slate-200/80 dark:border-white/10'
                                    )}
                                >
                                    <span className={selectedCustomerId ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}>
                                        {selectedCustomerId
                                            ? customers.find(c => c.id === selectedCustomerId)?.name || 'Select Customer'
                                            : 'Choose a customer...'}
                                    </span>
                                    <MdExpandMore size={20} className="text-slate-400 shrink-0" aria-hidden="true" />
                                </button>
                            )}
                        </FormField>
                        <SelectorModal
                            isOpen={isCustomerModalOpen}
                            onClose={() => setIsCustomerModalOpen(false)}
                            title="Search Customer"
                            items={customers}
                            searchKeys={['name', 'phone']}
                            valueKey="id"
                            selectedValue={selectedCustomerId}
                            onSelect={(c) => {
                                setSelectedCustomerId(c.id)
                                setSelectedInvoiceId('')
                                fetchCustomerInvoices(c.id)
                                setErrors((e) => ({ ...e, customer: '' }))
                                markChanged()
                            }}
                            renderItem={(c) => (
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 group-hover:text-green-600 transition-colors uppercase tracking-tight">{c.name}</span>
                                    <span className="text-xs text-slate-500">{c.phone || 'No phone'}</span>
                                </div>
                            )}
                            emptyMessage="No customers found"
                            createLabel="Create Customer"
                            onCreateNew={() => router.push('/dashboard/customers/create')}
                        />

                        {selectedCustomerId && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                <FormField
                                    label="Link to Invoice"
                                    description="Optional — allocates this receipt to a pending invoice."
                                >
                                    {({ id, describedBy }) => (
                                        <button
                                            type="button"
                                            id={id}
                                            aria-describedby={describedBy}
                                            onClick={() => setIsInvoiceModalOpen(true)}
                                            className="w-full flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 h-12 text-sm font-medium text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/25"
                                        >
                                            <span className={selectedInvoiceId ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}>
                                                {selectedInvoiceId
                                                    ? invoices.find(i => i.id === selectedInvoiceId)?.invoice_number || 'Select Invoice'
                                                    : invoices.length > 0 ? 'Choose an invoice...' : 'No pending invoices found'}
                                            </span>
                                            <MdExpandMore size={20} className="text-slate-400 shrink-0" aria-hidden="true" />
                                        </button>
                                    )}
                                </FormField>
                                <SelectorModal
                                    isOpen={isInvoiceModalOpen}
                                    onClose={() => setIsInvoiceModalOpen(false)}
                                    title="Select Pending Invoice"
                                    items={invoices}
                                    searchKeys={['invoice_number']}
                                    valueKey="id"
                                    selectedValue={selectedInvoiceId}
                                    onSelect={(inv) => {
                                        setSelectedInvoiceId(inv.id)
                                        // Auto-fill amount with balance if currently 0
                                        if (amount === 0) setAmount(inv.balance_amount)
                                        markChanged()
                                    }}
                                    renderItem={(inv) => (
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 group-hover:text-green-600 transition-colors uppercase tracking-tight">{inv.invoice_number}</span>
                                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{new Date().toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900">₹ {inv.balance_amount.toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Pending Balance</p>
                                            </div>
                                        </div>
                                    )}
                                    emptyMessage="No pending invoices found"
                                    createLabel="Create Invoice"
                                    onCreateNew={() => router.push('/dashboard/invoices/create')}
                                />
                                {selectedInvoiceId && (
                                    <div className="px-4 py-3 bg-green-50 dark:bg-green-500/5 rounded-2xl border border-green-100 dark:border-green-500/10 flex justify-between items-center">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-green-600">
                                            Selected Invoice: {invoices.find(i => i.id === selectedInvoiceId)?.invoice_number}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedInvoiceId('')}
                                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </FormSection>

                    <FormSection
                        title="Payment Details"
                        description="Amount, date and remarks for this receipt."
                        icon={<MdPayments size={22} aria-hidden="true" />}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                                label="Amount received"
                                required
                                error={errors.amount}
                                description="Enter the amount received from the customer."
                            >
                                {({ id, describedBy, invalid }) => (
                                    <SmartNumberInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        value={amount}
                                        onValueChange={(v) => {
                                            setAmount(v ?? 0)
                                            markChanged()
                                        }}
                                        onBlur={() => blurValidate('amount')}
                                        prefix="₹"
                                        decimals={2}
                                        min={0}
                                        placeholder="0.00"
                                        className="text-lg font-bold"
                                    />
                                )}
                            </FormField>

                            <FormField
                                label="Payment date"
                                required
                                error={errors.payment_date}
                                description="The date this receipt was collected."
                            >
                                {({ id, describedBy, invalid }) => (
                                    <div>
                                        <div className="relative">
                                            <MdCalendarToday className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} aria-hidden="true" />
                                            <input
                                                id={id}
                                                type="date"
                                                aria-invalid={invalid}
                                                aria-describedby={describedBy}
                                                value={paymentDate}
                                                onChange={(e) => {
                                                    setPaymentDate(e.target.value)
                                                    markChanged()
                                                }}
                                                onBlur={() => blurValidate('payment_date')}
                                                max={editId ? undefined : today}
                                                className={cn(
                                                    'w-full bg-slate-50 dark:bg-slate-800/40 border rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-primary/25',
                                                    invalid
                                                        ? 'border-red-300 dark:border-red-500/40 bg-red-50/40 dark:bg-red-500/5'
                                                        : 'border-slate-200/80 dark:border-white/10'
                                                )}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPaymentDate(today)
                                                markChanged()
                                            }}
                                            className="mt-1.5 text-xs font-bold text-primary hover:underline"
                                        >
                                            Set to today
                                        </button>
                                    </div>
                                )}
                            </FormField>
                        </div>

                        <FormField label="Notes / remarks" hint={notes ? `${notes.length}/500` : undefined}>
                            {({ id, describedBy }) => (
                                <SmartTextarea
                                    id={id}
                                    aria-describedby={describedBy}
                                    value={notes}
                                    onValueChange={(v) => {
                                        setNotes(v)
                                        markChanged()
                                    }}
                                    maxLength={500}
                                    rows={3}
                                    placeholder="Payment received for invoice #..."
                                />
                            )}
                        </FormField>
                    </FormSection>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <FormSection
                        title="Reference"
                        description="Voucher identification and mode of receipt."
                        icon={<MdReceiptLong size={22} aria-hidden="true" />}
                    >
                        <FormField
                            label="Receipt number"
                            required
                            error={errors.payment_number}
                            description="Auto-generated — editable if needed."
                        >
                            {({ id, describedBy, invalid }) => (
                                <SmartInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    value={paymentNumber}
                                    onChange={(e) => {
                                        setPaymentNumber(e.target.value)
                                        markChanged()
                                    }}
                                    onBlur={() => blurValidate('payment_number')}
                                    placeholder="PMT-IN-0001"
                                    maxLength={20}
                                />
                            )}
                        </FormField>

                        <FormField
                            label="Payment mode"
                            required
                            error={errors.payment_mode}
                        >
                            {({ id, describedBy, invalid }) => (
                                <SmartSelect
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    value={paymentMode}
                                    onChange={(e) => {
                                        setPaymentMode(e.target.value)
                                        markChanged()
                                    }}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank">Bank Transfer</option>
                                    <option value="upi">UPI / QR</option>
                                    <option value="cheque">Cheque</option>
                                </SmartSelect>
                            )}
                        </FormField>

                        <FormField
                            label="Reference number"
                            hint={referenceNumber ? undefined : 'Optional'}
                            description="Txn ID, UTR, or cheque number."
                        >
                            {({ id, describedBy }) => (
                                <SmartInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    value={referenceNumber}
                                    onChange={(e) => {
                                        setReferenceNumber(e.target.value)
                                        markChanged()
                                    }}
                                    placeholder="Txn ID, Cheque #"
                                    maxLength={60}
                                />
                            )}
                        </FormField>
                    </FormSection>

                    <div className="bg-green-600 text-white rounded-[32px] p-6 space-y-2 shadow-xl shadow-green-600/20 overflow-hidden">
                        <p className="text-green-100 text-[10px] font-black uppercase tracking-widest">Total Receipt</p>
                        <h2 className="text-4xl font-black italic tracking-tight">₹ {amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
                    </div>
                </div>

                <FormActions
                    formId="payment-form"
                    onCancel={handleCancel}
                    saving={loading}
                    dirty={dirty}
                    saveLabel={editId ? 'Update payment' : 'Record receipt'}
                    className="lg:col-span-3"
                />
            </form>
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
