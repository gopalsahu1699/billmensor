'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Backup } from '@/types/index'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { IoAdd, IoServer, IoDownload, IoTrash, IoRefresh, IoCloud, IoTime, IoCheckmarkCircle, IoAlertCircle, IoSearch } from 'react-icons/io5'
import { FaPlus } from 'react-icons/fa'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Creating...', color: 'bg-yellow-100 text-yellow-700', icon: IoTime },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: IoCheckmarkCircle },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: IoAlertCircle },
}

export default function BackupSettingsPage() {
    const [backups, setBackups] = useState<Backup[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchBackups()
    }, [])

    async function fetchBackups() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('backups')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setBackups(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function createBackup() {
        setCreating(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const fileName = `backup-${timestamp}.json`

            // Create backup record
            const { data: backupRecord, error: recordError } = await supabase
                .from('backups')
                .insert({
                    user_id: user.id,
                    backup_type: 'manual',
                    file_name: fileName,
                    status: 'pending'
                })
                .select()
                .single()

            if (recordError) throw new Error(recordError.message)

            // Fetch user data
            const [invoices, customers, products, purchases, quotations] = await Promise.all([
                supabase.from('invoices').select('*').eq('user_id', user.id),
                supabase.from('customers').select('*').eq('user_id', user.id),
                supabase.from('products').select('*').eq('user_id', user.id),
                supabase.from('purchases').select('*').eq('user_id', user.id),
                supabase.from('quotations').select('*').eq('user_id', user.id)
            ])

            const backupData = {
                version: '2.0',
                created_at: new Date().toISOString(),
                data: {
                    invoices: invoices.data,
                    customers: customers.data,
                    products: products.data,
                    purchases: purchases.data,
                    quotations: quotations.data
                }
            }

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('backups')
                .upload(`${user.id}/${fileName}`, JSON.stringify(backupData, null, 2))

            if (uploadError) throw new Error(uploadError.message)

            // Get public URL and update
            const { data: urlData } = supabase.storage
                .from('backups')
                .getPublicUrl(`${user.id}/${fileName}`)

            await supabase
                .from('backups')
                .update({ status: 'completed', file_url: urlData.publicUrl })
                .eq('id', backupRecord.id)

            toast.success('Backup created successfully')
            fetchBackups()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setCreating(false)
        }
    }

    async function downloadBackup(backup: Backup) {
        if (!backup.file_url) {
            toast.error('Backup file not available')
            return
        }

        try {
            const { data, error } = await supabase.storage
                .from('backups')
                .download(backup.file_url)

            if (error) throw error

            const url = URL.createObjectURL(data)
            const a = document.createElement('a')
            a.href = url
            a.download = backup.file_name || 'backup.json'
            a.click()
            URL.revokeObjectURL(url)
        } catch (error: any) {
            toast.error('Failed to download backup')
        }
    }

    async function deleteBackup(id: string) {
        if (!confirm('Are you sure you want to delete this backup?')) return

        try {
            const { error } = await supabase
                .from('backups')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Backup deleted')
            fetchBackups()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredBackups = backups.filter(b => 
        b.file_name?.toLowerCase().includes(search.toLowerCase()) ||
        b.backup_type?.toLowerCase().includes(search.toLowerCase())
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
                    <div className="w-14 h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center">
                        <IoServer className="text-purple-600" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Backup & Restore</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Create and manage data backups</p>
                    </div>
                </div>
                <button 
                    onClick={createBackup}
                    disabled={creating}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-purple-600/20 disabled:opacity-50"
                >
                    {creating ? (
                        <>
                            <IoRefresh size={20} className="animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <FaPlus size={20} />
                            Create Backup
                        </>
                    )}
                </button>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <IoCloud className="text-blue-600 mt-1" size={24} />
                    <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100">Automatic Backups</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Your data is automatically backed up daily. You can also create manual backups anytime.
                            Backups are stored securely in your private storage bucket.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search backups..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-purple-600/20 outline-none"
                />
            </div>

            {/* Backups List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {filteredBackups.length === 0 ? (
                    <div className="py-20 text-center">
                        <IoServer size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No backups yet</h3>
                        <p className="text-slate-500 mt-1">Create your first backup to protect your data</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Type</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">File Name</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="text-right px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredBackups.map((backup) => {
                                const status = statusConfig[backup.status] || statusConfig.pending
                                const StatusIcon = status.icon

                                return (
                                    <tr key={backup.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                                                backup.backup_type === 'auto' 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-purple-100 text-purple-700'
                                            }`}>
                                                {backup.backup_type === 'auto' ? 'Auto' : 'Manual'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm text-slate-600 dark:text-slate-300">
                                                {backup.file_name || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-500">
                                                {format(new Date(backup.created_at), 'dd MMM yyyy, hh:mm a')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
                                                <StatusIcon size={14} />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => downloadBackup(backup)}
                                                    disabled={backup.status !== 'completed'}
                                                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                                >
                                                    <IoDownload size={14} />
                                                    Download
                                                </button>
                                                <button 
                                                    onClick={() => deleteBackup(backup.id)}
                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                >
                                                    <IoTrash size={18} className="text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
