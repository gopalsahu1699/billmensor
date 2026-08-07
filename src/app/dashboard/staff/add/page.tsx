'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
    MdArrowBack,
    MdSave,
    MdPhotoCamera,
    MdPerson,
    MdWork,
    MdBadge,
    MdAccountBalance,
    MdCloudUpload
} from 'react-icons/md'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FormField } from '@/components/ui/form/FormField'
import { SmartInput, SmartNumberInput, SmartTextarea, PhoneInput } from '@/components/ui/form/smart-inputs'
import { validatePhone, validatePositiveNumber } from '@/lib/field-validation'
import { friendlyError } from '@/lib/friendly-errors'

interface StaffForm {
    name: string
    phone: string
    role: string
    salary: string
    joining_date: string
    gender: string
    dob: string
    father_name: string
    whatsapp_phone: string
    aadhaar_number: string
    pan_number: string
    bank_name: string
    account_number: string
    ifsc_code: string
    address: string
    half_day_salary: string
    overtime_rate: string
    photo_url: string
}

type StaffFormKey = keyof StaffForm

function fieldError(key: StaffFormKey, f: StaffForm): string | undefined {
    switch (key) {
        case 'name':
            return f.name.trim() ? undefined : 'Please enter the staff name.'
        case 'phone':
            return f.phone.trim() ? validatePhone(f.phone) ?? undefined : undefined
        case 'whatsapp_phone':
            return f.whatsapp_phone.trim() ? validatePhone(f.whatsapp_phone) ?? undefined : undefined
        case 'salary':
            return validatePositiveNumber(f.salary, 'salary') ?? undefined
        case 'half_day_salary':
            return validatePositiveNumber(f.half_day_salary, 'half day amount') ?? undefined
        case 'overtime_rate':
            return validatePositiveNumber(f.overtime_rate, 'overtime rate') ?? undefined
        case 'aadhaar_number':
            return f.aadhaar_number.trim() ? (/^\d{12}$/.test(f.aadhaar_number.trim()) ? undefined : 'Aadhaar number must be 12 digits.') : undefined
        case 'pan_number':
            return f.pan_number.trim() ? (/^[A-Z]{5}\d{4}[A-Z]$/.test(f.pan_number.trim().toUpperCase()) ? undefined : 'PAN must be in the format ABCDE1234F.') : undefined
        case 'ifsc_code':
            return f.ifsc_code.trim() ? (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.ifsc_code.trim().toUpperCase()) ? undefined : 'IFSC must be in the format SBIN0001234.') : undefined
        default:
            return undefined
    }
}

