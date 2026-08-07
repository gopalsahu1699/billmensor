'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { INDIAN_STATES } from '@/lib/constants'
import { MdArrowBack, MdPerson, MdAlternateEmail, MdPhoneIphone, MdLocationOn, MdLocalShipping, MdReceiptLong, MdStorefront } from 'react-icons/md'
import { FormField } from '@/components/ui/form/FormField'
import { FormSection } from '@/components/ui/form/FormSection'
import { FormActions } from '@/components/ui/form/FormActions'
import { SmartInput, SmartTextarea, SmartSelect, EmailInput, PhoneInput, GSTInput } from '@/components/ui/form/smart-inputs'
import { validateEmail, validatePhone, validateGSTIN } from '@/lib/field-validation'
import { friendlyError } from '@/lib/friendly-errors'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'

interface CustomerForm {
    name: string
    email: string
    phone: string
    billing_address: string
    shipping_address: string
    supply_place: string
    gstin: string
    billing_phone: string
    shipping_phone: string
    shipping_gstin: string
    billing_gstin: string
    type: 'customer' | 'supplier' | 'both'
}

const DEFAULT_FORM: CustomerForm = {
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
}

function fieldError(key: keyof CustomerForm, f: CustomerForm): string | undefined {
    switch (key) {
        case 'name':
            return f.name.trim() ? undefined : 'Please enter the customer name.'
        case 'email':
            return validateEmail(f.email) ?? undefined
        case 'phone':
            return validatePhone(f.phone) ?? undefined
        case 'billing_phone':
            return f.billing_phone.trim() ? validatePhone(f.billing_phone) ?? undefined : undefined
        case 'shipping_phone':
            return f.shipping_phone.trim() ? validatePhone(f.shipping_phone) ?? undefined : undefined
        case 'gstin':
            return f.gstin.trim() ? validateGSTIN(f.gstin) ?? undefined : undefined
        case 'billing_gstin':
            return f.billing_gstin.trim() ? validateGSTIN(f.billing_gstin) ?? undefined : undefined
        case 'shipping_gstin':
            return f.shipping_gstin.trim() ? validateGSTIN(f.shipping_gstin) ?? undefined : undefined
        default:
            return undefined
    }
}

