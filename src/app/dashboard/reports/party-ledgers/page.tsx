'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Users, Calendar, ChevronLeft, Download, Receipt, ArrowRightLeft, ShoppingCart, CreditCard, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { exportToExcel } from '@/lib/excel-utils'

export default function PartyLedgerReport() {
    const [loading, setLoading] = useState(false)
    const [parties, setParties] = useState<any[]>([])
    const [selectedParty, setSelectedParty] = useState('')
    const [ledger, setLedger] = useState<any[]>([])
    const [summary, setSummary] = useState({ totalBill: 0, totalPaid: 0, balance: 0 })

    useEffect(() => {
        fetchParties()
    }, [])

    async function fetchParties() {
        const { data } = await supabase.from('customers').select('id, name').order('name')
        setParties(data || [])
    }

    async function fetchLedger() {
        if (!selectedParty) return toast.error('Please select a party')
        setLoading(true)
        try {
            // Fetch Invoices, Purchases, and Payments
            const [invRes, purRes, payRes] = await Promise.all([
                supabase.from('invoices').select('*').eq('customer_id', selectedParty).order('invoice_date', { ascending: true }),
                supabase.from('purchases').select('*').eq('supplier_id', selectedParty).order('purchase_date', { ascending: true }),
                supabase.from('payments').select('*').eq('customer_id', selectedParty).order('payment_date', { ascending: true })
            ])

            // Combine and sort by date
            const combined = [
                ...(invRes.data || []).map(i => ({ type: 'Invoice', doc: i.invoice_number, date: i.invoice_date, amount: i.total_amount, paid: i.amount_paid, side: 'Sale' })),
                ...(purRes.data || []).map(p => ({ type: 'Purchase', doc: p.purchase_number, date: p.purchase_date, amount: p.total_amount, paid: 0, side: 'Purchase' })),
                ...(payRes.data || []).map(pay => ({
                    type: pay.type === 'payment_in' ? 'Payment In' : 'Payment Out',
                    doc: pay.payment_number,
                    date: pay.payment_date,
                    amount: 0,
                    paid: pay.type === 'payment_in' ? pay.amount : -pay.amount,
                    side: pay.type === 'payment_in' ? 'Payment' : 'Payment'
                }))
            ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

            setLedger(combined)

            const totalBill = combined.reduce((acc, curr) => acc + curr.amount, 0)
            const totalPaid = combined.reduce((acc, curr) => acc + curr.paid, 0)
            setSummary({ totalBill, totalPaid, balance: totalBill - totalPaid })
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const exportToXLS = () => {
        const partyName = parties.find(p => p.id === selectedParty)?.name || 'Ledger'
        const headers = ["Date", "Type", "Document #", "Bill Amount", "Paid Amount", "Balance"]
        const rows = ledger.map(row => [
            new Date(row.date).toLocaleDateString(),
            row.type,
            row.doc,
            row.amount.toFixed(2),
            row.paid.toFixed(2),
            (row.amount - row.paid).toFixed(2)
        ])

        exportToExcel(rows, headers, `${partyName}_Ledger`)
        toast.success("Excel Ledger Exported")
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-6 print:space-y-4">
            <div className="hidden print:block border-b-2 border-blue-900 pb-4 mb-6">
                <h1 className="text-2xl font-bold">Party Ledger Statement</h1>
                <p className="text-lg font-semibold text-blue-800">
                    {parties.find(p => p.id === selectedParty)?.name || 'Account Statement'}
                </p>
            </div>

            <div className="flex items-center gap-4 no-print">
                <Link href="/dashboard/reports">
                    <Button variant="outline" size="sm" className="rounded-full w-10 px-0">
                        <ChevronLeft size={18} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Party Ledger (Statement)</h1>
                    <p className="text-slate-500">View consolidated transaction history for customers or suppliers.</p>
                </div>
            </div>

            <Card className="bg-blue-600 text-white border-none">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5 flex-1">
                            <label className="text-xs font-bold text-blue-100 uppercase">Select Customer / Supplier</label>
                            <select
                                className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white outline-none focus:bg-white/20"
                                value={selectedParty}
                                onChange={(e) => setSelectedParty(e.target.value)}
                            >
                                <option value="" className="text-slate-900">Choose a party...</option>
                                {parties.map(p => <option key={p.id} value={p.id} className="text-slate-900">{p.name}</option>)}
                            </select>
                        </div>
                        <Button onClick={fetchLedger} isLoading={loading} className="bg-white text-blue-600 hover:bg-blue-50">
                            View Statement
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {ledger.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="pb-2 text-center">
                            <CardDescription>Total Transaction Val</CardDescription>
                            <CardTitle className="text-2xl">₹ {summary.totalBill.toLocaleString('en-IN')}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2 text-center text-green-600">
                            <CardDescription className="text-green-600 opacity-60">Total Amount Paid</CardDescription>
                            <CardTitle className="text-2xl">₹ {summary.totalPaid.toLocaleString('en-IN')}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-slate-900 text-white">
                        <CardHeader className="pb-2 text-center">
                            <CardDescription className="text-slate-400">Net Balance Due</CardDescription>
                            <CardTitle className="text-2xl">₹ {summary.balance.toLocaleString('en-IN')}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Statement of Account</CardTitle>
                    {ledger.length > 0 && (
                        <div className="flex gap-2 no-print">
                            <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 gap-2">
                                <FileText size={14} /> PDF
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportToXLS} className="h-8 gap-2">
                                <Download size={14} /> Download XLS
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                                    <th className="py-4 px-2">Date</th>
                                    <th className="py-4 px-2">Type</th>
                                    <th className="py-4 px-2">Document #</th>
                                    <th className="py-4 px-2 text-right">Bill Amt (₹)</th>
                                    <th className="py-4 px-2 text-right">Paid (₹)</th>
                                    <th className="py-4 px-2 text-right">Running Bal (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {ledger.map((row, idx) => {
                                    // Local variable to show simple balance running if needed
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="py-3 px-2 text-slate-500">{new Date(row.date).toLocaleDateString()}</td>
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-2">
                                                    {row.side === 'Sale' ? <Receipt size={14} className="text-purple-500" /> : <ShoppingCart size={14} className="text-blue-500" />}
                                                    <span className="font-medium text-slate-900">{row.type}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 font-mono text-xs">{row.doc}</td>
                                            <td className="py-3 px-2 text-right font-medium">
                                                {row.amount.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-3 px-2 text-right text-green-600 font-bold">
                                                {row.paid.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-3 px-2 text-right font-black text-slate-400 italic">
                                                {(row.amount - row.paid).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {ledger.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 italic">Select a party to view their financial history.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
