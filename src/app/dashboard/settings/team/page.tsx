'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { IoAdd, IoPeople, IoMail, IoShield, IoTrash, IoCreate, IoPersonAdd, IoCheckmarkCircle, IoCloseCircle, IoTime, IoSearch, IoLockClosed, IoKey } from 'react-icons/io5'
import { FaUserPlus } from 'react-icons/fa'

const roleConfig: Record<string, { label: string; color: string }> = {
    admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
    manager: { label: 'Manager', color: 'bg-indigo-100 text-indigo-700' },
    team_member: { label: 'Staff', color: 'bg-blue-100 text-blue-700' },
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: IoCheckmarkCircle },
    inactive: { label: 'Disabled', color: 'bg-red-100 text-red-700', icon: IoCloseCircle },
}

export default function TeamSettingsPage() {
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [form, setForm] = useState({
        login_email: '',
        name: '',
        hierarchy_role: 'team_member' as 'admin' | 'manager' | 'team_member',
        login_pin: '',
        phone: '',
    })

    useEffect(() => {
        fetchMembers()
    }, [])

    async function fetchMembers() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Fetch from staff_members as per WEXO Hierarchy Docs
            const { data, error } = await supabase
                .from('staff_members')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setMembers(data || [])
        } catch (error: any) {
            console.error('Fetch Error:', error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function addStaff(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // 1. Create a Supabase Auth user for this staff if they don't have one
            // Note: In a client-side app, we can't create users directly without admin keys.
            // But we can insert into staff_members table and the auth loop will handle them
            // when they try to login with email/pin (which we'll use a specific logic for).

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
            setForm({ login_email: '', name: '', hierarchy_role: 'team_member', login_pin: '', phone: '' })
            fetchMembers()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
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
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredMembers = members.filter(m => 
        m.login_email?.toLowerCase().includes(search.toLowerCase()) ||
        m.name?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                    onClick={() => setShowModal(true)}
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
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-black text-slate-600 dark:text-slate-400">
                                            {member.name?.[0] || 'S'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900 dark:text-white">{member.name}</h3>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${role.color}`}>
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

                                    <div className="flex items-center gap-4">
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
                                            onClick={() => {
                                                if(confirm('Are you sure you want to remove this staff member?')) {
                                                    supabase.from('staff_members').delete().eq('id', member.id).then(() => fetchMembers())
                                                }
                                            }}
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
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Add New Staff</h2>
                            <p className="text-slate-500 text-sm mb-6">Create a workforce account with PIN access</p>
                            
                            <form onSubmit={addStaff} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600/20"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Login Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={form.login_email}
                                            onChange={(e) => setForm({ ...form, login_email: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600/20"
                                            placeholder="john@staff.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Mobile Number</label>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600/20"
                                            placeholder="+91 98765..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Hierarchy Role</label>
                                        <select
                                            value={form.hierarchy_role}
                                            onChange={(e) => setForm({ ...form, hierarchy_role: e.target.value as any })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 appearance-none"
                                        >
                                            <option value="team_member">Team Member</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Access PIN (6 Digit)</label>
                                        <input
                                            type="password"
                                            required
                                            maxLength={6}
                                            value={form.login_pin}
                                            onChange={(e) => setForm({ ...form, login_pin: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600/20"
                                            placeholder="123456"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-black text-sm uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        {saving ? 'Adding...' : 'Save Staff'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
