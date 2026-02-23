'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function CustomersPage() {
    const router = useRouter()
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchCustomers()
    }, [])

    async function fetchCustomers() {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setCustomers(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteCustomer(id: string) {
        if (!confirm('Are you sure you want to permanently delete this client record?')) return

        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Customer record deleted successfully')
            fetchCustomers()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredCustomers = customers.filter(c =>
        (c.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (c.email?.toLowerCase() || '').includes(search.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section with search and add button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Clients & Customers</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage your customer database and track their activity.</p>
                </div>
                <Link href="/dashboard/customers/create">
                    <button className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95">
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        New Client
                    </button>
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Clients</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{customers.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-xl">
                            <span className="material-symbols-outlined">verified</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Accounts</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{customers.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl">
                            <span className="material-symbols-outlined">warning</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Overdue Invoices</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">0</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Table Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="relative group max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Filter by name, email, or company..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Identity</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact & Phone</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredCustomers.map((customer) => (
                                <tr
                                    key={customer.id}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                    onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm ring-4 ring-white dark:ring-slate-900 shadow-sm border border-primary/20">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors">{customer.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{customer.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{customer.phone}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tighter font-black">{customer.type}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500 uppercase tracking-tighter">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                            title="View"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                        <button
                                            onClick={() => router.push(`/dashboard/customers/create?edit=${customer.id}`)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                            title="Edit"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCustomer(customer.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredCustomers.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic text-sm">No clients discovered matching your search criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
