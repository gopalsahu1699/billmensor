'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { toast } from 'sonner'
import {
    Building2,
    Phone,
    Mail,
    Globe,
    MapPin,
    FileText,
    CreditCard,
    Landmark,
    Upload,
    Shield,
    Save,
    Loader2,
    BadgeCheck,
    Briefcase,
    Factory,
    Hash,
    Smartphone,
    BookOpen,
    Layout
} from 'lucide-react'

export default function AccountSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [bankSaving, setBankSaving] = useState(false)
    const [profileId, setProfileId] = useState<string | null>(null)

    /* ----------- COMPANY STATE ----------- */
    const [profile, setProfile] = useState({
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
    })

    /* ----------- BANK STATE ----------- */
    const [bank, setBank] = useState({
        account_number: '',
        account_holder_name: '',
        ifsc_code: '',
        bank_branch_name: '',
        upi_id: '',
    })

    /* ----------- LOAD DATA ----------- */
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
                setProfileId(data.id)
                setProfile({
                    company_name: data.company_name || '',
                    full_name: data.full_name || '',
                    designation: data.designation || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    address: data.address || '',
                    gstin: data.gstin || '',
                    website: data.website || '',
                    business_type: data.business_type || '',
                    industry_type: data.industry_type || '',
                    place_of_supply: data.place_of_supply || '',
                    terms_and_conditions: data.terms_and_conditions || '',
                    logo_url: data.logo_url || '',
                    signature_url: data.signature_url || '',
                    custom_field_1_label: data.custom_field_1_label || '',
                    custom_field_1_value: data.custom_field_1_value || '',
                    custom_field_2_label: data.custom_field_2_label || '',
                    custom_field_2_value: data.custom_field_2_value || '',
                    custom_field_3_label: data.custom_field_3_label || '',
                    custom_field_3_value: data.custom_field_3_value || '',
                })

                // Load bank details
                const { data: bankData } = await supabase
                    .from('company_bank_details')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

                if (bankData) {
                    setBank({
                        account_number: bankData.account_number || '',
                        account_holder_name: bankData.account_holder_name || '',
                        ifsc_code: bankData.ifsc_code || '',
                        bank_branch_name: bankData.bank_branch_name || '',
                        upi_id: bankData.upi_id || '',
                    })
                }
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    /* ----------- SAVE COMPANY ----------- */
    async function handleSave(e?: React.FormEvent) {
        if (e) e.preventDefault()
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
            toast.success('Settings saved successfully')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    /* ----------- SAVE BANK ----------- */
    async function handleBankSave() {
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

            toast.success('Bank details saved successfully')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setBankSaving(false)
        }
    }

    /* ----------- IMAGE UPLOAD ----------- */
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

            // Save immediately
            await supabase
                .from('profiles')
                .update({ [field]: publicUrl })
                .eq('id', user.id)

            toast.success(`${field === 'logo_url' ? 'Logo' : 'Signature'} uploaded successfully`)
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    /* ----------- UI HELPERS ----------- */
    const indianStates = [
        { code: '01', name: 'Jammu & Kashmir' },
        { code: '02', name: 'Himachal Pradesh' },
        { code: '03', name: 'Punjab' },
        { code: '04', name: 'Chandigarh' },
        { code: '05', name: 'Uttarakhand' },
        { code: '06', name: 'Haryana' },
        { code: '07', name: 'Delhi' },
        { code: '08', name: 'Rajasthan' },
        { code: '09', name: 'Uttar Pradesh' },
        { code: '10', name: 'Bihar' },
        { code: '11', name: 'Sikkim' },
        { code: '12', name: 'Arunachal Pradesh' },
        { code: '13', name: 'Nagaland' },
        { code: '14', name: 'Manipur' },
        { code: '15', name: 'Mizoram' },
        { code: '16', name: 'Tripura' },
        { code: '17', name: 'Meghalaya' },
        { code: '18', name: 'Assam' },
        { code: '19', name: 'West Bengal' },
        { code: '20', name: 'Jharkhand' },
        { code: '21', name: 'Odisha' },
        { code: '22', name: 'Chhattisgarh' },
        { code: '23', name: 'Madhya Pradesh' },
        { code: '24', name: 'Gujarat' },
        { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
        { code: '27', name: 'Maharashtra' },
        { code: '29', name: 'Karnataka' },
        { code: '30', name: 'Goa' },
        { code: '31', name: 'Lakshadweep' },
        { code: '32', name: 'Kerala' },
        { code: '33', name: 'Tamil Nadu' },
        { code: '34', name: 'Puducherry' },
        { code: '35', name: 'Andaman & Nicobar Islands' },
        { code: '36', name: 'Telangana' },
        { code: '37', name: 'Andhra Pradesh' },
        { code: '38', name: 'Ladakh' },
    ]

    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600">
                            <Building2 size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed">Manage your business profile and custom print fields.</p>
                </div>
                <button
                    onClick={() => handleSave()}
                    disabled={saving}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} strokeWidth={3} />}
                    {saving ? 'SAVING...' : 'SAVE ALL'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT COLUMN */}
                <div className="space-y-8">
                    {/* Company Information Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <Building2 size={16} className="text-blue-500" />
                                Company Information
                            </h2>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Logo & Signature */}
                            <div className="flex gap-4">
                                <label className="w-28 h-28 bg-slate-50 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center text-xs cursor-pointer overflow-hidden border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-blue-500/50 transition-all group">
                                    {profile.logo_url ? (
                                        <img src={profile.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <>
                                            <Upload size={20} className="text-slate-400 group-hover:text-blue-500 mb-1 transition-colors" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo_url')} />
                                </label>
                                <label className="w-28 h-28 bg-slate-50 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center text-xs cursor-pointer overflow-hidden border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-blue-500/50 transition-all group">
                                    {profile.signature_url ? (
                                        <img src={profile.signature_url} alt="Signature" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <>
                                            <Upload size={20} className="text-slate-400 group-hover:text-blue-500 mb-1 transition-colors" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signature</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'signature_url')} />
                                </label>
                            </div>

                            {/* Field Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SettingsField icon={<Building2 size={16} />} label="Company Name">
                                    <input
                                        className="settings-input"
                                        value={profile.company_name}
                                        onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                                        placeholder="e.g. Billmensor Solutions Pvt Ltd"
                                    />
                                </SettingsField>

                                <SettingsField icon={<BadgeCheck size={16} />} label="Owner / Contact Name">
                                    <input
                                        className="settings-input"
                                        value={profile.full_name}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        placeholder="Full name"
                                    />
                                </SettingsField>

                                <SettingsField icon={<Phone size={16} />} label="Phone Number">
                                    <input
                                        className="settings-input"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        placeholder="+91 00000 00000"
                                    />
                                </SettingsField>

                                <SettingsField icon={<Mail size={16} />} label="Email Address">
                                    <input
                                        className="settings-input"
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        placeholder="hello@company.com"
                                    />
                                </SettingsField>
                            </div>

                            <SettingsField icon={<MapPin size={16} />} label="Registered Address">
                                <textarea
                                    className="settings-input min-h-[100px] py-3"
                                    value={profile.address}
                                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                    placeholder="Complete street address, city, state, PIN code..."
                                />
                            </SettingsField>
                        </div>
                    </div>

                    {/* Custom Fields Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <Layout size={16} className="text-blue-500" />
                                Custom Print Fields
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <p className="text-xs text-slate-500 font-medium italic">These fields will appear on your printed invoices and quotations.</p>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <SettingsField icon={<Hash size={14} />} label="Field 1 Label">
                                        <input
                                            className="settings-input"
                                            value={profile.custom_field_1_label}
                                            onChange={(e) => setProfile({ ...profile, custom_field_1_label: e.target.value })}
                                            placeholder="e.g. Vehicle No."
                                        />
                                    </SettingsField>
                                    <SettingsField icon={<Layout size={14} />} label="Field 1 Value">
                                        <input
                                            className="settings-input"
                                            value={profile.custom_field_1_value}
                                            onChange={(e) => setProfile({ ...profile, custom_field_1_value: e.target.value })}
                                            placeholder="e.g. MH 12 AB 1234"
                                        />
                                    </SettingsField>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <SettingsField icon={<Hash size={14} />} label="Field 2 Label">
                                        <input
                                            className="settings-input"
                                            value={profile.custom_field_2_label}
                                            onChange={(e) => setProfile({ ...profile, custom_field_2_label: e.target.value })}
                                            placeholder="e.g. PAN No."
                                        />
                                    </SettingsField>
                                    <SettingsField icon={<Layout size={14} />} label="Field 2 Value">
                                        <input
                                            className="settings-input"
                                            value={profile.custom_field_2_value}
                                            onChange={(e) => setProfile({ ...profile, custom_field_2_value: e.target.value })}
                                            placeholder="ABCDE1234F"
                                        />
                                    </SettingsField>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <SettingsField icon={<Hash size={14} />} label="Field 3 Label">
                                        <input
                                            className="settings-input"
                                            value={profile.custom_field_3_label}
                                            onChange={(e) => setProfile({ ...profile, custom_field_3_label: e.target.value })}
                                            placeholder="e.g. DL No."
                                        />
                                    </SettingsField>
                                    <SettingsField icon={<Layout size={14} />} label="Field 3 Value">
                                        <input
                                            className="settings-input"
                                            value={profile.custom_field_3_value}
                                            onChange={(e) => setProfile({ ...profile, custom_field_3_value: e.target.value })}
                                            placeholder="Enter Value"
                                        />
                                    </SettingsField>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-8">
                    {/* Bank Details Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <Landmark size={16} className="text-green-500" />
                                Bank Details
                            </h2>
                            <button
                                onClick={handleBankSave}
                                disabled={bankSaving}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                            >
                                {bankSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {bankSaving ? 'SAVING...' : 'SAVE BANK'}
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <SettingsField icon={<CreditCard size={16} />} label="Account Number">
                                <input
                                    className="settings-input tracking-widest"
                                    value={bank.account_number}
                                    onChange={(e) => setBank({ ...bank, account_number: e.target.value })}
                                    placeholder="XXXX XXXX XXXX XXXX"
                                />
                            </SettingsField>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SettingsField icon={<BadgeCheck size={16} />} label="Account Holder Name">
                                    <input
                                        className="settings-input"
                                        value={bank.account_holder_name}
                                        onChange={(e) => setBank({ ...bank, account_holder_name: e.target.value })}
                                        placeholder="As per bank records"
                                    />
                                </SettingsField>

                                <SettingsField icon={<Hash size={16} />} label="IFSC Code">
                                    <input
                                        className="settings-input uppercase tracking-widest font-black"
                                        value={bank.ifsc_code}
                                        onChange={(e) => setBank({ ...bank, ifsc_code: e.target.value })}
                                        placeholder="SBIN0001234"
                                    />
                                </SettingsField>
                            </div>

                            <SettingsField icon={<Landmark size={16} />} label="Bank & Branch Name">
                                <input
                                    className="settings-input"
                                    value={bank.bank_branch_name}
                                    onChange={(e) => setBank({ ...bank, bank_branch_name: e.target.value })}
                                    placeholder="e.g. State Bank of India, MG Road Branch"
                                />
                            </SettingsField>

                            <SettingsField icon={<Smartphone size={16} />} label="UPI ID">
                                <input
                                    className="settings-input"
                                    value={bank.upi_id}
                                    onChange={(e) => setBank({ ...bank, upi_id: e.target.value })}
                                    placeholder="business@upi"
                                />
                            </SettingsField>
                        </div>
                    </div>

                    {/* Tax & Compliance Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <Hash size={16} className="text-amber-500" />
                                Tax & Compliance
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SettingsField icon={<FileText size={16} />} label="GSTIN Number">
                                    <input
                                        className="settings-input uppercase tracking-widest font-black"
                                        value={profile.gstin}
                                        onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                                        placeholder="27AAAAA0000A1Z5"
                                    />
                                </SettingsField>

                                <SettingsField icon={<MapPin size={16} />} label="Place of Supply">
                                    <select
                                        className="settings-input"
                                        value={profile.place_of_supply}
                                        onChange={(e) => setProfile({ ...profile, place_of_supply: e.target.value })}
                                    >
                                        <option value="">Select State</option>
                                        {indianStates.map(s => (
                                            <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                                        ))}
                                    </select>
                                </SettingsField>
                            </div>
                        </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={16} className="text-orange-500" />
                                Terms & Conditions
                            </h2>
                        </div>
                        <div className="p-6">
                            <textarea
                                rows={6}
                                className="settings-input min-h-[160px] py-3"
                                value={profile.terms_and_conditions}
                                onChange={(e) => setProfile({ ...profile, terms_and_conditions: e.target.value })}
                                placeholder="Enter terms and conditions that will appear on your invoices..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Footer */}
            <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-8 border border-slate-800 dark:border-white/5 text-white flex items-center gap-6 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-yellow-500 shrink-0">
                    <Shield size={28} />
                </div>
                <div>
                    <h4 className="text-sm font-black uppercase tracking-widest">Encrypted Data Management</h4>
                    <p className="text-slate-400 text-xs mt-1 font-medium leading-relaxed">Your business credentials are used exclusively for invoice generation and tax compliance filing. All data is secured with industry-standard encryption.</p>
                </div>
            </div>

            <style jsx global>{`
                .settings-input {
                    width: 100%;
                    background: rgb(248 250 252);
                    border: none;
                    border-radius: 16px;
                    padding: 12px 16px;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s;
                    font-weight: 600;
                    color: #000000;
                }
                .settings-input::placeholder {
                    color: rgb(148 163 184);
                    font-weight: 500;
                }
                select.settings-input {
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    padding-right: 40px;
                    color: #000000;
                }
                select.settings-input option {
                    color: #000000;
                    background: white;
                }
                textarea.settings-input {
                    resize: vertical;
                    color: #000000;
                }
                .settings-input:focus {
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05);
                    background: white;
                    color: #000000;
                }
                .dark .settings-input {
                    background: rgba(255, 255, 255, 0.03);
                    color: rgb(226 232 240);
                }
                .dark .settings-input::placeholder {
                    color: rgb(100 116 139);
                }
                .dark select.settings-input {
                    color: rgb(226 232 240);
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
                }
                .dark select.settings-input option {
                    color: rgb(226 232 240);
                    background: rgb(30 41 59);
                }
                .dark textarea.settings-input {
                    color: rgb(226 232 240);
                }
                .dark .settings-input:focus {
                    background: rgba(255, 255, 255, 0.06);
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }
            `}</style>
        </div>
    )
}

function SettingsField({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5 group">
            <label className="text-[10px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <span className="text-slate-900 dark:text-slate-300 group-focus-within:text-blue-500 transition-colors">{icon}</span>
                {label}
            </label>
            {children}
        </div>
    )
}
