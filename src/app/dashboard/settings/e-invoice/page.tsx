'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { IoSave, IoSync, IoKey, IoBusiness, IoShield, IoCheckmarkCircle, IoCloseCircle, IoAlertCircle, IoRefresh } from 'react-icons/io5'

export default function EinvoiceSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [form, setForm] = useState({
        gstin: '',
        username: '',
        password: '',
        client_id: '',
        client_secret: '',
        environment: 'sandbox' as 'sandbox' | 'production',
        is_active: true,
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('einvoice_settings')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (data) {
                setForm({
                    gstin: data.gstin || '',
                    username: data.username || '',
                    password: '',
                    client_id: data.client_id || '',
                    client_secret: '',
                    environment: data.environment || 'sandbox',
                    is_active: data.is_active ?? true,
                })
            }
        } catch (error: any) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    async function saveSettings(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Check if settings exist
            const { data: existing } = await supabase
                .from('einvoice_settings')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (existing) {
                const { error } = await supabase
                    .from('einvoice_settings')
                    .update({
                        gstin: form.gstin,
                        username: form.username,
                        client_id: form.client_id,
                        environment: form.environment,
                        is_active: form.is_active,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('einvoice_settings')
                    .insert({
                        user_id: user.id,
                        gstin: form.gstin,
                        username: form.username,
                        client_id: form.client_id,
                        environment: form.environment,
                        is_active: form.is_active,
                    })

                if (error) throw error
            }

            toast.success('E-Invoice settings saved successfully')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    async function testConnection() {
        setTesting(true)
        
        // Simulate API test
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        toast.success('Connection test successful! (Demo Mode)')
        setTesting(false)
    }

    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-600/10 rounded-2xl flex items-center justify-center">
                    <IoBusiness className="text-green-600" size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">E-Invoice Settings</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Configure GSTN credentials for e-invoice generation</p>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <IoAlertCircle className="text-blue-600 mt-1" size={24} />
                    <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100">E-Invoice Registration Required</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            To generate e-invoices, you must register on the GSTN portal (einvoice.gst.gov.in) and obtain API credentials.
                            Use sandbox mode for testing before going to production.
                        </p>
                    </div>
                </div>
            </div>

            {/* Settings Form */}
            <form onSubmit={saveSettings} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-8 space-y-6">
                    {/* Environment Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Environment</h3>
                            <p className="text-sm text-slate-500">Use sandbox for testing, production for live invoices</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, environment: 'sandbox' })}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    form.environment === 'sandbox' 
                                        ? 'bg-yellow-500 text-white' 
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                            >
                                Sandbox
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, environment: 'production' })}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    form.environment === 'production' 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                            >
                                Production
                            </button>
                        </div>
                    </div>

                    {/* GSTIN */}
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                            <IoKey size={14} className="inline mr-1" />
                            GSTIN *
                        </label>
                        <input
                            type="text"
                            required
                            value={form.gstin}
                            onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-green-600/20 outline-none font-mono"
                            placeholder="29AABCS1234A1Z5"
                            maxLength={15}
                        />
                    </div>

                    {/* Username & Password */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                GSTN Username *
                            </label>
                            <input
                                type="text"
                                required
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-green-600/20 outline-none"
                                placeholder="your_gstn_username"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-green-600/20 outline-none"
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-slate-400 mt-1">Leave blank to keep existing password</p>
                        </div>
                    </div>

                    {/* Client ID & Secret */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                Client ID
                            </label>
                            <input
                                type="text"
                                value={form.client_id}
                                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-green-600/20 outline-none font-mono"
                                placeholder="YOUR_CLIENT_ID"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                Client Secret
                            </label>
                            <input
                                type="password"
                                value={form.client_secret}
                                onChange={(e) => setForm({ ...form, client_secret: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-green-600/20 outline-none font-mono"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <IoShield className="text-green-600" size={24} />
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Enable E-Invoice</h3>
                                <p className="text-sm text-slate-500">Generate IRN for invoices automatically</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, is_active: !form.is_active })}
                            className={`w-14 h-8 rounded-full transition-colors ${form.is_active ? 'bg-green-600' : 'bg-slate-300'}`}
                        >
                            <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${form.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                    <button
                        type="button"
                        onClick={testConnection}
                        disabled={testing || !form.gstin}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm transition-all hover:bg-slate-300 disabled:opacity-50"
                    >
                        {testing ? <IoRefresh size={18} className="animate-spin" /> : <IoCheckmarkCircle size={18} />}
                        {testing ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-green-600/20 disabled:opacity-50"
                    >
                        {saving ? <IoSync size={18} className="animate-spin" /> : <IoSave size={18} />}
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    )
}
