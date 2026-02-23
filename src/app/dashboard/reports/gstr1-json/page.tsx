'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { FileJson, FileSpreadsheet, Calendar, ChevronLeft, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { exportToExcel } from '@/lib/excel-utils'

type InvoiceData = {
    id: string;
    invoice_number: string;
    invoice_date: string;
    subtotal: number;
    tax_total: number;
    total_amount: number;
    cgst_total: number;
    sgst_total: number;
    igst_total: number;
    customers?: { name: string; gstin: string; billing_address: string; supply_place: string };
    invoice_items?: {
        hsn_code?: string;
        quantity: number | string;
        total: number;
        tax_amount: number;
        tax_rate: number;
        cgst?: number;
        sgst?: number;
        igst?: number;
    }[];
};

export default function GSTR1Report() {
    const [loading, setLoading] = useState(false)
    const [invoices, setInvoices] = useState<InvoiceData[]>([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [profile, setProfile] = useState<any>(null)
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })

    const fetchInvoices = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    *,
                    customers (
                        name,
                        gstin,
                        billing_address,
                        supply_place
                    ),
                    invoice_items (*)
                `)
                .gte('invoice_date', dateRange.start)
                .lte('invoice_date', dateRange.end)
                .order('invoice_date', { ascending: false })

            if (error) throw error
            setInvoices(data || [])
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to fetch invoices')
        } finally {
            setLoading(false)
        }
    }, [dateRange.start, dateRange.end])

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setProfile(data)
            }
        }
        fetchProfile()
        fetchInvoices()
    }, [fetchInvoices])

    const b2bInvoices = invoices.filter(inv => inv.customers?.gstin)
    const b2cInvoices = invoices.filter(inv => !inv.customers?.gstin)

    const totals = invoices.reduce((acc, inv) => ({
        taxable: acc.taxable + Number(inv.subtotal || 0),
        tax: acc.tax + Number(inv.tax_total || 0),
        total: acc.total + Number(inv.total_amount || 0)
    }), { taxable: 0, tax: 0, total: 0 })

    const exportToXLS = () => {
        const headers = ["Invoice No", "Date", "Customer", "GSTIN", "Taxable Value", "Tax Amount", "Total Amount", "Place of Supply"]
        const rows = invoices.map(inv => [
            inv.invoice_number,
            inv.invoice_date,
            inv.customers?.name,
            inv.customers?.gstin || 'Unregistered',
            (inv.subtotal || 0).toFixed(2),
            inv.tax_total.toFixed(2),
            inv.total_amount.toFixed(2),
            inv.customers?.supply_place || '-'
        ])

        exportToExcel(rows, headers, `GSTR1_Report_${dateRange.start}_to_${dateRange.end}`)
        toast.success("Excel Report Exported")
    }

    const exportToJSON = async () => {
        try {
            // Fetch Sales Returns for CDNR/CDNUR
            const { data: returnsData } = await supabase
                .from('returns')
                .select('*, customers:customer_id(*), return_items(*)')
                .eq('type', 'sales_return')
                .gte('return_date', dateRange.start)
                .lte('return_date', dateRange.end)

            const hsnSummaryMap: Record<string, { hsn_sc: string, uqc: string, qty: number, val: number, txval: number, iamt: number, camt: number, samt: number }> = {}

            invoices.forEach(inv => {
                inv.invoice_items?.forEach((item: { hsn_code?: string; quantity: number | string; total: number; tax_amount: number; tax_rate: number }) => {
                    const hsn = item.hsn_code || '9999'
                    if (!hsnSummaryMap[hsn]) {
                        hsnSummaryMap[hsn] = { hsn_sc: hsn, uqc: "OTH", qty: 0, val: 0, txval: 0, iamt: 0, camt: 0, samt: 0 }
                    }
                    hsnSummaryMap[hsn].qty += Number(item.quantity)
                    hsnSummaryMap[hsn].val += Number(item.total)
                    hsnSummaryMap[hsn].txval += Number(item.total - item.tax_amount)
                    hsnSummaryMap[hsn].iamt += Number(item.tax_amount) // Simplified, usually split
                })
            })

            const gstr1Data = {
                gstin: profile?.gstin || "USER_GSTIN",
                fp: dateRange.start.substring(5, 7) + dateRange.start.substring(0, 4),
                gt: totals.total,
                cur_gt: totals.total,
                b2b: b2bInvoices.map(inv => ({
                    ctin: inv.customers?.gstin,
                    inv: [{
                        inum: inv.invoice_number,
                        idt: inv.invoice_date.split('-').reverse().join('-'),
                        val: inv.total_amount,
                        pos: inv.customers?.supply_place || "00",
                        itms: inv.invoice_items?.map((item, idx: number) => ({
                            num: idx + 1,
                            itm_det: {
                                txval: Number(item.total - item.tax_amount),
                                rt: Number(item.tax_rate),
                                iamt: Number(item.igst || 0),
                                camt: Number(item.cgst || 0),
                                samt: Number(item.sgst || 0)
                            }
                        }))
                    }]
                })),
                b2cs: b2cInvoices.map(inv => ({
                    pos: inv.customers?.supply_place || "00",
                    typ: "OE",
                    itms: inv.invoice_items?.map((item) => ({
                        rt: Number(item.tax_rate),
                        txval: Number(item.total - item.tax_amount),
                        iamt: Number(item.igst || 0),
                        camt: Number(item.cgst || 0),
                        samt: Number(item.sgst || 0)
                    })) || []
                })),
                cdnr: (returnsData || []).filter(r => r.customers?.gstin).map(r => ({
                    ctin: r.customers?.gstin,
                    nt: [{
                        nt_num: r.return_number,
                        nt_dt: r.return_date.split('-').reverse().join('-'),
                        typ: "C", // Credit Note
                        val: r.total_amount,
                        pos: r.supply_place || "00",
                        itms: r.return_items?.map((item: { total: number; tax_amount: number; tax_rate: number }, idx: number) => ({
                            num: idx + 1,
                            itm_det: {
                                txval: item.total - item.tax_amount,
                                rt: item.tax_rate,
                                iamt: item.tax_amount
                            }
                        }))
                    }]
                })),
                hsn: {
                    data: Object.values(hsnSummaryMap)
                }
            }

            const blob = new Blob([JSON.stringify(gstr1Data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.setAttribute("href", url)
            link.setAttribute("download", `GSTR1_Filing_${dateRange.start}.json`)
            link.click()
            toast.success("GSTR-1 JSON Exported (Includes HSN & CDN)")
        } catch {
            toast.error("JSON Export failed")
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-6 print:space-y-4">
            <div className="hidden print:block border-b-2 border-blue-900 pb-4 mb-6">
                <h1 className="text-2xl font-bold">GSTR-1 Sales Report</h1>
                <p className="text-slate-500">Filing Period: {dateRange.start} to {dateRange.end}</p>
            </div>

            <div className="flex items-center gap-4 no-print">
                <Link href="/dashboard/reports">
                    <Button variant="outline" size="sm" className="rounded-full w-10 px-0 dark:border-slate-800">
                        <ChevronLeft size={18} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">GSTR-1 Filing Report</h1>
                    <p className="text-slate-500 dark:text-slate-400">Generate your monthly sales return for the GST portal.</p>
                </div>
            </div>

            <Card className="border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                                <Calendar size={12} /> Start Date
                            </label>
                            <input
                                type="date"
                                className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-slate-100"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                                <Calendar size={12} /> End Date
                            </label>
                            <input
                                type="date"
                                className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-slate-100"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                        <Button onClick={fetchInvoices} isLoading={loading} className="bg-blue-600 no-print">
                            Apply Filters
                        </Button>
                        <div className="ml-auto flex gap-2 no-print">
                            <Button variant="outline" onClick={handlePrint} className="border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                <FileText size={18} className="mr-2" /> PDF
                            </Button>
                            <Button variant="outline" onClick={exportToXLS} className="border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20">
                                <FileSpreadsheet size={18} className="mr-2" /> XLS Summary
                            </Button>
                            <Button variant="outline" onClick={exportToJSON} className="border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                <FileJson size={18} className="mr-2" /> JSON Filing
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="dark:bg-slate-900 dark:border-slate-800">
                    <CardHeader className="pb-2">
                        <CardDescription className="dark:text-slate-400">Taxable Value</CardDescription>
                        <CardTitle className="text-2xl dark:text-slate-100">₹ {totals.taxable.toLocaleString('en-IN')}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="dark:bg-slate-900 dark:border-slate-800">
                    <CardHeader className="pb-2">
                        <CardDescription className="dark:text-slate-400">Tax Collected</CardDescription>
                        <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">₹ {totals.tax.toLocaleString('en-IN')}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="dark:bg-slate-900 dark:border-slate-800">
                    <CardHeader className="pb-2">
                        <CardDescription className="dark:text-slate-400">Total Sales</CardDescription>
                        <CardTitle className="text-2xl text-green-600 dark:text-green-400">₹ {totals.total.toLocaleString('en-IN')}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between dark:text-slate-100">
                        <span>Invoice Breakdown</span>
                        <div className="flex gap-4 text-sm font-medium">
                            <span className="text-blue-600 dark:text-blue-400">B2B: {b2bInvoices.length}</span>
                            <span className="text-slate-500 dark:text-slate-400">B2C: {b2cInvoices.length}</span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-500 italic">
                                    <th className="py-3 px-2">Invoice #</th>
                                    <th className="py-3 px-2">Party</th>
                                    <th className="py-3 px-2">GSTIN</th>
                                    <th className="py-3 px-2">Taxable</th>
                                    <th className="py-3 px-2">Tax</th>
                                    <th className="py-3 px-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-3 px-2 font-black text-slate-900 dark:text-slate-100">{inv.invoice_number}</td>
                                        <td className="py-3 px-2 font-black text-slate-700 dark:text-slate-300 uppercase">{inv.customers?.name}</td>
                                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 font-bold uppercase">{inv.customers?.gstin || <span className="text-slate-300 dark:text-slate-600 italic">Unregistered</span>}</td>
                                        <td className="py-3 px-2 dark:text-slate-300">₹ {(inv.total_amount - inv.tax_total).toLocaleString('en-IN')}</td>
                                        <td className="py-3 px-2 text-blue-600 dark:text-blue-400 font-bold">₹ {inv.tax_total.toLocaleString('en-IN')}</td>
                                        <td className="py-3 px-2 text-right font-black text-slate-900 dark:text-slate-100">₹ {inv.total_amount.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 italic">No transactions found for this period.</td>
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
