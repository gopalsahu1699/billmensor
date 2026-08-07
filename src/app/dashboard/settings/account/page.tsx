'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Profile, BankDetails } from '@/types'
import { INDIAN_STATES } from '@/lib/constants'
import { FormField } from '@/components/ui/form/FormField'
import { FormSection } from '@/components/ui/form/FormSection'
import { FormActions } from '@/components/ui/form/FormActions'
import { SmartInput, SmartTextarea, SmartSelect, EmailInput, PhoneInput, GSTInput } from '@/components/ui/form/smart-inputs'
import { friendlyError } from '@/lib/friendly-errors'
import { validateRequired, validateEmail, validatePhone, validateGSTIN } from '@/lib/field-validation'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import {
    IoBusiness,
    IoCall,
    IoMail,
    IoDocument,
    IoCard,
    IoCloudUpload,
    IoShield,
    IoSync,
    IoCheckmarkCircle,
    IoPhonePortrait,
    IoBook,
    IoGrid,
    IoColorPalette
} from 'react-icons/io5'
import { FaHashtag, FaSave } from 'react-icons/fa'

const EMPTY_PROFILE = {
    company_name: '',
    full_name: '',
    designation: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    website: '',
    business_type: '',
    industry_type: '',
    place_of_supply: '',
    terms_and_conditions: '',
    logo_url: '',
    signature_url: '',
    custom_field_1_label: '',
    custom_field_1_value: '',
    custom_field_2_label: '',
    custom_field_2_value: '',
    custom_field_3_label: '',
    custom_field_3_value: '',
    brand_color: '#2563eb',
    accent_color: '#1e293b',
    font_family: 'Inter',
}

const EMPTY_BANK = {
    account_number: '',
    account_holder_name: '',
    ifsc_code: '',
    bank_branch_name: '',
    upi_id: '',
}

function setFieldError(errors: Record<string, string>, field: string, error: string | null): Record<string, string> {
    if (error) return { ...errors, [field]: error }
    if (!errors[field]) return errors
    const next = { ...errors }
    delete next[field]
    return next
}

function focusControl(ref: React.RefObject<HTMLDivElement | null>) {
    ref.current?.querySelector<HTMLElement>('input, select, textarea')?.focus()
}

function focusFirstError(errors: Record<string, string>, fields: Array<[string, React.RefObject<HTMLDivElement | null>]>) {
    for (const [field, ref] of fields) {
        if (errors[field]) {
            focusControl(ref)
            return
        }
    }
}

