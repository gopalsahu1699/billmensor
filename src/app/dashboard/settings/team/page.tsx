'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { IoPeople, IoMail, IoShield, IoTrash, IoPersonAdd, IoCheckmarkCircle, IoCloseCircle, IoSearch, IoKey, IoSync } from 'react-icons/io5'
import { FormField } from '@/components/ui/form/FormField'
import { SmartInput, EmailInput, PhoneInput, SmartSelect } from '@/components/ui/form/smart-inputs'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { friendlyError } from '@/lib/friendly-errors'
import { validateRequired, validateEmail, validatePhone } from '@/lib/field-validation'

const roleConfig: Record<string, { label: string; color: string }> = {
    admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
    manager: { label: 'Manager', color: 'bg-indigo-100 text-indigo-700' },
    team_member: { label: 'Staff', color: 'bg-blue-100 text-blue-700' },
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number }> }> = {
    active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: IoCheckmarkCircle },
    inactive: { label: 'Disabled', color: 'bg-red-100 text-red-700', icon: IoCloseCircle },
}

interface StaffMember {
    id: string
    name: string
    login_email?: string
    login_pin?: string
    phone?: string
    hierarchy_role: string
    status: string
}

const EMPTY_FORM = {
    login_email: '',
    name: '',
    hierarchy_role: 'team_member' as 'admin' | 'manager' | 'team_member',
    login_pin: '',
    phone: '',
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

function validatePin(value: string): string | null {
    const pin = value.trim()
    if (!pin) return null
    if (!/^\d{6}$/.test(pin)) return 'Access PIN must be exactly 6 digits.'
    return null
}

export default function TeamSettingsPage() {
    const [members, setMembers] = useState<StaffMember[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [form, setForm] = useState(EMPTY_FORM)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null)
    const [deleting, setDeleting] = useState(false)

    const nameRef = useRef<HTMLDivElement>(null)
    const emailRef = useRef<HTMLDivElement>(null)
    const pinRef = useRef<HTMLDivElement>(null)
    const phoneRef = useRef<HTMLDivElement>(null)

    const modalTitleId = 'add-staff-modal-title'

    useEffect(() => {
        fetchMembers()
    }, [])

    useEffect(() => {
        if (showModal) {
            nameRef.current?.querySelector('input')?.focus()
        }
    }, [showModal])

    useEffect(() => {
        if (!showModal) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !saving) {
                e.preventDefault()
                setShowModal(false)
                resetForm()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [showModal, saving])

    async function fetchMembers() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('staff_members')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setMembers(data || [])
        } catch (error: unknown) {
            toast.error(friendlyError(error, error instanceof Error ? error.message : String(error)))
        } finally {
            setLoading(false)
        }
    }

    function validateForm(): Record<string, string> {
        const errs: Record<string, string> = {}
        const nameErr = validateRequired(form.name, 'Full name')
        if (nameErr) errs.name = nameErr
        const emailRequired = validateRequired(form.login_email, 'Login email')
        if (emailRequired) errs.login_email = emailRequired
        else {
            const emailErr = validateEmail(form.login_email)
            if (emailErr) errs.login_email = emailErr
        }
        const pinRequired = validateRequired(form.login_pin, 'Access PIN')
        if (pinRequired) errs.login_pin = pinRequired
        else {
            const pinErr = validatePin(form.login_pin)
            if (pinErr) errs.login_pin = pinErr
        }
        const phoneErr = validatePhone(form.phone)
        if (phoneErr) errs.phone = phoneErr
        return errs
    }

    function validateField(field: string, value: string): string | null {
        if (field === 'name') return validateRequired(value, 'Full name')
        if (field === 'login_email') {
            const required = validateRequired(value, 'Login email')
            if (required) return required
            return validateEmail(value)
        }
        if (field === 'login_pin') {
            const required = validateRequired(value, 'Access PIN')
            if (required) return required
            return validatePin(value)
        }
        if (field === 'phone') return validatePhone(value)
        return null
    }

    function handleBlur(field: string, value: string) {
        setErrors(prev => setFieldError(prev, field, validateField(field, value)))
    }

    async function addStaff(e: React.FormEvent) {
        e.preventDefault()
        const errs = validateForm()
        setErrors(errs)
        if (Object.keys(errs).length > 0) {
            focusFirstError(errs, [
                ['name', nameRef],
                ['login_email', emailRef],
                ['login_pin', pinRef],
                ['phone', phoneRef],
            ])
            return
        }
        setSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('staff_members')
                .insert({
                    user_id: user.id,
                    name: form.name,
                    phone: form.phone,
                    login_email: form.login_email,
                    login_pin: form.login_pin,
                    hierarchy_role: form.hierarchy_role,
                    status: 'active'
                })

            if (error) throw error

            toast.success('Staff member added successfully')
            setShowModal(false)
            resetForm()
            fetchMembers()
        } catch (error: unknown) {
            toast.error(friendlyError(error, error instanceof Error ? error.message : String(error)))
        } finally {
            setSaving(false)
        }
    }

    function resetForm() {
        setForm(EMPTY_FORM)
        setErrors({})
    }

    async function toggleStatus(id: string, currentStatus: string) {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
            const { error } = await supabase
                .from('staff_members')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error
            toast.success(`Member ${newStatus === 'active' ? 'enabled' : 'disabled'}`)
            fetchMembers()
        } catch (error: unknown) {
            toast.error(friendlyError(error, error instanceof Error ? error.message : String(error)))
        }
    }

    async function confirmDelete() {
        if (!memberToDelete) return
        setDeleting(true)

        try {
            const { error } = await supabase
                .from('staff_members')
                .delete()
                .eq('id', memberToDelete.id)

            if (error) throw error
            toast.success('Staff member removed')
            setMemberToDelete(null)
            fetchMembers()
        } catch (error: unknown) {
            toast.error(friendlyError(error, error instanceof Error ? error.message : String(error)))
        } finally {
            setDeleting(false)
        }
    }

    const filteredMembers = members.filter(m =>
        m.login_email?.toLowerCase().includes(search.toLowerCase()) ||
        m.name?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
                        <IoShield className="text-indigo-600" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Staff Hierarchy</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage workforce logins and PIN access</p>
                    </div>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
                >
                    <IoPersonAdd size={20} />
                    Add Staff
                </button>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            aria-label="Search staff"
                            placeholder="Search staff by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600/20"
                        />
                    </div>
                </div>

                {filteredMembers.length === 0 ? (
                    <div className="py-20 text-center">
                        <IoPeople size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No staff members found</h3>
                        <p className="text-slate-500 mt-1">Assign custom emails and PINs to your workforce</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {filteredMembers.map((member) => {
                            const role = roleConfig[member.hierarchy_role] || roleConfig.team_member
                            const status = statusConfig[member.status] || statusConfig.inactive
                            const StatusIcon = status.icon

                            return (
                                <div key={member.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-black text-slate-600 dark:text-slate-400 shrink-0">
                                            {member.name?.[0] || 'S'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900 dark:text-white truncate">{member.name}</h3>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest shrink-0 ${role.color}`}>
                                                    {role.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                    <IoMail size={12} />
                                                    {member.login_email}
                                                </div>
                                                {member.login_pin && (
                                                    <div className="flex items-center gap-1 text-indigo-500 text-xs font-bold">
                                                        <IoKey size={12} />
                                                        PIN Set
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        <button
                                            onClick={() => toggleStatus(member.id, member.status)}
                                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                                member.status === 'active'
                                                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                                            }`}
                                        >
                                            <StatusIcon size={14} />
                                            {status.label}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMemberToDelete(member)}
                                            aria-label={`Remove ${member.name}`}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <IoTrash size={20} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div role="dialog" aria-modal="true" aria-labelledby={modalTitleId} className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 shadow-2xl">
                        <h2 id={modalTitleId} className="text-xl font-black text-slate-900 dark:text-white mb-2">Add New Staff</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Create a workforce account with PIN access</p>

                        <form onSubmit={addStaff} noValidate className="space-y-4">
                            <FormField label="Full Name" required error={errors.name}>
                                {({ id, describedBy, invalid, errorId }) => (
                                    <div ref={nameRef}>
                                        <SmartInput
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={invalid}
                                            aria-errormessage={invalid ? errorId : undefined}
                                            aria-required
                                            value={form.name}
                                            transform="words"
                                            trimOnBlur
                                            onValueChange={(v) => {
                                                setForm(prev => ({ ...prev, name: v }))
                                                setErrors(prev => setFieldError(prev, 'name', null))
                                            }}
                                            onBlur={(e) => handleBlur('name', e.target.value)}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                )}
                            </FormField>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Login Email" required error={errors.login_email}>
                                    {({ id, describedBy, invalid, errorId }) => (
                                        <div ref={emailRef}>
                                            <EmailInput
                                                id={id}
                                                aria-describedby={describedBy}
                                                aria-invalid={invalid}
                                                aria-errormessage={invalid ? errorId : undefined}
                                                aria-required
                                                value={form.login_email}
                                                onValueChange={(v) => {
                                                    setForm(prev => ({ ...prev, login_email: v }))
                                                    setErrors(prev => setFieldError(prev, 'login_email', null))
                                                }}
                                                onBlur={(e) => handleBlur('login_email', e.target.value)}
                                                placeholder="john@staff.com"
                                            />
                                        </div>
                                    )}
                                </FormField>

                                <FormField label="Mobile Number" error={errors.phone}>
                                    {({ id, describedBy, invalid, errorId }) => (
                                        <div ref={phoneRef}>
                                            <PhoneInput
                                                id={id}
                                                aria-describedby={describedBy}
                                                aria-invalid={invalid}
                                                aria-errormessage={invalid ? errorId : undefined}
                                                value={form.phone}
                                                onValueChange={(v) => {
                                                    setForm(prev => ({ ...prev, phone: v }))
                                                    setErrors(prev => setFieldError(prev, 'phone', null))
                                                }}
                                                onBlur={(e) => handleBlur('phone', e.target.value)}
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>
                                    )}
                                </FormField>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Hierarchy Role">
                                    {({ id }) => (
                                        <SmartSelect
                                            id={id}
                                            value={form.hierarchy_role}
                                            onChange={(e) => setForm(prev => ({ ...prev, hierarchy_role: e.target.value as 'admin' | 'manager' | 'team_member' }))}
                                        >
                                            <option value="team_member">Team Member</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </SmartSelect>
                                    )}
                                </FormField>

                                <FormField label="Access PIN" required hint="6 digits" error={errors.login_pin}>
                                    {({ id, describedBy, invalid, errorId }) => (
                                        <div ref={pinRef}>
                                            <SmartInput
                                                id={id}
                                                aria-describedby={describedBy}
                                                aria-invalid={invalid}
                                                aria-errormessage={invalid ? errorId : undefined}
                                                aria-required
                                                type="password"
                                                inputMode="numeric"
                                                autoComplete="new-password"
                                                maxLength={6}
                                                className="tracking-[0.3em] font-black"
                                                value={form.login_pin}
                                                onValueChange={(v) => {
                                                    setForm(prev => ({ ...prev, login_pin: v.replace(/\D/g, '') }))
                                                    setErrors(prev => setFieldError(prev, 'login_pin', null))
                                                }}
                                                onBlur={(e) => handleBlur('login_pin', e.target.value)}
                                                placeholder="123456"
                                            />
                                        </div>
                                    )}
                                </FormField>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-black text-sm uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    aria-busy={saving}
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                                >
                                    {saving ? <IoSync size={16} className="animate-spin" /> : null}
                                    {saving ? 'Saving...' : 'Save Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={memberToDelete !== null}
                onClose={() => { if (!deleting) setMemberToDelete(null) }}
                onConfirm={confirmDelete}
                loading={deleting}
                title="Remove staff member"
                description={`Remove ${memberToDelete?.name || 'this staff member'}? This action cannot be undone.`}
                confirmLabel="Remove"
                cancelLabel="Cancel"
            />
        </div>
    )
}
