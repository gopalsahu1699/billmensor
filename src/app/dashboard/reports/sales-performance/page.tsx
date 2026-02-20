'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Package, TrendingUp, IndianRupee, Calendar, ChevronLeft, ArrowUpRight, BarChart2, Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { exportToExcel } from '@/lib/excel-utils'

export default function ItemProfitSummary() {
    const [loading, setLoading] = useState(false)
    const [itemStats, setItemStats] = useState<any[]>([])
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        fetchItemStats()
    }, [])

    async function fetchItemStats() {
        setLoading(true)
        try {
            // 1. Fetch Invoice Items with Product Details and Invoices (for date filtering)
            // Note: Since Supabase doesn't support deep filtering efficiently in one go for aggregates 
            // across joins with different root, we fetch items and filter in JS for simplicity here.

            const { data, error } = await supabase
                .from('invoice_items')
                .select(`
                    *,
                    products (name, purchase_price),
                    invoices!inner (invoice_date)
                `)
                .gte('invoices.invoice_date', dateRange.start)
                .lte('invoices.invoice_date', dateRange.end)

            if (error) throw error

            // 2. Group by Product
            const statsMap: any = {}
            data?.forEach(item => {
                const prodId = item.product_id
                const buyPrice = item.products?.purchase_price || 0
                const sellPrice = item.unit_price
                const qty = item.quantity

                if (!statsMap[prodId]) {
                    statsMap[prodId] = {
                        name: item.products?.name || 'Unknown Item',
                        qty: 0,
                        revenue: 0,
                        cost: 0,
                        profit: 0
                    }
                }

                statsMap[prodId].qty += qty
                statsMap[prodId].revenue += (sellPrice * qty)
                statsMap[prodId].cost += (buyPrice * qty)
            })

            // 3. Final calculation
            const finalStats = Object.values(statsMap).map((s: any) => ({
                ...s,
                profit: s.revenue - s.cost,
                margin: s.revenue > 0 ? ((s.revenue - s.cost) / s.revenue) * 100 : 0
            })).sort((a, b) => b.profit - a.profit)

            setItemStats(finalStats)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const exportToXLS = () => {
        const headers = ["Product Name", "Qty Sold", "Revenue", "Cost", "Profit", "Margin %"]
        const rows = itemStats.map(item => [
            item.name,
            item.qty,
            item.revenue.toFixed(2),
            item.cost.toFixed(2),
            item.profit.toFixed(2),
            item.margin.toFixed(2)
        ])

        exportToExcel(rows, headers, `Sales_Performance_${dateRange.start}`)
        toast.success("Excel Report Exported")
    }

    const handlePrint = () => {
        window.print()
    }

    const totalProfit = itemStats.reduce((acc, curr) => acc + curr.profit, 0)

    return (
        <div className="space-y-6 print:space-y-4">
            <div className="hidden print:block border-b-2 border-purple-900 pb-4 mb-6">
                <h1 className="text-2xl font-bold">Item Profit & Sales Summary</h1>
                <p className="text-slate-500">Generated on: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="flex items-center gap-4 no-print">
                <Link href="/dashboard/reports">
                    <Button variant="outline" size="sm" className="rounded-full w-10 px-0">
                        <ChevronLeft size={18} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Item Profit Sale Summary</h1>
                    <p className="text-slate-500">Track which products are driving your business growth.</p>
                </div>
            </div>

            <Card className="border-purple-100 bg-purple-50/20">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5 flex-1 min-w-[300px]">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Calendar size={12} /> Analysis Period
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    className="h-10 flex-1 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                                <span className="text-slate-400">to</span>
                                <input
                                    type="date"
                                    className="h-10 flex-1 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button onClick={fetchItemStats} isLoading={loading} className="bg-purple-600 hover:bg-purple-700 h-10 no-print">
                            Generate Summary
                        </Button>
                        <div className="ml-auto flex gap-2 no-print">
                            <Button variant="outline" onClick={handlePrint} disabled={itemStats.length === 0} className="h-10">
                                <FileText size={18} className="mr-2" /> PDF
                            </Button>
                            <Button variant="outline" onClick={exportToXLS} disabled={itemStats.length === 0} className="h-10">
                                <Download size={18} className="mr-2" /> XLS
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-green-50 text-green-600"><TrendingUp size={20} /></div>
                        <h3 className="text-slate-500 text-sm font-medium">Total Gross Profit</h3>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 leading-none">₹ {totalProfit.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><BarChart2 size={20} /></div>
                        <h3 className="text-slate-500 text-sm font-medium">Items Analyzed</h3>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 leading-none">{itemStats.length}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Package size={20} className="text-slate-400" /> Product Performance List
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="py-4 px-2">Product Name</th>
                                    <th className="py-4 px-2 text-right">Qty Sold</th>
                                    <th className="py-4 px-2 text-right">Revenue (₹)</th>
                                    <th className="py-4 px-2 text-right">Profit (₹)</th>
                                    <th className="py-4 px-2 text-right">Margin (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {itemStats.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-2 font-bold text-slate-800">{item.name}</td>
                                        <td className="py-4 px-2 text-right text-slate-500 font-medium">
                                            {item.qty}
                                        </td>
                                        <td className="py-4 px-2 text-right font-semibold text-slate-900">
                                            {item.revenue.toLocaleString('en-IN')}
                                        </td>
                                        <td className="py-4 px-2 text-right">
                                            <div className="font-black text-green-600 flex items-center justify-end gap-1">
                                                {item.profit.toLocaleString('en-IN')}
                                                <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 text-right">
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1 mt-1">
                                                <div
                                                    className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(item.margin, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500">{item.margin.toFixed(1)}%</span>
                                        </td>
                                    </tr>
                                ))}
                                {itemStats.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 italic">No sales data found for the selected items in this period.</td>
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