export default function AccountSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [bankSaving, setBankSaving] = useState(false)

    const [profile, setProfile] = useState(EMPTY_PROFILE)
    const [bank, setBank] = useState(EMPTY_BANK)

    const [initialProfile, setInitialProfile] = useState<typeof EMPTY_PROFILE | null>(null)
    const [initialBank, setInitialBank] = useState<typeof EMPTY_BANK | null>(null)

    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
    const [bankErrors, setBankErrors] = useState<Record<string, string>>({})

    const companyNameRef = useRef<HTMLDivElement>(null)
    const phoneRef = useRef<HTMLDivElement>(null)
    const emailRef = useRef<HTMLDivElement>(null)
    const gstinRef = useRef<HTMLDivElement>(null)
    const ifscRef = useRef<HTMLDivElement>(null)
    const logoInputRef = useRef<HTMLInputElement>(null)
    const signatureInputRef = useRef<HTMLInputElement>(null)

    const dirty = initialProfile !== null && (
        JSON.stringify(profile) !== JSON.stringify(initialProfile) ||
        JSON.stringify(bank) !== JSON.stringify(initialBank)
    )

    useUnsavedChanges(dirty)

    useEffect(() => {
        fetchProfile()
    }, [])

    async function fetchProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') throw error

            if (data) {
                const p = data as Profile
                const loadedProfile = {
                    company_name: p.company_name || '',
                    full_name: p.full_name || '',
                    designation: p.designation || '',
                    phone: p.phone || '',
                    email: p.email || '',
                    address: p.address || '',
                    gstin: p.gstin || '',
                    website: p.website || '',
                    business_type: p.business_type || '',
                    industry_type: p.industry_type || '',
                    place_of_supply: p.place_of_supply || '',
                    terms_and_conditions: p.terms_and_conditions || '',
                    logo_url: p.logo_url || '',
                    signature_url: p.signature_url || '',
                    custom_field_1_label: p.custom_field_1_label || '',
                    custom_field_1_value: p.custom_field_1_value || '',
                    custom_field_2_label: p.custom_field_2_label || '',
                    custom_field_2_value: p.custom_field_2_value || '',
                    custom_field_3_label: p.custom_field_3_label || '',
                    custom_field_3_value: p.custom_field_3_value || '',
                    brand_color: p.brand_color || '#2563eb',
                    accent_color: p.accent_color || '#1e293b',
                    font_family: p.font_family || 'Inter',
                }
                setProfile(loadedProfile)
                setInitialProfile(loadedProfile)

                const { data: bankData } = await supabase
                    .from('company_bank_details')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

                const b = bankData as BankDetails | null
                const loadedBank = b ? {
                    account_number: b.account_number || '',
                    account_holder_name: b.account_holder_name || '',
                    ifsc_code: b.ifsc_code || '',
                    bank_branch_name: b.bank_branch_name || '',
                    upi_id: b.upi_id || '',
                } : EMPTY_BANK
                setBank(loadedBank)
                setInitialBank(loadedBank)
            }
        } catch (error: unknown) {
            toast.error(friendlyError(error, error instanceof Error ? error.message : 'An error occurred'))
        } finally {
            setLoading(false)
        }
    }

    function validateProfileForm(): Record<string, string> {
        const errs: Record<string, string> = {}
        const companyErr = validateRequired(profile.company_name, 'Company name')
        if (companyErr) errs.company_name = companyErr
        const emailErr = validateEmail(profile.email)
        if (emailErr) errs.email = emailErr
        const phoneErr = validatePhone(profile.phone)
        if (phoneErr) errs.phone = phoneErr
        const gstinErr = validateGSTIN(profile.gstin)
        if (gstinErr) errs.gstin = gstinErr
        return errs
    }

    function validateBankForm(): Record<string, string> {
        const errs: Record<string, string> = {}
        const ifsc = bank.ifsc_code.trim()
        if (ifsc && ifsc.length !== 11) errs.ifsc_code = 'IFSC code must be 11 characters (e.g. SBIN0001234).'
        return errs
    }

    function validateProfileField(field: string, value: string): string | null {
        if (field === 'company_name') return validateRequired(value, 'Company name')
        if (field === 'email') return validateEmail(value)
        if (field === 'phone') return validatePhone(value)
        if (field === 'gstin') return validateGSTIN(value)
        return null
    }

    function validateBankField(field: string, value: string): string | null {
        if (field === 'ifsc_code') {
            const ifsc = value.trim()
            if (ifsc && ifsc.length !== 11) return 'IFSC code must be 11 characters (e.g. SBIN0001234).'
        }
        return null
    }

    function handleProfileBlur(field: string, value: string) {
        setProfileErrors(prev => setFieldError(prev, field, validateProfileField(field, value)))
    }

    function handleBankBlur(field: string, value: string) {
        setBankErrors(prev => setFieldError(prev, field, validateBankField(field, value)))
    }

    async function handleSave(e?: React.FormEvent) {
        if (e) e.preventDefault()
        const errs = validateProfileForm()
        setProfileErrors(errs)
        if (Object.keys(errs).length > 0) {
            focusFirstError(errs, [
                ['company_name', companyNameRef],
                ['phone', phoneRef],
                ['email', emailRef],
                ['gstin', gstinRef],
            ])
            return
        }
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...profile,
                    updated_at: new Date().toISOString()
                })

            if (error) {
                if (error.code === '42703') {
                    throw new Error('Database schema update required. Please run the migration SQL for custom fields.')
                }
                throw error
            }
            setInitialProfile(profile)
            toast.success('Settings saved successfully')
        } catch (error: unknown) {
            toast.error(friendlyError(error, error instanceof Error ? error.message : 'Failed to save settings'))
        } finally {
            setSaving(false)
        }
    }

    async function handleBankSave() {
        const errs = validateBankForm()
        setBankErrors(errs)
        if (Object.keys(errs).length > 0) {
            focusFirstError(errs, [['ifsc_code', ifscRef]])
            return
        }
        setBankSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: existing } = await supabase
                .from('company_bank_details')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (existing) {
                const { error } = await supabase
                    .from('company_bank_details')
                    .update(bank)
                    .eq('user_id', user.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('company_bank_details')
                    .insert({ ...bank, user_id: user.id })
                if (error) throw error
            }

            setInitialBank(bank)
            toast.success('Bank details saved successfully')
        } catch (error: unknown) {
            toast.error(friendlyError(error, error instanceof Error ? error.message : 'Failed to save bank details'))
        } finally {
            setBankSaving(false)
        }
    }

    async function handleImageUpload(file: File, field: 'logo_url' | 'signature_url') {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const ext = file.name.split('.').pop()
            const fileName = `${user.id}/${field}_${Date.now()}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from('business-assets')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('business-assets')
                .getPublicUrl(fileName)

            setProfile(prev => ({ ...prev, [field]: publicUrl }))

            await supabase
                .from('profiles')
                .update({ [field]: publicUrl })
                .eq('id', user.id)

            toast.success(`${field === 'logo_url' ? 'Logo' : 'Signature'} uploaded successfully`)
        } catch (error: unknown) {
            toast.error(friendlyError(error, error instanceof Error ? error.message : 'Upload failed'))
        }
    }

    function handleCancel() {
        if (initialProfile) setProfile(initialProfile)
        if (initialBank) setBank(initialBank)
        setProfileErrors({})
        setBankErrors({})
    }

    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <form id="bank-form" onSubmit={(e) => { e.preventDefault(); handleBankSave() }} noValidate className="hidden"></form>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600">
                            <IoBusiness size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed">Manage your business profile and custom print fields.</p>
                </div>
                <button
                    type="submit"
                    form="account-form"
                    disabled={saving}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                >
                    {saving ? <IoSync size={20} className="animate-spin" /> : <FaSave size={20} strokeWidth={3} />}
                    {saving ? 'SAVING...' : 'SAVE ALL'}
                </button>
            </div>

            <form id="account-form" onSubmit={handleSave} noValidate>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT COLUMN */}
                    <div className="space-y-8">
                        <FormSection
                            title="Company Information"
                            description="Your business identity used on invoices and quotations."
                            icon={<IoBusiness size={20} />}
                        >
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => logoInputRef.current?.click()}
                                    aria-label="Upload logo"
                                    className="w-28 h-28 bg-slate-50 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center text-xs cursor-pointer overflow-hidden border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-blue-500/50 transition-all group"
                                >
                                    {profile.logo_url ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={profile.logo_url}
                                                alt="Logo"
                                                fill
                                                className="object-contain p-2"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <IoCloudUpload size={20} className="text-slate-400 group-hover:text-blue-500 mb-1 transition-colors" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo</span>
                                        </>
                                    )}
                                </button>
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    aria-label="Upload logo"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo_url')}
                                />
                                <button
                                    type="button"
                                    onClick={() => signatureInputRef.current?.click()}
                                    aria-label="Upload signature"
                                    className="w-28 h-28 bg-slate-50 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center text-xs cursor-pointer overflow-hidden border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-blue-500/50 transition-all group"
                                >
                                    {profile.signature_url ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={profile.signature_url}
                                                alt="Signature"
                                                fill
                                                className="object-contain p-2"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <IoCloudUpload size={20} className="text-slate-400 group-hover:text-blue-500 mb-1 transition-colors" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signature</span>
                                        </>
                                    )}
                                </button>
                                <input
                                    ref={signatureInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    aria-label="Upload signature"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'signature_url')}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Company Name" required error={profileErrors.company_name}>
                                    {({ id, describedBy, invalid, errorId }) => (
                                        <div ref={companyNameRef}>
                                            <SmartInput
                                                id={id}
                                                aria-describedby={describedBy}
                                                aria-invalid={invalid}
                                                aria-errormessage={invalid ? errorId : undefined}
                                                aria-required
                                                icon={<IoBusiness size={16} />}
                                                value={profile.company_name}
                                                transform="words"
                                                trimOnBlur
                                                onValueChange={(v) => {
                                                    setProfile(prev => ({ ...prev, company_name: v }))
                                                    setProfileErrors(prev => setFieldError(prev, 'company_name', null))
                                                }}
                                                onBlur={(e) => handleProfileBlur('company_name', e.target.value)}
                                                placeholder="e.g. Billmensor Solutions Pvt Ltd"
                                            />
                                        </div>
                                    )}
                                </FormField>

                                <FormField label="Owner / Contact Name">
                                    {({ id }) => (
                                        <SmartInput
                                            id={id}
                                            icon={<IoCheckmarkCircle size={16} />}
                                            value={profile.full_name}
                                            transform="words"
                                            trimOnBlur
                                            onValueChange={(v) => setProfile(prev => ({ ...prev, full_name: v }))}
                                            placeholder="Full name"
                                        />
                                    )}
                                </FormField>

                                <FormField label="Phone Number" error={profileErrors.phone}>
                                    {({ id, describedBy, invalid, errorId }) => (
                                        <div ref={phoneRef}>
                                            <PhoneInput
                                                id={id}
                                                aria-describedby={describedBy}
                                                aria-invalid={invalid}
                                                aria-errormessage={invalid ? errorId : undefined}
                                                icon={<IoCall size={16} />}
                                                value={profile.phone}
                                                onValueChange={(v) => {
                                                    setProfile(prev => ({ ...prev, phone: v }))
                                                    setProfileErrors(prev => setFieldError(prev, 'phone', null))
                                                }}
                                                onBlur={(e) => handleProfileBlur('phone', e.target.value)}
                                                placeholder="+91 00000 00000"
                                            />
                                        </div>
                                    )}
                                </FormField>

                                <FormField label="Email Address" error={profileErrors.email}>
                                    {({ id, describedBy, invalid, errorId }) => (
                                        <div ref={emailRef}>
                                            <EmailInput
                                                id={id}
                                                aria-describedby={describedBy}
                                                aria-invalid={invalid}
                                                aria-errormessage={invalid ? errorId : undefined}
                                                icon={<IoMail size={16} />}
                                                value={profile.email}
                                                onValueChange={(v) => {
                                                    setProfile(prev => ({ ...prev, email: v }))
                                                    setProfileErrors(prev => setFieldError(prev, 'email', null))
                                                }}
                                                onBlur={(e) => handleProfileBlur('email', e.target.value)}
                                                placeholder="hello@company.com"
                                            />
                                        </div>
                                    )}
                                </FormField>
                            </div>

                            <FormField label="Registered Address" description="Complete street address, city, state, PIN code.">
                                {({ id }) => (
                                    <SmartTextarea
                                        id={id}
                                        value={profile.address}
                                        onValueChange={(v) => setProfile(prev => ({ ...prev, address: v }))}
                                        placeholder="Complete street address, city, state, PIN code..."
                                    />
                                )}
                            </FormField>
                        </FormSection>

                        <FormSection
                            title="Custom Print Fields"
                            description="These fields will appear on your printed invoices and quotations."
                            icon={<IoGrid size={20} />}
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Field 1 Label">
                                        {({ id }) => (
                                            <SmartInput
                                                id={id}
                                                icon={<FaHashtag size={14} />}
                                                value={profile.custom_field_1_label}
                                                onValueChange={(v) => setProfile(prev => ({ ...prev, custom_field_1_label: v }))}
                                                placeholder="e.g. Vehicle No."
                                            />
                                        )}
                                    </FormField>
                                    <FormField label="Field 1 Value">
                                        {({ id }) => (
                                            <SmartInput
                                                id={id}
                                                icon={<IoGrid size={14} />}
                                                value={profile.custom_field_1_value}
                                                onValueChange={(v) => setProfile(prev => ({ ...prev, custom_field_1_value: v }))}
                                                placeholder="e.g. MH 12 AB 1234"
                                            />
                                        )}
                                    </FormField>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Field 2 Label">
                                        {({ id }) => (
                                            <SmartInput
                                                id={id}
                                                icon={<FaHashtag size={14} />}
                                                value={profile.custom_field_2_label}
                                                onValueChange={(v) => setProfile(prev => ({ ...prev, custom_field_2_label: v }))}
                                                placeholder="e.g. PAN No."
                                            />
                                        )}
                                    </FormField>
                                    <FormField label="Field 2 Value">
                                        {({ id }) => (
                                            <SmartInput
                                                id={id}
                                                icon={<IoGrid size={14} />}
                                                value={profile.custom_field_2_value}
                                                onValueChange={(v) => setProfile(prev => ({ ...prev, custom_field_2_value: v }))}
                                                placeholder="ABCDE1234F"
                                            />
                                        )}
                                    </FormField>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Field 3 Label">
                                        {({ id }) => (
                                            <SmartInput
                                                id={id}
                                                icon={<FaHashtag size={14} />}
                                                value={profile.custom_field_3_label}
                                                onValueChange={(v) => setProfile(prev => ({ ...prev, custom_field_3_label: v }))}
                                                placeholder="e.g. DL No."
                                            />
                                        )}
                                    </FormField>
                                    <FormField label="Field 3 Value">
                                        {({ id }) => (
                                            <SmartInput
                                                id={id}
                                                icon={<IoGrid size={14} />}
                                                value={profile.custom_field_3_value}
                                                onValueChange={(v) => setProfile(prev => ({ ...prev, custom_field_3_value: v }))}
                                                placeholder="Enter Value"
                                            />
                                        )}
                                    </FormField>
                                </div>
                            </div>
                        </FormSection>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-8">
                        <FormSection
                            title="Bank Details"
                            description="Your payment account used for customer transfers."
                            icon={<IoCard size={20} />}
                            action={
                                <button
                                    type="submit"
                                    form="bank-form"
                                    disabled={bankSaving}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {bankSaving ? <IoSync size={14} className="animate-spin" /> : <FaSave size={14} />}
                                    {bankSaving ? 'SAVING...' : 'SAVE BANK'}
                                </button>
                            }
                        >
                            <FormField label="Account Number">
                                {({ id }) => (
                                    <SmartInput
                                        id={id}
                                        icon={<IoCard size={16} />}
                                        inputMode="numeric"
                                        autoComplete="off"
                                        className="tracking-widest"
                                        value={bank.account_number}
                                        onValueChange={(v) => setBank(prev => ({ ...prev, account_number: v.replace(/\D/g, '') }))}
                                        placeholder="XXXX XXXX XXXX XXXX"
                                    />
                                )}
                            </FormField>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Account Holder Name">
                                    {({ id }) => (
                                        <SmartInput
                                            id={id}
                                            icon={<IoCheckmarkCircle size={16} />}
                                            value={bank.account_holder_name}
                                            transform="words"
                                            trimOnBlur
                                            onValueChange={(v) => setBank(prev => ({ ...prev, account_holder_name: v }))}
                                            placeholder="As per bank records"
                                        />
                                    )}
                                </FormField>

                                <FormField label="IFSC Code" hint="11 characters (e.g. SBIN0001234)" error={bankErrors.ifsc_code}>
                                    {({ id, describedBy, invalid, errorId }) => (
                                        <div ref={ifscRef}>
                                            <SmartInput
                                                id={id}
                                                aria-describedby={describedBy}
                                                aria-invalid={invalid}
                                                aria-errormessage={invalid ? errorId : undefined}
                                                icon={<FaHashtag size={16} />}
                                                transform="upper"
                                                maxLength={11}
                                                className="tracking-widest font-black"
                                                value={bank.ifsc_code}
                                                onValueChange={(v) => {
                                                    setBank(prev => ({ ...prev, ifsc_code: v }))
                                                    setBankErrors(prev => setFieldError(prev, 'ifsc_code', null))
                                                }}
                                                onBlur={(e) => handleBankBlur('ifsc_code', e.target.value)}
                                                placeholder="SBIN0001234"
                                            />
                                        </div>
                                    )}
                                </FormField>
                            </div>

                            <FormField label="Bank & Branch Name">
                                {({ id }) => (
                                    <SmartInput
                                        id={id}
                                        icon={<IoBusiness size={16} />}
                                        value={bank.bank_branch_name}
                                        transform="words"
                                        trimOnBlur
                                        onValueChange={(v) => setBank(prev => ({ ...prev, bank_branch_name: v }))}
                                        placeholder="e.g. State Bank of India, MG Road Branch"
                                    />
                                )}
                            </FormField>

                            <FormField label="UPI ID" description="Used to accept UPI payments on your invoices.">
                                {({ id }) => (
                                    <SmartInput
                                        id={id}
                                        icon={<IoPhonePortrait size={16} />}
                                        value={bank.upi_id}
                                        onValueChange={(v) => setBank(prev => ({ ...prev, upi_id: v }))}
                                        placeholder="business@upi"
                                    />
                                )}
                            </FormField>
                        </FormSection>

                        <FormSection
                            title="Tax & Compliance"
                            description="GST details printed on your invoices."
                            icon={<IoDocument size={20} />}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="GSTIN Number" hint="15 characters" error={profileErrors.gstin}>
                                    {({ id, describedBy, invalid, errorId }) => (
                                        <div ref={gstinRef}>
                                            <GSTInput
                                                id={id}
                                                aria-describedby={describedBy}
                                                aria-invalid={invalid}
                                                aria-errormessage={invalid ? errorId : undefined}
                                                icon={<IoDocument size={16} />}
                                                maxLength={15}
                                                className="tracking-widest font-black"
                                                value={profile.gstin}
                                                onValueChange={(v) => {
                                                    setProfile(prev => ({ ...prev, gstin: v }))
                                                    setProfileErrors(prev => setFieldError(prev, 'gstin', null))
                                                }}
                                                onBlur={(e) => handleProfileBlur('gstin', e.target.value)}
                                                placeholder="27AAAAA0000A1Z5"
                                            />
                                        </div>
                                    )}
                                </FormField>

                                <FormField label="Place of Supply">
                                    {({ id }) => (
                                        <SmartSelect
                                            id={id}
                                            value={profile.place_of_supply}
                                            onChange={(e) => setProfile(prev => ({ ...prev, place_of_supply: e.target.value }))}
                                        >
                                            <option value="">Select State</option>
                                            {INDIAN_STATES.map(s => (
                                                <option key={s.code} value={s.name}>{s.name}</option>
                                            ))}
                                        </SmartSelect>
                                    )}
                                </FormField>
                            </div>
                        </FormSection>

                        <FormSection
                            title="Terms & Conditions"
                            description="Shown at the bottom of your invoices and quotations."
                            icon={<IoBook size={20} />}
                        >
                            <FormField label="Terms & Conditions">
                                {({ id }) => (
                                    <SmartTextarea
                                        id={id}
                                        className="min-h-[160px]"
                                        value={profile.terms_and_conditions}
                                        onValueChange={(v) => setProfile(prev => ({ ...prev, terms_and_conditions: v }))}
                                        placeholder="Enter terms and conditions that will appear on your invoices..."
                                    />
                                )}
                            </FormField>
                        </FormSection>

                        <FormSection
                            title="Branding & Appearance"
                            description="Colors and typography used across your documents."
                            icon={<IoColorPalette size={20} />}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="Brand Color">
                                    {({ id }) => (
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                aria-label="Brand color swatch"
                                                className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                                                value={profile.brand_color}
                                                onChange={(e) => setProfile(prev => ({ ...prev, brand_color: e.target.value }))}
                                            />
                                            <SmartInput
                                                id={id}
                                                className="font-mono uppercase"
                                                value={profile.brand_color}
                                                onChange={(e) => setProfile(prev => ({ ...prev, brand_color: e.target.value }))}
                                                placeholder="#2563EB"
                                            />
                                        </div>
                                    )}
                                </FormField>

                                <FormField label="Accent Color">
                                    {({ id }) => (
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                aria-label="Accent color swatch"
                                                className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                                                value={profile.accent_color}
                                                onChange={(e) => setProfile(prev => ({ ...prev, accent_color: e.target.value }))}
                                            />
                                            <SmartInput
                                                id={id}
                                                className="font-mono uppercase"
                                                value={profile.accent_color}
                                                onChange={(e) => setProfile(prev => ({ ...prev, accent_color: e.target.value }))}
                                                placeholder="#1E293B"
                                            />
                                        </div>
                                    )}
                                </FormField>
                            </div>

                            <FormField label="Font Family">
                                {({ id }) => (
                                    <SmartSelect
                                        id={id}
                                        value={profile.font_family}
                                        onChange={(e) => setProfile(prev => ({ ...prev, font_family: e.target.value }))}
                                    >
                                        <option value="Inter">Inter (Sans Serif)</option>
                                        <option value="Roboto">Roboto</option>
                                        <option value="Outfit">Outfit</option>
                                        <option value="Geist">Geist</option>
                                        <option value="system-ui">System Sans</option>
                                    </SmartSelect>
                                )}
                            </FormField>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Preview</p>
                                <div className="flex items-center gap-4">
                                    <div
                                        className="px-4 py-2 rounded-lg text-white text-xs font-bold"
                                        style={{ backgroundColor: profile.brand_color, fontFamily: profile.font_family }}
                                    >
                                        Brand Button
                                    </div>
                                    <div
                                        className="px-4 py-2 rounded-lg text-white text-xs font-bold"
                                        style={{ backgroundColor: profile.accent_color, fontFamily: profile.font_family }}
                                    >
                                        Accent Button
                                    </div>
                                </div>
                            </div>
                        </FormSection>
                    </div>
                </div>
            </form>

            <FormActions
                formId="account-form"
                onCancel={handleCancel}
                saving={saving}
                saveLabel="Save All"
                dirty={dirty}
            />

            {/* Security Footer */}
            <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-8 border border-slate-800 dark:border-white/5 text-white flex items-center gap-6 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-yellow-500 shrink-0">
                    <IoShield size={28} />
                </div>
                <div>
                    <h4 className="text-sm font-black uppercase tracking-widest">Encrypted Data Management</h4>
                    <p className="text-slate-400 text-xs mt-1 font-medium leading-relaxed">Your business credentials are used exclusively for invoice generation and tax compliance filing. All data is secured with industry-standard encryption.</p>
                </div>
            </div>
        </div>
    )
}
