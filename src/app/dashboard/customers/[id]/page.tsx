'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MdArrowBack, MdPerson, MdEmail, MdPhone, MdLocationOn, MdReceipt, MdAccessTime, MdTrendingUp } from 'react-icons/md'
import { toast } from 'sonner'

import { Customer, Invoice } from '@/types'

export default function CustomerLedgerPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const [customer, setCustomer] = useState<Customer | null>(null)
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)



    const fetchCustomerDetails = useCallback(async () => {
        try {
            const { data: custData, error: custError } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .single()

            if (custError) throw custError
            setCustomer(custData as Customer)

            const { data: invData, error: invError } = await supabase
                .from('invoices')
                .select('*')
                .eq('customer_id', id)
                .order('created_at', { ascending: false })

            if (invError) throw invError
            setInvoices((invData as Invoice[]) || [])
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'An error occurred'
            toast.error(msg)
            router.push('/dashboard/customers')
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        fetchCustomerDetails()
    }, [fetchCustomerDetails])

    const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0)
    const outstanding = totalBilled - totalPaid

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Loading customer ledger...</p>
            </div>
        )
    }

    if (!customer) return null

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full dark:text-slate-300">
                    <MdArrowBack size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight italic">{customer.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Customer Ledger & Transaction History</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Contact Info */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MdPerson size={20} className="text-blue-600" /> Contact Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-5">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                                    <MdEmail size={16} className="text-blue-500" />
                                </div>
                                <span className="text-sm font-medium">{customer.email || 'No Email'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                                    <MdPhone size={16} className="text-green-500" />
                                </div>
                                <span className="text-sm font-medium">{customer.phone || 'No Phone'}</span>
                            </div>
                            <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                                <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5 mt-1">
                                    <MdLocationOn size={16} className="text-red-500" />
                                </div>
                                <div className="space-y-4 pt-1">
                                    {customer.billing_address && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Billing Address</p>
                                            <span className="text-sm leading-relaxed font-medium">{customer.billing_address}</span>
                                        </div>
                                    )}
                                    {customer.shipping_address && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Shipping Address</p>
                                            <span className="text-sm leading-relaxed font-medium">{customer.shipping_address}</span>
                                        </div>
                                    )}
                                    {!customer.billing_address && !customer.shipping_address && (
                                        <span className="text-sm leading-relaxed italic text-slate-400 dark:text-slate-500">No Address Provided</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {(customer.gstin || customer.supply_place) && (
                            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-6">
                                {customer.gstin && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">GSTIN</p>
                                        <p className="font-mono text-sm text-slate-900 dark:text-slate-100 mt-1 font-bold">{customer.gstin}</p>
                                    </div>
                                )}
                                {customer.supply_place && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Supply Place (POS)</p>
                                        <p className="text-sm text-slate-900 dark:text-white mt-1 uppercase font-black">{customer.supply_place}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Financial Summary */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-slate-50 dark:bg-white/5 border-none shadow-sm">
                        <CardContent className="p-6">
                            <p className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest">Total Billed</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">₹{totalBilled.toLocaleString('en-IN')}</p>
                            <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
                                <MdReceipt size={12} className="text-blue-500" /> {invoices.length} Invoices
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50/50 dark:bg-green-900/10 border-none shadow-sm">
                        <CardContent className="p-6">
                            <p className="text-xs font-bold uppercase text-green-600 dark:text-green-400 tracking-widest">Total Collected</p>
                            <p className="text-2xl font-black text-green-700 dark:text-green-300 mt-2 font-mono">₹{totalPaid.toLocaleString('en-IN')}</p>
                            <div className="mt-4 flex items-center gap-1 text-[10px] text-green-500 dark:text-green-600 font-black uppercase tracking-widest">
                                <MdTrendingUp size={12} /> Payment Received
                            </div>
                        </CardContent>
                    </Card>
                    <Card className={`${outstanding > 0 ? 'bg-orange-50 dark:bg-orange-900/10 border-none shadow-sm' : 'bg-slate-50 dark:bg-white/5 border-none opacity-50'}`}>
                        <CardContent className="p-6">
                            <p className="text-xs font-bold uppercase text-orange-600 dark:text-orange-400 tracking-widest">Outstanding</p>
                            <p className="text-2xl font-black text-orange-700 dark:text-orange-300 mt-2 font-mono">₹{outstanding.toLocaleString('en-IN')}</p>
                            <div className="mt-4 flex items-center gap-1 text-[10px] text-orange-500 dark:text-orange-600 font-black uppercase tracking-widest">
                                <MdAccessTime size={12} /> Pending Amount
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {invoices.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <p>No transactions found for this customer.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">
                                        <th className="py-4 pl-4 px-6">Invoice #</th>
                                        <th className="py-4 px-6">Date</th>
                                        <th className="py-4 px-6">Amount</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                    {invoices.map((inv) => (
                                        <tr
                                            key={inv.id}
                                            className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                                            onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                                        >
                                            <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400">{inv.invoice_number}</td>
                                            <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 font-medium">{new Date(inv.invoice_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td className="py-4 px-6 font-bold text-slate-900 dark:text-white font-mono">₹{inv.total_amount.toLocaleString('en-IN')}</td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${inv.payment_status === 'paid'
                                                    ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30'
                                                    : 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30'
                                                    }`}>
                                                    {inv.payment_status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl font-bold text-xs uppercase tracking-widest">
                                                        View
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
