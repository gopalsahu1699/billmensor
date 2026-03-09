'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
    MdArrowBack,
    MdSave,
    MdPhotoCamera,
    MdPerson,
    MdWork,
    MdPayments,
    MdAccountBalance,
    MdBadge,
    MdLocationOn,
    MdAccessTime,
    MdCloudUpload,
    MdRefresh
} from 'react-icons/md'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id: staffId } = use(params)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        role: '',
        salary: '',
        joining_date: '',
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

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const { data, error } = await supabase
                    .from('staff_members')
                    .select('*')
                    .eq('id', staffId)
                    .single()

                if (error) throw error
                if (data) {
                    setFormData({
                        name: data.name || '',
                        phone: data.phone || '',
                        role: data.role || '',
                        salary: data.salary?.toString() || '',
                        joining_date: data.joining_date || '',
                        gender: data.gender || 'Male',
                        dob: data.dob || '',
                        father_name: data.father_name || '',
                        whatsapp_phone: data.whatsapp_phone || '',
                        aadhaar_number: data.aadhaar_number || '',
                        pan_number: data.pan_number || '',
                        bank_name: data.bank_name || '',
                        account_number: data.bank_account_number || '',
                        ifsc_code: data.bank_ifsc_code || '',
                        address: data.address || '',
                        half_day_salary: data.half_day_salary?.toString() || '',
                        overtime_rate: data.overtime_rate?.toString() || '',
                        photo_url: data.photo_url || ''
                    })
                    if (data.photo_url) setImagePreview(data.photo_url)
                }
            } catch (error) {
                console.error(error)
                toast.error('Failed to load staff details')
            } finally {
                setLoading(false)
            }
        }

        fetchStaff()
    }, [staffId])

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

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!formData.name) return toast.error('Name is required')

        try {
            setSaving(true)
            const { error } = await supabase.from('staff_members').update({
                name: formData.name,
                phone: formData.phone,
                role: formData.role,
                salary: Number(formData.salary) || 0,
                joining_date: formData.joining_date,
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
                photo_url: imagePreview?.startsWith('data:') ? formData.photo_url : imagePreview // Simple logic for demo
            }).eq('id', staffId)

            if (error) throw error

            toast.success('Staff profile updated!')
            router.push('/dashboard/staff')
        } catch (error) {
            console.error(error)
            toast.error('Failed to update staff member. Ensure database columns exist.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-[#020617]">
                <MdRefresh className="animate-spin text-violet-600 w-12 h-12" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Profile...</p>
            </div>
        )
    }

    const inputClasses = "w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all placeholder:text-slate-400"
    const labelClasses = "text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2 px-1 flex items-center gap-2"
    const sectionClasses = "bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-[40px] border border-slate-200/60 dark:border-slate-800/60 p-8 shadow-2xl shadow-slate-200/20 dark:shadow-none"

    return (
        <div className="min-h-screen pb-20 bg-slate-50 dark:bg-[#020617]">
            {/* Header Sticky */}
            <div className="sticky top-0 z-40 bg-slate-50/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 mb-10">
                <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard/staff"
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:shadow-lg hover:shadow-violet-500/10 transition-all active:scale-90"
                        >
                            <MdArrowBack size={24} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">Edit Employee</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase leading-none">{formData.name || 'Staff Member'}</h1>
                        </div>
                    </div>

                    <button
                        onClick={() => handleSubmit()}
                        disabled={saving}
                        className="group flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-violet-600/30 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : (
                            <>
                                <MdSave size={20} className="group-hover:rotate-12 transition-transform" />
                                Update Profile
                            </>
                        )}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column - Photo & Core Info */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Photo Upload */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={sectionClasses}
                    >
                        <div className="flex flex-col items-center text-center">
                            <label className="relative group cursor-pointer group mb-6">
                                <div className="w-44 h-44 rounded-[48px] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-violet-500/20">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <MdPhotoCamera size={48} className="opacity-20" />
                                            <span className="text-[10px] font-black uppercase">Change Photo</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-violet-600 text-white p-3 rounded-2xl shadow-xl group-hover:scale-110 transition-transform">
                                    <MdCloudUpload size={20} />
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white italic uppercase mb-1">Profile Picture</h3>
                            <p className="text-xs text-slate-500 font-medium">Click to update</p>
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
                                <MdPerson />
                            </span>
                            Basic Identity
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className={labelClasses}>Gender</label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
                                    {['Male', 'Female'].map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gender: g })}
                                            className={`py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${formData.gender === g
                                                ? 'bg-white dark:bg-slate-900 text-violet-600 shadow-sm'
                                                : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={labelClasses}>Date of Birth</label>
                                <input
                                    type="date"
                                    value={formData.dob}
                                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>Father&apos;s / Husband Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Shyam Kumar"
                                    value={formData.father_name}
                                    onChange={e => setFormData({ ...formData, father_name: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>
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
                                <MdWork size={20} />
                            </span>
                            Employment & Salary
                        </h3>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Full Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Ramesh Kumar"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="98765 43210"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>Role / Designation</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sales Executive"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>

                            <div className="md:col-span-2 grid md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800">
                                <div>
                                    <label className={labelClasses}>
                                        <MdPayments size={14} className="text-green-500" />
                                        Monthly Salary (₹)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="15000"
                                        value={formData.salary}
                                        onChange={e => setFormData({ ...formData, salary: e.target.value })}
                                        className={inputClasses}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>
                                        <MdAccessTime size={14} className="text-orange-500" />
                                        Half Day (₹)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="250"
                                        value={formData.half_day_salary}
                                        onChange={e => setFormData({ ...formData, half_day_salary: e.target.value })}
                                        className={inputClasses}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>
                                        <MdAccessTime size={14} className="text-violet-500" />
                                        Overtime / Hr (₹)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="100"
                                        value={formData.overtime_rate}
                                        onChange={e => setFormData({ ...formData, overtime_rate: e.target.value })}
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClasses}>Joining Date</label>
                                <input
                                    type="date"
                                    value={formData.joining_date}
                                    onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>WhatsApp Number</label>
                                <input
                                    type="tel"
                                    placeholder="Same as phone"
                                    value={formData.whatsapp_phone}
                                    onChange={e => setFormData({ ...formData, whatsapp_phone: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>
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
                                <MdBadge size={20} />
                            </span>
                            Identity & KYC (India)
                        </h3>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <label className={labelClasses}>Aadhaar Card Number</label>
                                <input
                                    type="text"
                                    placeholder="#### #### ####"
                                    value={formData.aadhaar_number}
                                    onChange={e => setFormData({ ...formData, aadhaar_number: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>PAN Card Number</label>
                                <input
                                    type="text"
                                    placeholder="ABCDE1234F"
                                    value={formData.pan_number}
                                    onChange={e => setFormData({ ...formData, pan_number: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClasses}>
                                    <MdLocationOn size={14} className="text-red-500" />
                                    Full Address
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Street, Landmark, City, State, Pincode"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className={inputClasses + " resize-none"}
                                />
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
                                <MdAccountBalance size={20} />
                            </span>
                            Bank Details (Salary Settlement)
                        </h3>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Bank Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. State Bank of India"
                                    value={formData.bank_name}
                                    onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Account Number</label>
                                <input
                                    type="text"
                                    placeholder="987654321012"
                                    value={formData.account_number}
                                    onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>IFSC Code</label>
                                <input
                                    type="text"
                                    placeholder="SBIN0001234"
                                    value={formData.ifsc_code}
                                    onChange={e => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </form>
        </div>
    )
}
