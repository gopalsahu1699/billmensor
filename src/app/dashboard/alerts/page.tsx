'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { LowStockAlert } from '@/types/index'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { 
    MdWarning, MdInventory, MdCheck, MdDoneAll, MdSearch, 
    MdVisibility, MdEdit, MdRefresh
} from 'react-icons/md'

export default function LowStockAlertsPage() {
    const [alerts, setAlerts] = useState<LowStockAlert[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchAlerts()
    }, [])

    async function fetchAlerts() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('low_stock_alerts')
                .select('*, products(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setAlerts(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function markAsRead(id: string) {
        try {
            const { error } = await supabase
                .from('low_stock_alerts')
                .update({ is_read: true })
                .eq('id', id)

            if (error) throw error
            toast.success('Alert marked as read')
            fetchAlerts()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    async function markAllAsRead() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('low_stock_alerts')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false)

            if (error) throw error
            toast.success('All alerts marked as read')
            fetchAlerts()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredAlerts = alerts.filter(a => 
        a.products?.name?.toLowerCase().includes(search.toLowerCase())
    )

    const unreadAlerts = filteredAlerts.filter(a => !a.is_read)
    const readAlerts = filteredAlerts.filter(a => a.is_read)

    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-yellow-600/10 rounded-2xl flex items-center justify-center">
                        <MdWarning className="text-yellow-600" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Low Stock Alerts</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            {unreadAlerts.length > 0 
                                ? `${unreadAlerts.length} products need attention`
                                : 'All products are well stocked'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {unreadAlerts.length > 0 && (
                        <button 
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                        >
                            <MdDoneAll size={20} />
                            Mark All Read
                        </button>
                    )}
                    <button 
                        onClick={fetchAlerts}
                        className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all"
                    >
                        <MdRefresh size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search alerts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-yellow-600/20 outline-none"
                />
            </div>

            {/* Alerts */}
            {filteredAlerts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 py-20 text-center">
                    <MdInventory size={48} className="mx-auto text-green-400 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">All stocked up!</h3>
                    <p className="text-slate-500 mt-1">No low stock alerts at the moment</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Unread Alerts */}
                    {unreadAlerts.length > 0 && (
                        <div>
                            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
                                Unread ({unreadAlerts.length})
                            </h2>
                            <div className="space-y-3">
                                {unreadAlerts.map((alert) => (
                                    <div 
                                        key={alert.id} 
                                        className="bg-white dark:bg-slate-900 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-6 flex items-center justify-between hover:shadow-lg transition-shadow"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                                                <MdWarning className="text-yellow-600" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">{alert.products?.name || 'Unknown Product'}</h3>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Current stock: <span className="font-bold text-red-600">{alert.current_stock || 0}</span> 
                                                    {' '}&bull;{' '}
                                                    Min level: <span className="font-bold">{alert.min_stock_level || 0}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Link href={`/dashboard/products/${alert.product_id}`}>
                                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors">
                                                    <MdVisibility size={16} />
                                                    View
                                                </button>
                                            </Link>
                                            <button 
                                                onClick={() => markAsRead(alert.id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-bold transition-colors"
                                            >
                                                <MdCheck size={16} />
                                                Mark Read
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Read Alerts */}
                    {readAlerts.length > 0 && (
                        <div>
                            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
                                Previously Notified ({readAlerts.length})
                            </h2>
                            <div className="space-y-2">
                                {readAlerts.map((alert) => (
                                    <div 
                                        key={alert.id} 
                                        className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-center justify-between opacity-70"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                                <MdInventory className="text-slate-400" size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-700 dark:text-slate-300">{alert.products?.name || 'Unknown Product'}</h3>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Stock: {alert.current_stock || 0} &bull; Min: {alert.min_stock_level || 0}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {format(new Date(alert.created_at), 'dd MMM')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
