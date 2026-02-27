'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
    IoPrint,
    IoGrid,
    IoCheckmarkCircle,
    IoEye,
    IoEyeOff,
    IoSync,
    IoBuild,
    IoQrCode,
    IoDocument,
    IoPencil,
    IoSettings,
    IoCheckmark
} from 'react-icons/io5'
import { FaTruck, FaSave, FaUniversity } from 'react-icons/fa'

const templates = [
    {
        id: 'modern',
        name: 'Modern Template',
        description: 'Clean and minimal design with focus on readability.',
        preview: 'bg-slate-50 border-blue-500'
    },
    {
        id: 'professional',
        name: 'Professional Template',
        description: 'Corporate style layout with detailed header and footer.',
        preview: 'bg-white border-slate-200'
    },
    {
        id: 'compact',
        name: 'Compact Template',
        description: 'Dense layout designed to save paper for large orders.',
        preview: 'bg-slate-100 border-slate-300'
    }
]

const paperSizes = [
    { id: 'a4', name: 'A4', width: '210mm', height: '297mm', description: 'Standard office paper' },
    { id: 'a5', name: 'A5', width: '148mm', height: '210mm', description: 'Half letter size' },
    { id: 'thermal_2', name: '2" Thermal', width: '58mm', height: 'Variable', description: 'Small retail receipts' },
    { id: 'thermal_3', name: '3" Thermal', width: '80mm', height: 'Variable', description: 'Standard thermal printer' },
]

export default function PrintSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        print_template: 'modern',
        paper_size: 'a4',
        show_transport: true,
        show_installation: true,
        show_bank_details: true,
        show_upi_qr: true,
        show_terms: true,
        show_signature: true,
        show_custom_fields: true,
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('profiles')
                .select('print_template, paper_size, show_transport, show_installation, show_bank_details, show_upi_qr, show_terms, show_signature, show_custom_fields')
                .eq('id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            if (data) {
                setSettings({
                    print_template: data.print_template || 'modern',
                    paper_size: data.paper_size || 'a4',
                    show_transport: data.show_transport ?? true,
                    show_installation: data.show_installation ?? true,
                    show_bank_details: data.show_bank_details ?? true,
                    show_upi_qr: data.show_upi_qr ?? true,
                    show_terms: data.show_terms ?? true,
                    show_signature: data.show_signature ?? true,
                    show_custom_fields: data.show_custom_fields ?? true,
                })
            }
        } catch (error: unknown) {
            console.error('Error loading settings:', error);
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error('Failed to load settings')
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('profiles')
                .update(settings)
                .eq('id', user.id)

            if (error) {
                if (error.code === '42703') {
                    throw new Error('Database schema update required. Please run the print settings migration SQL.')
                }
                throw error
            }
            toast.success('Print settings saved successfully')
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error('Failed to save settings')
            }
        } finally {
            setSaving(false)
        }
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
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600">
                            <IoPrint size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Print Settings</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed">Customize how your invoices and quotations look when printed.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                >
                    {saving ? <IoSync size={20} className="animate-spin" /> : <FaSave size={20} strokeWidth={3} />}
                    {saving ? 'SAVING...' : 'SAVE SETTINGS'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* TEMPLATE SELECTION */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Paper Size */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden p-6">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                            <IoPrint size={16} className="text-blue-500" />
                            Paper Size
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {paperSizes.map((size) => (
                                <button
                                    key={size.id}
                                    onClick={() => setSettings({ ...settings, paper_size: size.id })}
                                    className={`relative p-4 rounded-2xl border-2 transition-all text-left ${settings.paper_size === size.id
                                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                                        : 'border-slate-100 dark:border-white/5 hover:border-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <h3 className="font-bold text-slate-900 dark:text-white">{size.name}</h3>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{size.width} × {size.height}</p>
                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">{size.description}</p>

                                    {settings.paper_size === size.id && (
                                        <div className="absolute top-2 right-2 text-blue-600">
                                            <IoCheckmarkCircle size={18} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Template Selection */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden p-6">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                            <IoGrid size={16} className="text-blue-500" />
                            Select Print Template
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => setSettings({ ...settings, print_template: template.id })}
                                    className={`relative p-4 rounded-2xl border-2 transition-all text-left group ${settings.print_template === template.id
                                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                                        : 'border-slate-100 dark:border-white/5 hover:border-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className={`w-full aspect-3/4 rounded-lg mb-3 border border-dashed ${template.preview} flex items-center justify-center`}>
                                        <IoPrint size={24} className="text-slate-300 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{template.name}</h3>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{template.description}</p>

                                    {settings.print_template === template.id && (
                                        <div className="absolute top-2 right-2 text-blue-600">
                                            <IoCheckmarkCircle size={18} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* VISIBILITY TOGGLES */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden p-6">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                            <IoSettings size={16} className="text-blue-500" />
                            Field Customization
                        </h2>

                        <div className="space-y-4">
                            <ToggleField
                                icon={<FaTruck size={16} />}
                                label="Transport Charges"
                                active={settings.show_transport}
                                onChange={(v) => setSettings({ ...settings, show_transport: v })}
                            />
                            <ToggleField
                                icon={<IoBuild size={16} />}
                                label="Installation Charges"
                                active={settings.show_installation}
                                onChange={(v) => setSettings({ ...settings, show_installation: v })}
                            />
                            <ToggleField
                                icon={<FaUniversity size={16} />}
                                label="Bank Details"
                                active={settings.show_bank_details}
                                onChange={(v) => setSettings({ ...settings, show_bank_details: v })}
                            />
                            <ToggleField
                                icon={<IoQrCode size={16} />}
                                label="UPI QR Code"
                                active={settings.show_upi_qr}
                                onChange={(v) => setSettings({ ...settings, show_upi_qr: v })}
                            />
                            <ToggleField
                                icon={<IoDocument size={16} />}
                                label="Terms & Conditions"
                                active={settings.show_terms}
                                onChange={(v) => setSettings({ ...settings, show_terms: v })}
                            />
                            <ToggleField
                                icon={<IoPencil size={16} />}
                                label="Business Signature"
                                active={settings.show_signature}
                                onChange={(v) => setSettings({ ...settings, show_signature: v })}
                            />
                            <ToggleField
                                icon={<IoSettings size={16} />}
                                label="Custom Fields"
                                active={settings.show_custom_fields}
                                onChange={(v) => setSettings({ ...settings, show_custom_fields: v })}
                            />
                        </div>
                    </div>

                    <div className="bg-blue-600 dark:bg-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-600/20">
                        <div className="flex items-center gap-3 mb-3">
                            <IoEye size={20} className="text-blue-200" />
                            <h3 className="font-bold uppercase tracking-widest text-[10px]">Live Preview</h3>
                        </div>
                        <p className="text-xs text-blue-100 leading-relaxed font-medium">
                            Changes saved here will immediately reflect in the print view of your Invoices and Quotations.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ToggleField({ icon, label, active, onChange }: { icon: React.ReactNode, label: string, active: boolean, onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!active)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${active
                ? 'bg-blue-600/5 dark:bg-blue-600/10 border-blue-600/20 text-blue-600 dark:text-blue-400'
                : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-white/5 dark:border-white/5 dark:text-slate-500'
                }`}
        >
            <div className="flex items-center gap-3 font-bold text-xs uppercase tracking-widest">
                {icon}
                <span>{label}</span>
            </div>
            {active ? <IoEye size={18} /> : <IoEyeOff size={18} />}
        </button>
    )
}