export default function CreateCustomerPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [fetching, setFetching] = useState(!!editId)
    const [form, setForm] = useState<CustomerForm>(DEFAULT_FORM)
    const [errors, setErrors] = useState<Partial<Record<keyof CustomerForm, string>>>({})
    const [dirty, setDirty] = useState(false)
    const { confirmLeave } = useUnsavedChanges(dirty)

    const update = (key: keyof CustomerForm, value: string) => {
        setForm((f) => ({ ...f, [key]: value }))
        setDirty(true)
        setErrors((e) => (e[key] ? { ...e, [key]: '' } : e))
    }

    const blurValidate = (key: keyof CustomerForm) => {
        const msg = fieldError(key, form)
        setErrors((e) => ({ ...e, [key]: msg ?? '' }))
    }

    const fetchCustomer = useCallback(async () => {
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
            toast.error(friendlyError(error))
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
        const validationErrors: Partial<Record<keyof CustomerForm, string>> = {}
        ;(Object.keys(DEFAULT_FORM) as (keyof CustomerForm)[]).forEach((key) => {
            const msg = fieldError(key, form)
            if (msg) validationErrors[key] = msg
        })
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            if (editId) {
                const { error } = await supabase
                    .from('customers')
                    .update({ ...form, name: form.name.trim() })
                    .eq('id', editId)

                if (error) throw error
                toast.success('Customer updated successfully')
            } else {
                const { error } = await supabase
                    .from('customers')
                    .insert([{ ...form, name: form.name.trim(), user_id: userData.user.id }])

                if (error) throw error
                toast.success('Customer added successfully')
            }
            setSaved(true)
            setDirty(false)
            setTimeout(() => router.push('/dashboard/customers'), 500)
        } catch (error: unknown) {
            toast.error(friendlyError(error))
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        if (!confirmLeave()) return
        router.push('/dashboard/customers')
    }

    if (fetching) {
        return (
            <div className="max-w-4xl mx-auto py-20 flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading customer...</p>
            </div>
        )
    }

    const options = ['customer', 'supplier', 'both'] as const

    return (
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-32 px-4 md:px-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 bg-slate-900 dark:bg-primary/5 p-6 md:p-10 rounded-[32px] text-white shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" aria-hidden="true"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <Link href="/dashboard/customers" aria-label="Back to customers">
                        <button
                            type="button"
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:scale-95"
                        >
                            <MdArrowBack size={22} className="text-white" aria-hidden="true" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight">
                            {editId ? 'Edit' : 'Add'} <span className="text-primary">Customer</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-sm mt-0.5">
                            {editId ? 'Update the business profile and logistics.' : 'Create a new business partnership.'}
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true"></span>
                    Required fields are marked with *
                </div>
            </div>

            <form id="customer-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <FormSection
                        title="General Information"
                        description="Core identity and contact details for this party."
                        icon={<MdPerson size={22} aria-hidden="true" />}
                    >
                        <FormField
                            label="Engagement type"
                            description="How this party interacts with your business."
                        >
                            {({ labelId }) => (
                                <div role="radiogroup" aria-labelledby={labelId} className="flex gap-2 md:gap-3">
                                    {options.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            role="radio"
                                            aria-checked={form.type === t}
                                            onClick={() => {
                                                setForm((f) => ({ ...f, type: t }))
                                                setDirty(true)
                                            }}
                                            className={`flex-1 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${form.type === t
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </FormField>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                                label="Customer name"
                                required
                                error={errors.name}
                            >
                                {({ id, describedBy, invalid }) => (
                                    <SmartInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        icon={<MdPerson size={18} aria-hidden="true" />}
                                        placeholder="e.g. Sharma Traders"
                                        maxLength={120}
                                        transform="words"
                                        trimOnBlur
                                        value={form.name}
                                        onChange={(e) => update('name', e.target.value)}
                                        onBlur={() => blurValidate('name')}
                                    />
                                )}
                            </FormField>

                            <FormField
                                label="Email"
                                error={errors.email}
                                hint={form.email ? undefined : 'Optional'}
                            >
                                {({ id, describedBy, invalid }) => (
                                    <EmailInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        icon={<MdAlternateEmail size={18} aria-hidden="true" />}
                                        placeholder="contact@enterprise.com"
                                        maxLength={120}
                                        value={form.email}
                                        onChange={(e) => update('email', e.target.value)}
                                        onBlur={() => blurValidate('email')}
                                    />
                                )}
                            </FormField>

                            <FormField
                                label="Phone"
                                error={errors.phone}
                            >
                                {({ id, describedBy, invalid }) => (
                                    <PhoneInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        icon={<MdPhoneIphone size={18} aria-hidden="true" />}
                                        placeholder="+91 00000 00000"
                                        maxLength={15}
                                        value={form.phone}
                                        onChange={(e) => update('phone', e.target.value)}
                                        onBlur={() => blurValidate('phone')}
                                    />
                                )}
                            </FormField>
                        </div>
                    </FormSection>

                    <FormSection
                        title="Logistics & Delivery"
                        description="Billing and shipping details used on documents."
                        icon={<MdLocalShipping size={22} aria-hidden="true" />}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-5 p-5 rounded-[24px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary" aria-hidden="true">
                                        <MdLocationOn size={16} />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Billing</h4>
                                </div>
                                <FormField label="Address">
                                    {({ id, describedBy }) => (
                                        <SmartTextarea
                                            id={id}
                                            aria-describedby={describedBy}
                                            rows={2}
                                            placeholder="Registered office address..."
                                            value={form.billing_address}
                                            onChange={(e) => update('billing_address', e.target.value)}
                                        />
                                    )}
                                </FormField>
                                <FormField label="Phone" error={errors.billing_phone}>
                                    {({ id, describedBy, invalid }) => (
                                        <PhoneInput
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={invalid}
                                            invalid={invalid}
                                            placeholder="+91..."
                                            value={form.billing_phone}
                                            onChange={(e) => update('billing_phone', e.target.value)}
                                            onBlur={() => blurValidate('billing_phone')}
                                        />
                                    )}
                                </FormField>
                                <FormField label="GSTIN" error={errors.billing_gstin} hint={form.billing_gstin ? `${form.billing_gstin.length}/15` : 'Optional'}>
                                    {({ id, describedBy, invalid }) => (
                                        <GSTInput
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={invalid}
                                            invalid={invalid}
                                            icon={<MdReceiptLong size={16} aria-hidden="true" />}
                                            placeholder="Billing GSTIN"
                                            maxLength={15}
                                            value={form.billing_gstin}
                                            onChange={(e) => update('billing_gstin', e.target.value)}
                                            onBlur={() => blurValidate('billing_gstin')}
                                        />
                                    )}
                                </FormField>
                            </div>

                            <div className="space-y-5 p-5 rounded-[24px] bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary" aria-hidden="true">
                                        <MdLocalShipping size={16} />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/70">Shipping</h4>
                                </div>
                                <FormField label="Address">
                                    {({ id, describedBy }) => (
                                        <SmartTextarea
                                            id={id}
                                            aria-describedby={describedBy}
                                            rows={2}
                                            placeholder="Point of delivery..."
                                            value={form.shipping_address}
                                            onChange={(e) => update('shipping_address', e.target.value)}
                                        />
                                    )}
                                </FormField>
                                <FormField label="Phone" error={errors.shipping_phone}>
                                    {({ id, describedBy, invalid }) => (
                                        <PhoneInput
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={invalid}
                                            invalid={invalid}
                                            placeholder="Alt shipping contact"
                                            value={form.shipping_phone}
                                            onChange={(e) => update('shipping_phone', e.target.value)}
                                            onBlur={() => blurValidate('shipping_phone')}
                                        />
                                    )}
                                </FormField>
                                <FormField label="GSTIN" error={errors.shipping_gstin} hint={form.shipping_gstin ? `${form.shipping_gstin.length}/15` : 'Optional'}>
                                    {({ id, describedBy, invalid }) => (
                                        <GSTInput
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={invalid}
                                            invalid={invalid}
                                            icon={<MdReceiptLong size={16} aria-hidden="true" />}
                                            placeholder="Shipping GSTIN"
                                            maxLength={15}
                                            value={form.shipping_gstin}
                                            onChange={(e) => update('shipping_gstin', e.target.value)}
                                            onBlur={() => blurValidate('shipping_gstin')}
                                        />
                                    )}
                                </FormField>
                                <button
                                    type="button"
                                    onClick={() => {
                                        update('shipping_address', form.billing_address)
                                        update('shipping_phone', form.billing_phone)
                                        update('shipping_gstin', form.billing_gstin)
                                    }}
                                    className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 underline underline-offset-4"
                                >
                                    Copy from billing
                                </button>
                            </div>
                        </div>
                    </FormSection>
                </div>

                {/* Right Column: Compliance */}
                <div className="space-y-6">
                    <FormSection
                        title="Compliance & Tax"
                        description="GST details used for invoices and returns."
                        icon={<MdReceiptLong size={22} aria-hidden="true" />}
                        className="bg-slate-900 dark:bg-slate-900 border-slate-800 text-white shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none" aria-hidden="true"></div>
                        <div className="relative space-y-5">
                            <FormField label="Primary GSTIN" error={errors.gstin} hint={form.gstin ? `${form.gstin.length}/15` : 'Optional'}>
                                {({ id, describedBy, invalid }) => (
                                    <GSTInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        icon={<MdReceiptLong size={18} aria-hidden="true" />}
                                        placeholder="15-character GSTIN"
                                        maxLength={15}
                                        value={form.gstin}
                                        onChange={(e) => update('gstin', e.target.value)}
                                        onBlur={() => blurValidate('gstin')}
                                    />
                                )}
                            </FormField>

                            <FormField label="Place of supply" description="Used to determine GST applicability.">
                                {({ id, describedBy }) => (
                                    <SmartSelect
                                        id={id}
                                        aria-describedby={describedBy}
                                        value={form.supply_place}
                                        onChange={(e) => update('supply_place', e.target.value)}
                                        placeholderOption="Select state"
                                        className="bg-slate-800/50 dark:bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600"
                                    >
                                        {INDIAN_STATES.map((s) => (
                                            <option key={s.code} value={s.name} className="bg-slate-900 text-white">
                                                {s.name}
                                            </option>
                                        ))}
                                    </SmartSelect>
                                )}
                            </FormField>

                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    <span className="text-primary font-black uppercase mr-1.5">Note:</span>
                                    Accurate GST and logistics details ensure smooth tax filing and professional documents.
                                </p>
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Status">
                        <div className="flex flex-col items-center text-center gap-3 py-2">
                            <div className="w-14 h-14 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300" aria-hidden="true">
                                <MdStorefront size={28} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Active</h4>
                                <p className="text-xs text-slate-500 mt-1">This party is available for new transactions.</p>
                            </div>
                        </div>
                    </FormSection>
                </div>

                <FormActions
                    formId="customer-form"
                    onCancel={handleCancel}
                    saving={loading}
                    success={saved}
                    dirty={dirty}
                    saveLabel={editId ? 'Update customer' : 'Save customer'}
                    className="lg:col-span-3"
                />
            </form>
        </div>
    )
}
