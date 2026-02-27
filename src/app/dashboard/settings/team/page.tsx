'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TeamMember } from '@/types/index'
import { toast } from 'sonner'
import { IoAdd, IoPeople, IoMail, IoShield, IoTrash, IoCreate, IoPersonAdd, IoCheckmarkCircle, IoCloseCircle, IoTime, IoSearch } from 'react-icons/io5'
import { FaUserPlus } from 'react-icons/fa'

const roleConfig: Record<string, { label: string; color: string }> = {
    admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
    staff: { label: 'Staff', color: 'bg-blue-100 text-blue-700' },
    viewer: { label: 'Viewer', color: 'bg-slate-100 text-slate-700' },
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: IoCheckmarkCircle },
    invited: { label: 'Invited', color: 'bg-yellow-100 text-yellow-700', icon: IoTime },
    disabled: { label: 'Disabled', color: 'bg-red-100 text-red-700', icon: IoCloseCircle },
}

export default function TeamSettingsPage() {
    const [members, setMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [form, setForm] = useState({
        email: '',
        name: '',
        role: 'staff' as 'admin' | 'staff' | 'viewer',
    })

    useEffect(() => {
        fetchMembers()
    }, [])

    async function fetchMembers() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setMembers(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function inviteMember(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('team_members')
                .insert({
                    user_id: user.id,
                    owner_id: user.id,
                    email: form.email,
                    name: form.name,
                    role: form.role,
                    status: 'invited'
                })

            if (error) throw error
            toast.success('Invitation sent successfully')
            setShowModal(false)
            setForm({ email: '', name: '', role: 'staff' })
            fetchMembers()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    async function updateStatus(id: string, status: string) {
        try {
            const { error } = await supabase
                .from('team_members')
                .update({ status })
                .eq('id', id)

            if (error) throw error
            toast.success('Member status updated')
            fetchMembers()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    async function removeMember(id: string) {
        if (!confirm('Are you sure you want to remove this team member?')) return

        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Member removed successfully')
            fetchMembers()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredMembers = members.filter(m => 
        m.email.toLowerCase().includes(search.toLowerCase()) ||
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
                    <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center">
                        <IoPeople className="text-blue-600" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Team Members</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your team and permissions</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20"
                >
                    <FaUserPlus size={20} />
                    Invite Member
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none"
                />
            </div>

            {/* Team List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {filteredMembers.length === 0 ? (
                    <div className="py-20 text-center">
                        <IoPeople size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No team members yet</h3>
                        <p className="text-slate-500 mt-1">Invite team members to collaborate</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredMembers.map((member) => {
                            const role = roleConfig[member.role] || roleConfig.staff
                            const status = statusConfig[member.status] || statusConfig.invited
                            const StatusIcon = status.icon

                            return (
                                <div key={member.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                            <span className="text-lg font-bold text-slate-600 dark:text-slate-300">
                                                {member.name?.[0] || member.email[0].toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{member.name || 'Unnamed'}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <IoMail size={14} className="text-slate-400" />
                                                <span className="text-sm text-slate-500">{member.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${role.color}`}>
                                            {role.label}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
                                            <StatusIcon size={14} />
                                            {status.label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {member.status === 'invited' && (
                                                <button
                                                    onClick={() => updateStatus(member.id, 'active')}
                                                    className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors"
                                                    title="Resend invite"
                                                >
                                                    <IoMail size={18} className="text-green-400" />
                                                </button>
                                            )}
                                            {member.status === 'active' && (
                                                <button
                                                    onClick={() => updateStatus(member.id, 'disabled')}
                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                    title="Disable access"
                                                >
                                                    <IoCloseCircle size={18} className="text-red-400" />
                                                </button>
                                            )}
                                            {member.status === 'disabled' && (
                                                <button
                                                    onClick={() => updateStatus(member.id, 'active')}
                                                    className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors"
                                                    title="Enable access"
                                                >
                                                    <IoCheckmarkCircle size={18} className="text-green-400" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => removeMember(member.id)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                title="Remove member"
                                            >
                                                <IoTrash size={18} className="text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 shadow-2xl">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Invite Team Member</h2>
                        <form onSubmit={inviteMember} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none"
                                    placeholder="colleague@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Role</label>
                                <div className="flex gap-3">
                                    {(['staff', 'admin', 'viewer'] as const).map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setForm({ ...form, role })}
                                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                                form.role === role 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            {roleConfig[role].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
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
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50"
                                >
                                    {saving ? 'Sending...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
