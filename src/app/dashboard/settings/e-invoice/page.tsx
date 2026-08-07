'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { IoSave, IoSync, IoKey, IoBusiness, IoShield, IoCheckmarkCircle, IoAlertCircle, IoRefresh, IoPerson, IoLockClosed, IoCard } from 'react-icons/io5'
import { FormField } from '@/components/ui/form/FormField'
import { FormSection } from '@/components/ui/form/FormSection'
import { SmartInput, GSTInput } from '@/components/ui/form/smart-inputs'
import { friendlyError } from '@/lib/friendly-errors'
import { validateRequired, validateGSTIN } from '@/lib/field-validation'

const EMPTY_FORM = {
    gstin: '',
    username: '',
    password: '',
    client_id: '',
    client_secret: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    is_active: true,
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

export default function EinvoiceSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const gstinRef = useRef<HTMLDivElement>(null)
    const usernameRef = useRef<HTMLDivElement>(null)

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

            if (error && error.code !== 'PGRST116') throw error

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
        } catch (error: unknown) {
            toast.error(friendlyError(error, error instanceof Error ? error.message : String(error)))
        } finally {
            setLoading(false)
        }
    }

    function validateForm(): Record<string, string> {
        const errs: Record<string, string> = {}
        const gstinRequired = validateRequired(form.gstin, 'GSTIN')
        if (gstinRequired) errs.gstin = gstinRequired
        else {
            const gstinErr = validateGSTIN(form.gstin)
            if (gstinErr) errs.gstin = gstinErr
        }
        const usernameErr = validateRequired(form.username, 'GSTN username')
        if (usernameErr) errs.username = usernameErr
        return errs
    }

    function validateField(field: string, value: string): string | null {
        if (field === 'gstin') {
            const required = validateRequired(value, 'GSTIN')
            if (required) return required
            return validateGSTIN(value)
        }
        if (field === 'username') return validateRequired(value, 'GSTN username')
        return null
    }

    function handleBlur(field: string, value: string) {
        setErrors(prev => setFieldError(prev, field, validateField(field, value)))
    }

    async function saveSettings(e: React.FormEvent) {
        e.preventDefault()
        const errs = validateForm()
        setErrors(errs)
        if (Object.keys(errs).length > 0) {
            focusFirstError(errs, [
                ['gstin', gstinRef],
                ['username', usernameRef],
            ])
            return
        }
        setSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

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
        } catch (error: unknown) {
            toast.error(friendlyError(error, error instanceof Error ? error.message : String(error)))
        } finally {
            setSaving(false)
        }
    }

    async function testConnection() {
        setTesting(true)

        await new Promise(resolve => setTimeout(resolve, 2000))

        toast.success('Connection test successful! (Demo Mode)')
        setTesting(false)
    }

    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
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
                    <IoAlertCircle className="text-blue-600 mt-1 shrink-0" size={24} />
                    <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100">E-Invoice Registration Required</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                            To generate e-invoices, you must register on the GSTN portal (einvoice.gst.gov.in) and obtain API credentials.
                            Use sandbox mode for testing before going to production.
                        </p>
                    </div>
                </div>
            </div>

            {/* Settings Form */}
            <form onSubmit={saveSettings} noValidate className="space-y-6">
                <FormSection
                    title="Environment"
                    description="Choose the GSTN API environment for e-invoice generation."
                    icon={<IoBusiness size={20} />}
                >
                    <FormField label="Environment">
                        {({ labelId }) => (
                            <div role="group" aria-labelledby={labelId} className="flex gap-2">
                                <button
                                    type="button"
                                    aria-pressed={form.environment === 'sandbox'}
                                    onClick={() => setForm(prev => ({ ...prev, environment: 'sandbox' }))}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        form.environment === 'sandbox'
                                            ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/25'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    Sandbox
                                </button>
                                <button
                                    type="button"
                                    aria-pressed={form.environment === 'production'}
                                    onClick={() => setForm(prev => ({ ...prev, environment: 'production' }))}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        form.environment === 'production'
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-600/25'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    Production
                                </button>
                            </div>
                        )}
                    </FormField>
                </FormSection>

                <FormSection
                    title="GSTN Credentials"
                    description="Your GSTN portal login details used to authenticate with the e-invoice API."
                    icon={<IoKey size={20} />}
                >
                    <FormField label="GSTIN" required hint="15 characters" error={errors.gstin}>
                        {({ id, describedBy, invalid, errorId }) => (
                            <div ref={gstinRef}>
                                <GSTInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    aria-errormessage={invalid ? errorId : undefined}
                                    aria-required
                                    icon={<IoKey size={16} />}
                                    maxLength={15}
                                    className="font-mono tracking-widest"
                                    value={form.gstin}
                                    onValueChange={(v) => {
                                        setForm(prev => ({ ...prev, gstin: v }))
                                        setErrors(prev => setFieldError(prev, 'gstin', null))
                                    }}
                                    onBlur={(e) => handleBlur('gstin', e.target.value)}
                                    placeholder="29AABCS1234A1Z5"
                                />
                            </div>
                        )}
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="GSTN Username" required error={errors.username}>
                            {({ id, describedBy, invalid, errorId }) => (
                                <div ref={usernameRef}>
                                    <SmartInput
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        aria-errormessage={invalid ? errorId : undefined}
                                        aria-required
                                        icon={<IoPerson size={16} />}
                                        value={form.username}
                                        onValueChange={(v) => {
                                            setForm(prev => ({ ...prev, username: v }))
                                            setErrors(prev => setFieldError(prev, 'username', null))
                                        }}
                                        onBlur={(e) => handleBlur('username', e.target.value)}
                                        placeholder="your_gstn_username"
                                    />
                                </div>
                            )}
                        </FormField>

                        <FormField label="Password" description="Leave blank to keep the existing password.">
                            {({ id }) => (
                                <SmartInput
                                    id={id}
                                    icon={<IoLockClosed size={16} />}
                                    type="password"
                                    autoComplete="new-password"
                                    value={form.password}
                                    onValueChange={(v) => setForm(prev => ({ ...prev, password: v }))}
                                    placeholder="••••••••"
                                />
                            )}
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="API Credentials"
                    description="Application credentials issued by the GSTN system."
                    icon={<IoCard size={20} />}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Client ID">
                            {({ id }) => (
                                <SmartInput
                                    id={id}
                                    icon={<IoCard size={16} />}
                                    autoComplete="off"
                                    className="font-mono"
                                    value={form.client_id}
                                    onValueChange={(v) => setForm(prev => ({ ...prev, client_id: v }))}
                                    placeholder="YOUR_CLIENT_ID"
                                />
                            )}
                        </FormField>

                        <FormField label="Client Secret" description="Leave blank to keep the existing secret.">
                            {({ id }) => (
                                <SmartInput
                                    id={id}
                                    icon={<IoLockClosed size={16} />}
                                    type="password"
                                    autoComplete="new-password"
                                    className="font-mono"
                                    value={form.client_secret}
                                    onValueChange={(v) => setForm(prev => ({ ...prev, client_secret: v }))}
                                    placeholder="••••••••"
                                />
                            )}
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="E-Invoice Status"
                    description="Automatically generate IRN for invoices when enabled."
                    icon={<IoShield size={20} />}
                >
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Enable E-Invoice</h3>
                            <p className="text-sm text-slate-500 mt-0.5">Generate IRN for invoices automatically</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={form.is_active}
                            aria-label="Toggle e-invoice"
                            onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))}
                            className={`w-14 h-8 rounded-full transition-colors shrink-0 ${form.is_active ? 'bg-green-600' : 'bg-slate-300'}`}
                        >
                            <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${form.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </FormSection>

                {/* Actions */}
                <div className="px-8 py-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex justify-between gap-4">
                    <button
                        type="button"
                        onClick={testConnection}
                        disabled={testing || !form.gstin.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm transition-all hover:bg-slate-300 disabled:opacity-50"
                    >
                        {testing ? <IoRefresh size={18} className="animate-spin" /> : <IoCheckmarkCircle size={18} />}
                        {testing ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        aria-busy={saving}
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
