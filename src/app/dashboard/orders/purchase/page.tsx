'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PurchaseOrder } from '@/types/index'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { 
    IoAdd, IoSearch, IoEllipsisVertical, IoEye, IoCreate, IoTrash,
    IoCube, IoArrowForward, IoTime, IoCheckmarkCircle, IoCloseCircle
} from 'react-icons/io5'
import { FaTruck } from 'react-icons/fa'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: IoTime },
    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: IoCheckmarkCircle },
    received: { label: 'Received', color: 'bg-green-100 text-green-700', icon: IoCheckmarkCircle },
    partial: { label: 'Partial', color: 'bg-orange-100 text-orange-700', icon: FaTruck },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: IoCloseCircle },
}

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setIoSearch] = useState('')

    useEffect(() => {
        fetchOrders()
    }, [])

    async function fetchOrders() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('purchase_orders')
                .select('*, suppliers(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrders(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function deleteOrder(id: string) {
        if (!confirm('Are you sure you want to delete this order?')) return

        try {
            const { error } = await supabase.from('purchase_orders').delete().eq('id', id)
            if (error) throw error
            toast.success('Order deleted successfully')
            fetchOrders()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredOrders = orders.filter(order => 
        order.order_number.toLowerCase().includes(search.toLowerCase()) ||
        order.suppliers?.name?.toLowerCase().includes(search.toLowerCase())
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
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Purchase Orders</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage purchase orders from suppliers</p>
                </div>
                <Link href="/dashboard/orders/purchase/create">
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20">
                        <IoAdd size={20} />
                        New Order
                    </button>
                </Link>
            </div>

            {/* IoSearch */}
            <div className="relative">
                <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="IoSearch orders..."
                    value={search}
                    onChange={(e) => setIoSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none"
                />
            </div>

            {/* Orders List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {filteredOrders.length === 0 ? (
                    <div className="py-20 text-center">
                        <IoCube size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No orders found</h3>
                        <p className="text-slate-500 mt-1">Create your first purchase order to get started</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Order #</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Supplier</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="text-right px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredOrders.map((order) => {
                                const status = statusConfig[order.status] || statusConfig.pending
                                const StatusIcon = status.icon
                                return (
                                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-900 dark:text-white">{order.order_number}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 dark:text-slate-300">{order.suppliers?.name || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-500">{format(new Date(order.order_date), 'dd MMM yyyy')}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-900 dark:text-white">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
                                                <StatusIcon size={14} />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/dashboard/orders/purchase/${order.id}`}>
                                                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                                        <IoEye size={18} className="text-slate-400" />
                                                    </button>
                                                </Link>
                                                <Link href={`/dashboard/orders/purchase/${order.id}?edit=true`}>
                                                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                                        <IoCreate size={18} className="text-slate-400" />
                                                    </button>
                                                </Link>
                                                <button 
                                                    onClick={() => deleteOrder(order.id)}
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