export default function AddStaffPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [errors, setErrors] = useState<Partial<Record<StaffFormKey, string>>>({})

    const [formData, setFormData] = useState<StaffForm>({
        name: '',
        phone: '',
        role: '',
        salary: '',
        joining_date: new Date().toISOString().slice(0, 10),
        gender: 'Male',
        dob: '',
        father_name: '',
        whatsapp_phone: '',
        aadhaar_number: '',
        pan_number: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        address: '',
        half_day_salary: '',
        overtime_rate: '',
        photo_url: ''
    })

    const update = (key: StaffFormKey, value: string) => {
        setFormData((f) => ({ ...f, [key]: value }))
        setErrors((e) => (e[key] ? { ...e, [key]: '' } : e))
    }

    const blurValidate = (key: StaffFormKey) => {
        setErrors((e) => ({ ...e, [key]: fieldError(key, formData) ?? '' }))
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const validationErrors: Partial<Record<StaffFormKey, string>> = {}
        ;(Object.keys(formData) as StaffFormKey[]).forEach((key) => {
            const msg = fieldError(key, formData)
            if (msg) validationErrors[key] = msg
        })
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
            return
        }

        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Note: These extra columns must exist in your Supabase 'staff_members' table
            // If they don't, this will fail. For now, we'll try to insert what we have
            const { error } = await supabase.from('staff_members').insert({
                user_id: session.user.id,
                name: formData.name,
                phone: formData.phone,
                role: formData.role,
                salary: Number(formData.salary) || 0,
                joining_date: formData.joining_date,
                status: 'active',
                gender: formData.gender,
                dob: formData.dob || null,
                father_name: formData.father_name,
                whatsapp_phone: formData.whatsapp_phone,
                aadhaar_number: formData.aadhaar_number,
                pan_number: formData.pan_number,
                bank_name: formData.bank_name,
                bank_account_number: formData.account_number,
                bank_ifsc_code: formData.ifsc_code,
                address: formData.address,
                half_day_salary: Number(formData.half_day_salary) || 0,
                overtime_rate: Number(formData.overtime_rate) || 0,
                photo_url: formData.photo_url || null,
            })

            if (error) throw error

            toast.success('Staff member added successfully!')
            router.push('/dashboard/staff')
        } catch (error) {
            console.error(error)
            toast.error(friendlyError(error, 'Failed to add staff member. Please ensure database columns are updated.'))
        } finally {
            setLoading(false)
        }
    }

    const sectionClasses = "bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-[40px] border border-slate-200/60 dark:border-slate-800/60 p-8 shadow-2xl shadow-slate-200/20 dark:shadow-none"

    return (
        <div className="min-h-screen pb-20 bg-slate-50 dark:bg-[#020617]">
            {/* Header Sticky */}
            <div className="sticky top-0 z-40 bg-slate-50/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 mb-10">
                <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard/staff"
                            aria-label="Back to staff list"
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:shadow-lg hover:shadow-violet-500/10 transition-all active:scale-90"
                        >
                            <MdArrowBack size={24} aria-hidden="true" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">New Employee</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase leading-none">Add Staff Member</h1>
                        </div>
                    </div>

                    <button
                        type="submit"
                        form="staff-form"
                        disabled={loading}
                        aria-busy={loading}
                        className="group flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-violet-600/30 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <MdSave size={20} className="group-hover:rotate-12 transition-transform" aria-hidden="true" />
                                Save Profile
                            </>
                        )}
                    </button>
                </div>
            </div>

            <form id="staff-form" onSubmit={handleSubmit} noValidate className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column - Photo & Core Info */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Photo Upload */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={sectionClasses}
                    >
                        <div className="flex flex-col items-center text-center">
                            <label className="relative group cursor-pointer mb-6" aria-label="Upload profile photo">
                                <input type="file" className="sr-only peer" accept="image/*" onChange={handleImageChange} />
                                <div className="w-44 h-44 rounded-[48px] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-violet-500/20 peer-focus-visible:ring-4 peer-focus-visible:ring-violet-500/40">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Staff photo preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <MdPhotoCamera size={48} className="opacity-20" aria-hidden="true" />
                                            <span className="text-[10px] font-black uppercase">Upload Photo</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-violet-600 text-white p-3 rounded-2xl shadow-xl group-hover:scale-110 transition-transform">
                                    <MdCloudUpload size={20} aria-hidden="true" />
                                </div>
                            </label>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white italic uppercase mb-1">Profile Picture</h3>
                            <p className="text-xs text-slate-500 font-medium">PNG, JPG up to 5MB</p>
                        </div>
                    </motion.div>

                    {/* Quick Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={sectionClasses}
                    >
                        <h3 className="text-sm font-black text-slate-900 dark:text-white italic uppercase mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600">
                                <MdPerson aria-hidden="true" />
                            </span>
                            Basic Identity
                        </h3>

                        <div className="space-y-6">
                            <FormField label="Gender">
                                {({ labelId }) => (
                                    <div role="group" aria-labelledby={labelId} className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
                                        {['Male', 'Female'].map(g => (
                                            <button
                                                key={g}
                                                type="button"
                                                aria-pressed={formData.gender === g}
                                                onClick={() => update('gender', g)}
                                                className={`py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${formData.gender === g
                                                    ? 'bg-white dark:bg-slate-900 text-violet-600 shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </FormField>

                            <FormField label="Date of Birth" hint={formData.dob ? undefined : 'Optional'}>
                                {({ id, describedBy }) => (
                                    <SmartInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        type="date"
                                        value={formData.dob}
                                        onChange={(e) => update('dob', e.target.value)}
                                    />
                                )}
                            </FormField>

                            <FormField label="Father&apos;s / Husband Name" hint={formData.father_name ? undefined : 'Optional'}>
                                {({ id, describedBy }) => (
                                    <SmartInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        placeholder="e.g. Shyam Kumar"
                                        maxLength={120}
                                        value={formData.father_name}
                                        onChange={(e) => update('father_name', e.target.value)}
                                    />
                                )}
                            </FormField>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column - Multi Sections */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Employment Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={sectionClasses}
                    >
                        <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase mb-8 flex items-center gap-4">
                            <span className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                                <MdWork size={20} aria-hidden="true" />
                            </span>
                            Employment & Salary
                        </h3>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <FormField label="Full Name" required error={errors.name}>
                                    {({ id, describedBy, invalid }) => (
                                        <SmartInput
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={invalid}
                                            invalid={invalid}
                                            icon={<MdPerson size={18} aria-hidden="true" />}
                                            placeholder="e.g. Ramesh Kumar"
                                            maxLength={120}
                                            transform="words"
                                            trimOnBlur
                                            required
                                            autoComplete="name"
                                            value={formData.name}
                                            onChange={(e) => update('name', e.target.value)}
                                            onBlur={() => blurValidate('name')}
                                        />
                                    )}
                                </FormField>
                            </div>

                            <FormField label="Phone Number" error={errors.phone} hint={formData.phone ? undefined : 'Optional'}>
                                {({ id, describedBy, invalid }) => (
                                    <PhoneInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        placeholder="98765 43210"
                                        maxLength={15}
                                        value={formData.phone}
                                        onChange={(e) => update('phone', e.target.value)}
                                        onBlur={() => blurValidate('phone')}
                                    />
                                )}
                            </FormField>

                            <FormField label="Role / Designation" hint={formData.role ? undefined : 'Optional'}>
                                {({ id, describedBy }) => (
                                    <SmartInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        placeholder="e.g. Sales Executive"
                                        maxLength={80}
                                        value={formData.role}
                                        onChange={(e) => update('role', e.target.value)}
                                    />
                                )}
                            </FormField>

                            <div className="md:col-span-2 grid md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800">
                                <FormField label="Monthly Salary" error={errors.salary} hint="Optional">
                                    {({ id, describedBy, invalid }) => (
                                        <SmartNumberInput
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={invalid}
                                            invalid={invalid}
                                            prefix="₹"
                                            decimals={2}
                                            min={0}
                                            placeholder="15000"
                                            value={formData.salary}
                                            onValueChange={(v) => update('salary', v === undefined ? '' : String(v))}
                                            onBlur={() => blurValidate('salary')}
                                        />
                                    )}
                                </FormField>
                                <FormField label="Half Day" error={errors.half_day_salary} hint="Optional">
                                    {({ id, describedBy, invalid }) => (
                                        <SmartNumberInput
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={invalid}
                                            invalid={invalid}
                                            prefix="₹"
                                            decimals={2}
                                            min={0}
                                            placeholder="250"
                                            value={formData.half_day_salary}
                                            onValueChange={(v) => update('half_day_salary', v === undefined ? '' : String(v))}
                                            onBlur={() => blurValidate('half_day_salary')}
                                        />
                                    )}
                                </FormField>
                                <FormField label="Overtime / Hr" error={errors.overtime_rate} hint="Optional">
                                    {({ id, describedBy, invalid }) => (
                                        <SmartNumberInput
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={invalid}
                                            invalid={invalid}
                                            prefix="₹"
                                            decimals={2}
                                            min={0}
                                            placeholder="100"
                                            value={formData.overtime_rate}
                                            onValueChange={(v) => update('overtime_rate', v === undefined ? '' : String(v))}
                                            onBlur={() => blurValidate('overtime_rate')}
                                        />
                                    )}
                                </FormField>
                            </div>

                            <FormField label="Joining Date">
                                {({ id, describedBy }) => (
                                    <SmartInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        type="date"
                                        value={formData.joining_date}
                                        onChange={(e) => update('joining_date', e.target.value)}
                                    />
                                )}
                            </FormField>

                            <FormField label="WhatsApp Number" error={errors.whatsapp_phone} hint={formData.whatsapp_phone ? undefined : 'Optional'}>
                                {({ id, describedBy, invalid }) => (
                                    <PhoneInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        placeholder="Same as phone"
                                        maxLength={15}
                                        value={formData.whatsapp_phone}
                                        onChange={(e) => update('whatsapp_phone', e.target.value)}
                                        onBlur={() => blurValidate('whatsapp_phone')}
                                    />
                                )}
                            </FormField>
                        </div>
                    </motion.div>

                    {/* KYC & Identity */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={sectionClasses}
                    >
                        <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase mb-8 flex items-center gap-4">
                            <span className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600">
                                <MdBadge size={20} aria-hidden="true" />
                            </span>
                            Identity & KYC (India)
                        </h3>

                        <div className="grid md:grid-cols-2 gap-8">
                            <FormField label="Aadhaar Card Number" error={errors.aadhaar_number} hint={formData.aadhaar_number ? undefined : 'Optional'}>
                                {({ id, describedBy, invalid }) => (
                                    <SmartInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        inputMode="numeric"
                                        placeholder="#### #### ####"
                                        maxLength={12}
                                        autoComplete="off"
                                        value={formData.aadhaar_number}
                                        onChange={(e) => update('aadhaar_number', e.target.value.replace(/[^\d]/g, ''))}
                                        onBlur={() => blurValidate('aadhaar_number')}
                                    />
                                )}
                            </FormField>
                            <FormField label="PAN Card Number" error={errors.pan_number} hint={formData.pan_number ? undefined : 'Optional'}>
                                {({ id, describedBy, invalid }) => (
                                    <SmartInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        transform="upper"
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                        autoComplete="off"
                                        spellCheck={false}
                                        value={formData.pan_number}
                                        onChange={(e) => update('pan_number', e.target.value)}
                                        onBlur={() => blurValidate('pan_number')}
                                    />
                                )}
                            </FormField>
                            <div className="md:col-span-2">
                                <FormField label="Full Address" hint={formData.address ? undefined : 'Optional'}>
                                    {({ id, describedBy }) => (
                                        <SmartTextarea
                                            id={id}
                                            aria-describedby={describedBy}
                                            rows={3}
                                            placeholder="Street, Landmark, City, State, Pincode"
                                            autoComplete="street-address"
                                            value={formData.address}
                                            onChange={(e) => update('address', e.target.value)}
                                        />
                                    )}
                                </FormField>
                            </div>
                        </div>
                    </motion.div>

                    {/* Bank Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className={sectionClasses}
                    >
                        <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase mb-8 flex items-center gap-4">
                            <span className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center text-green-600">
                                <MdAccountBalance size={20} aria-hidden="true" />
                            </span>
                            Bank Details (Salary Settlement)
                        </h3>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <FormField label="Bank Name" hint={formData.bank_name ? undefined : 'Optional'}>
                                    {({ id, describedBy }) => (
                                        <SmartInput
                                            id={id}
                                            aria-describedby={describedBy}
                                            placeholder="e.g. State Bank of India"
                                            maxLength={80}
                                            autoComplete="off"
                                            value={formData.bank_name}
                                            onChange={(e) => update('bank_name', e.target.value)}
                                        />
                                    )}
                                </FormField>
                            </div>
                            <FormField label="Account Number" hint={formData.account_number ? undefined : 'Optional'}>
                                {({ id, describedBy }) => (
                                    <SmartInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        inputMode="numeric"
                                        placeholder="987654321012"
                                        maxLength={20}
                                        autoComplete="off"
                                        value={formData.account_number}
                                        onChange={(e) => update('account_number', e.target.value)}
                                    />
                                )}
                            </FormField>
                            <FormField label="IFSC Code" error={errors.ifsc_code} hint={formData.ifsc_code ? undefined : 'Optional'}>
                                {({ id, describedBy, invalid }) => (
                                    <SmartInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        transform="upper"
                                        placeholder="SBIN0001234"
                                        maxLength={11}
                                        autoComplete="off"
                                        spellCheck={false}
                                        value={formData.ifsc_code}
                                        onChange={(e) => update('ifsc_code', e.target.value)}
                                        onBlur={() => blurValidate('ifsc_code')}
                                    />
                                )}
                            </FormField>
                        </div>
                    </motion.div>
                </div>
            </form>
        </div>
    )
}
