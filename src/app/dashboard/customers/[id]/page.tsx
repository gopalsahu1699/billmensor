'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, User, Mail, Phone, MapPin, Receipt, IndianRupee, Clock, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

export default function CustomerLedgerPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const [customer, setCustomer] = useState<any>(null)
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCustomerDetails()
    }, [id])

    async function fetchCustomerDetails() {
        try {
            const { data: custData, error: custError } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .single()

            if (custError) throw custError
            setCustomer(custData)

            const { data: invData, error: invError } = await supabase
                .from('invoices')
                .select('*')
                .eq('customer_id', id)
                .order('created_at', { ascending: false })

            if (invError) throw invError
            setInvoices(invData || [])
        } catch (error: any) {
            toast.error(error.message)
            router.push('/dashboard/customers')
        } finally {
            setLoading(false)
        }
    }

    const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0)
    const outstanding = totalBilled - totalPaid

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-500 font-medium">Loading customer ledger...</p>
            </div>
        )
    }

    if (!customer) return null

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
                    <p className="text-slate-500">Customer Ledger & Transaction History</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Contact Info */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User size={20} className="text-blue-600" /> Contact Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-slate-600">
                                <Mail size={16} /> <span className="text-sm">{customer.email || 'No Email'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Phone size={16} /> <span className="text-sm">{customer.phone || 'No Phone'}</span>
                            </div>
                            <div className="flex items-start gap-3 text-slate-600">
                                <MapPin size={16} className="mt-1 flex-shrink-0" />
                                <div className="space-y-4">
                                    {customer.billing_address && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Billing Address</p>
                                            <span className="text-sm leading-relaxed">{customer.billing_address}</span>
                                        </div>
                                    )}
                                    {customer.shipping_address && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Shipping Address</p>
                                            <span className="text-sm leading-relaxed">{customer.shipping_address}</span>
                                        </div>
                                    )}
                                    {!customer.billing_address && !customer.shipping_address && (
                                        <span className="text-sm leading-relaxed italic text-slate-400">No Address Provided</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {(customer.gstin || customer.supply_place) && (
                            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-6">
                                {customer.gstin && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">GSTIN</p>
                                        <p className="font-mono text-sm text-slate-900 mt-1">{customer.gstin}</p>
                                    </div>
                                )}
                                {customer.supply_place && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Supply Place (POS)</p>
                                        <p className="text-sm text-slate-900 mt-1 uppercase font-black">{customer.supply_place}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Financial Summary */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-slate-50 border-none shadow-sm shadow-slate-100">
                        <CardContent className="p-6">
                            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Billed</p>
                            <p className="text-2xl font-black text-slate-900 mt-2">₹{totalBilled.toLocaleString('en-IN')}</p>
                            <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                                <Receipt size={12} /> {invoices.length} Invoices
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50/50 border-none shadow-sm shadow-green-100/50">
                        <CardContent className="p-6">
                            <p className="text-xs font-bold uppercase text-green-600 tracking-wider">Total Collected</p>
                            <p className="text-2xl font-black text-green-700 mt-2">₹{totalPaid.toLocaleString('en-IN')}</p>
                            <div className="mt-4 flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase">
                                <TrendingUp size={12} /> Payment Received
                            </div>
                        </CardContent>
                    </Card>
                    <Card className={`${outstanding > 0 ? 'bg-orange-50 border-none shadow-sm shadow-orange-100' : 'bg-slate-50 border-none opacity-50'}`}>
                        <CardContent className="p-6">
                            <p className="text-xs font-bold uppercase text-orange-600 tracking-wider">Outstanding Balance</p>
                            <p className="text-2xl font-black text-orange-700 mt-2">₹{outstanding.toLocaleString('en-IN')}</p>
                            <div className="mt-4 flex items-center gap-1 text-[10px] text-orange-500 font-bold uppercase">
                                <Clock size={12} /> Pending Amount
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
                                    <tr className="border-b border-slate-100 text-xs font-bold uppercase text-slate-400 tracking-wider">
                                        <th className="py-4">Invoice #</th>
                                        <th className="py-4">Date</th>
                                        <th className="py-4">Amount</th>
                                        <th className="py-4">Status</th>
                                        <th className="py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoices.map((inv) => (
                                        <tr
                                            key={inv.id}
                                            className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                            onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                                        >
                                            <td className="py-4 font-bold text-blue-600">{inv.invoice_number}</td>
                                            <td className="py-4 text-sm text-slate-500">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                            <td className="py-4 font-bold text-slate-900 font-mono">₹{inv.total_amount.toLocaleString('en-IN')}</td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${inv.payment_status === 'paid'
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : 'bg-orange-50 text-orange-700 border-orange-100'
                                                    }`}>
                                                    {inv.payment_status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <Button variant="ghost" size="sm" className="text-slate-400 group-hover:text-blue-600">
                                                    View Details
                                                </Button>
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
