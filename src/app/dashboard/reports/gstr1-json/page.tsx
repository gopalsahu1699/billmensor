'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { FileJson, FileSpreadsheet, Download, Filter, Search, Calendar, ChevronLeft, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { exportToExcel } from '@/lib/excel-utils'

export default function GSTR1Report() {
    const [loading, setLoading] = useState(false)
    const [invoices, setInvoices] = useState<any[]>([])
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        fetchInvoices()
    }, [])

    async function fetchInvoices() {
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
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const b2bInvoices = invoices.filter(inv => inv.customers?.gstin)
    const b2cInvoices = invoices.filter(inv => !inv.customers?.gstin)

    const totals = invoices.reduce((acc, inv) => ({
        taxable: acc.taxable + (inv.total_amount - inv.tax_total),
        tax: acc.tax + inv.tax_total,
        total: acc.total + inv.total_amount
    }), { taxable: 0, tax: 0, total: 0 })

    const exportToXLS = () => {
        const headers = ["Invoice No", "Date", "Customer", "GSTIN", "Taxable Value", "Tax Amount", "Total Amount", "Place of Supply"]
        const rows = invoices.map(inv => [
            inv.invoice_number,
            inv.invoice_date,
            inv.customers?.name,
            inv.customers?.gstin || 'Unregistered',
            (inv.total_amount - inv.tax_total).toFixed(2),
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

            const hsnSummaryMap: any = {}

            invoices.forEach(inv => {
                inv.invoice_items?.forEach((item: any) => {
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
                gstin: "USER_GSTIN_HERE", // Should come from profile
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
                        itms: inv.invoice_items?.map((item: any, idx: number) => ({
                            num: idx + 1,
                            itm_det: {
                                txval: item.total - item.tax_amount,
                                rt: item.tax_rate,
                                iamt: Number(item.tax_amount)
                            }
                        }))
                    }]
                })),
                b2cs: b2cInvoices.map(inv => ({
                    pos: inv.customers?.supply_place || "00",
                    typ: "OE",
                    itms: [{
                        rt: 18, // Simplified for B2C
                        txval: inv.total_amount - inv.tax_total,
                        iamt: inv.tax_total
                    }]
                })),
                cdnr: (returnsData || []).filter(r => r.customers?.gstin).map(r => ({
                    ctin: r.customers?.gstin,
                    nt: [{
                        nt_num: r.return_number,
                        nt_dt: r.return_date.split('-').reverse().join('-'),
                        typ: "C", // Credit Note
                        val: r.total_amount,
                        pos: r.supply_place || "00",
                        itms: r.return_items?.map((item: any, idx: number) => ({
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
        } catch (err) {
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
                    <Button variant="outline" size="sm" className="rounded-full w-10 px-0">
                        <ChevronLeft size={18} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">GSTR-1 Filing Report</h1>
                    <p className="text-slate-500">Generate your monthly sales return for the GST portal.</p>
                </div>
            </div>

            <Card className="border-blue-100 bg-blue-50/30">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Calendar size={12} /> Start Date
                            </label>
                            <input
                                type="date"
                                className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Calendar size={12} /> End Date
                            </label>
                            <input
                                type="date"
                                className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                        <Button onClick={fetchInvoices} isLoading={loading} className="bg-blue-600 no-print">
                            Apply Filters
                        </Button>
                        <div className="ml-auto flex gap-2 no-print">
                            <Button variant="outline" onClick={handlePrint} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                <FileText size={18} className="mr-2" /> PDF
                            </Button>
                            <Button variant="outline" onClick={exportToXLS} className="border-green-200 text-green-700 hover:bg-green-50">
                                <FileSpreadsheet size={18} className="mr-2" /> XLS Summary
                            </Button>
                            <Button variant="outline" onClick={exportToJSON} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                <FileJson size={18} className="mr-2" /> JSON Filing
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Taxable Value</CardDescription>
                        <CardTitle className="text-2xl">₹ {totals.taxable.toLocaleString('en-IN')}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Tax Collected</CardDescription>
                        <CardTitle className="text-2xl text-blue-600">₹ {totals.tax.toLocaleString('en-IN')}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Sales</CardDescription>
                        <CardTitle className="text-2xl text-green-600">₹ {totals.total.toLocaleString('en-IN')}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span>Invoice Breakdown</span>
                        <div className="flex gap-4 text-sm font-medium">
                            <span className="text-blue-600">B2B: {b2bInvoices.length}</span>
                            <span className="text-slate-500">B2C: {b2cInvoices.length}</span>
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
                                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-2 font-bold">{inv.invoice_number}</td>
                                        <td className="py-3 px-2 font-medium">{inv.customers?.name}</td>
                                        <td className="py-3 px-2 text-slate-500">{inv.customers?.gstin || <span className="text-slate-300 italic">Unregistered</span>}</td>
                                        <td className="py-3 px-2">₹ {(inv.total_amount - inv.tax_total).toLocaleString('en-IN')}</td>
                                        <td className="py-3 px-2 text-blue-600 font-medium">₹ {inv.tax_total.toLocaleString('en-IN')}</td>
                                        <td className="py-3 px-2 text-right font-bold">₹ {inv.total_amount.toLocaleString('en-IN')}</td>
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
