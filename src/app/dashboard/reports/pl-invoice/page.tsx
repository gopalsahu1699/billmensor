'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { IoTrendingUp, IoTrendingDown, IoCalendar, IoChevronBack, IoDownload, IoDocument, IoShare } from "react-icons/io5"
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'
import { toast } from 'sonner'
import Link from 'next/link'
import { exportToExcel } from '@/lib/excel-utils'
import { downloadPDF, sharePDF } from '@/lib/pdf-service'


export default function ProfitLossInvoiceReport() {
    const [loading, setLoading] = useState(false)
    const [invoices, setInvoices] = useState<{
        id: string;
        invoice_number: string;
        customers?: { name?: string };
        invoice_items?: { quantity: number; unit_price: number; products?: { purchase_price?: number } }[];
        subtotal?: number;
        total_amount: number;
        tax_total?: number;
        cost_price_total: number;
        taxable_value: number;
        profit: number;
        margin: number;
    }[]>([])
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })

    const [totals, setTotals] = useState({ sales: 0, costs: 0, returns: 0, profit: 0 })

    const fetchPLData = React.useCallback(async () => {
        setLoading(true)
        try {
            // 1. Fetch Invoices
            const { data: invData, error: invError } = await supabase
                .from('invoices')
                .select(`
                    *,
                    customers (name),
                    invoice_items (
                        *,
                        products (purchase_price)
                    )
                `)
                .gte('invoice_date', dateRange.start)
                .lte('invoice_date', dateRange.end)
                .not('status', 'in', '("void", "draft")')
                .order('invoice_date', { ascending: false })

            if (invError) throw invError

            // 2. Fetch Sales Returns for the same period
            const { data: retData } = await supabase
                .from('returns')
                .select('total_amount, subtotal')
                .eq('type', 'sales_return')
                .gte('return_date', dateRange.start)
                .lte('return_date', dateRange.end)

            const returnsTaxable = (retData || []).reduce((acc, r) => acc + Number(r.subtotal || 0), 0)

            // 3. Process Data
            const processed = (invData || []).map(inv => {
                let costPriceTotal = 0
                inv.invoice_items?.forEach((item: { quantity: number, unit_price: number, products?: { purchase_price: number } }) => {
                    const buyPrice = item.products?.purchase_price || 0
                    costPriceTotal += (buyPrice * item.quantity)
                })

                const taxableValue = Number(inv.subtotal || 0)
                const profit = taxableValue - costPriceTotal
                const margin = taxableValue > 0 ? (profit / taxableValue) * 100 : 0

                return {
                    ...inv,
                    cost_price_total: costPriceTotal,
                    taxable_value: taxableValue,
                    profit: profit,
                    margin: margin
                }
            })

            const sums = processed.reduce((acc, inv) => ({
                sales: acc.sales + inv.taxable_value,
                costs: acc.costs + inv.cost_price_total,
                profit: acc.profit + inv.profit
            }), { sales: 0, costs: 0, profit: 0 })

            setInvoices(processed)
            setTotals({
                ...sums,
                returns: returnsTaxable,
                profit: sums.profit - returnsTaxable
            })
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error loading report')
        } finally {
            setLoading(false)
        }
    }, [dateRange.start, dateRange.end])

    useEffect(() => {
        fetchPLData()
    }, [fetchPLData])

    const exportToXLS = () => {
        const headers = ["Invoice #", "Customer", "Taxable Sale", "COGS", "Profit", "Margin %"]
        const rows = invoices.map(inv => [
            inv.invoice_number,
            inv.customers?.name,
            inv.taxable_value.toFixed(2),
            inv.cost_price_total.toFixed(2),
            inv.profit.toFixed(2),
            inv.margin.toFixed(2)
        ])

        exportToExcel(rows, headers, `Profit_Loss_Report_${dateRange.start}`)
        toast.success("Excel Report Exported")
    }

    const handleShare = async () => {
        await sharePDF({
            elementId: 'report-content',
            filename: `Profit_Loss_Report_${dateRange.start}.pdf`,
            title: 'Profit & Loss Report',
            text: `Attached is the invoice-wise profit & loss statement for the period ${dateRange.start} to ${dateRange.end}.`
        })
    }

    const handlePrint = async () => {
        await downloadPDF({
            elementId: 'report-content',
            filename: `Profit_Loss_Report_${dateRange.start}.pdf`
        })
    }



    return (
        <div id="report-content" className="space-y-6 print:space-y-4">
            <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
                <h1 className="text-2xl font-bold">Profit & Loss Statement (Invoice Wise)</h1>
                <p className="text-slate-500">Analysis Period: {dateRange.start} to {dateRange.end}</p>
            </div>

            <div className="flex items-center gap-4 no-print">
                <Link href="/dashboard/reports">
                    <Button variant="outline" size="sm" className="rounded-full w-10 px-0">
                        <IoChevronBack size={18} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Profit & Loss (Invoice Wise)</h1>
                    <p className="text-slate-500">Analyze profit margins for every sale transaction.</p>
                </div>
            </div>

            <Card className="bg-slate-50 border-slate-200 shadow-none">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <IoCalendar size={12} /> Period
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none w-40"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                                <span className="text-slate-400">to</span>
                                <input
                                    type="date"
                                    className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none w-40"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button onClick={fetchPLData} isLoading={loading} className="bg-slate-900 no-print">
                            Apply Analysis
                        </Button>
                        <div className="ml-auto flex gap-2 no-print">
                            <Button variant="outline" onClick={handleShare}>
                                <IoShare size={18} className="mr-2" /> Share
                            </Button>
                            <Button variant="outline" onClick={handlePrint} disabled={invoices.length === 0}>
                                <IoDocument size={18} className="mr-2" /> PDF
                            </Button>
                            <Button variant="outline" onClick={exportToXLS} disabled={invoices.length === 0}>
                                <IoDownload size={18} className="mr-2" /> XLS
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Taxable Sales</CardDescription>
                        <CardTitle className="text-2xl">₹ {totals.sales.toLocaleString('en-IN')}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Cost of Goods Sold (COGS)</CardDescription>
                        <CardTitle className="text-2xl">₹ {totals.costs.toLocaleString('en-IN')}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className={cn("border-l-4", totals.profit >= 0 ? "border-l-green-500" : "border-l-red-500")}>
                    <CardHeader className="pb-2">
                        <CardDescription>Net Profit (Adj.)</CardDescription>
                        <CardTitle className={cn("text-2xl", totals.profit >= 0 ? "text-green-600" : "text-red-500")}>
                            ₹ {totals.profit.toLocaleString('en-IN')}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-l-4 border-l-slate-400">
                    <CardHeader className="pb-2">
                        <CardDescription>Sales Returns (Taxable)</CardDescription>
                        <CardTitle className="text-2xl text-slate-600">₹ {totals.returns.toLocaleString('en-IN')}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Detailed Margin Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="py-4 px-2">Invoice Details</th>
                                    <th className="py-4 px-2 text-right">Taxable Sale (₹)</th>
                                    <th className="py-4 px-2 text-right">Total Cost (₹)</th>
                                    <th className="py-4 px-2 text-right">Profit (₹)</th>
                                    <th className="py-4 px-2 text-right">Margin (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-2">
                                            <p className="font-bold text-slate-900">{inv.invoice_number}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-37.5">{inv.customers?.name}</p>
                                        </td>
                                        <td className="py-4 px-2 text-right font-medium">
                                            {inv.taxable_value.toLocaleString('en-IN')}
                                        </td>
                                        <td className="py-4 px-2 text-right text-slate-500">
                                            {inv.cost_price_total.toLocaleString('en-IN')}
                                        </td>
                                        <td className={cn("py-4 px-2 text-right font-bold", inv.profit >= 0 ? "text-green-600" : "text-red-500")}>
                                            <div className="flex items-center justify-end gap-1">
                                                {inv.profit >= 0 ? <FaArrowUp size={14} /> : <FaArrowDown size={14} />}
                                                {inv.profit.toLocaleString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 text-right">
                                            <span className={cn(
                                                "px-2 py-1 rounded text-[10px] font-black",
                                                inv.margin >= 20 ? "bg-green-100 text-green-700" :
                                                    inv.margin >= 10 ? "bg-blue-100 text-blue-700" :
                                                        inv.margin >= 0 ? "bg-yellow-100 text-yellow-700" :
                                                            "bg-red-100 text-red-700"
                                            )}>
                                                {inv.margin.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 italic">No historical data available for selected period.</td>
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

function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(' ')
}
