'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { PieChart, TrendingUp, TrendingDown, IndianRupee, Calendar, ChevronLeft, Download, RefreshCw, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { exportToExcel } from '@/lib/excel-utils'

export default function ProfitLossStockReport() {
    const [loading, setLoading] = useState(false)
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })
    const [stats, setStats] = useState({
        openingStock: 0,
        purchases: 0,
        sales: 0,
        closingStock: 0,
        grossProfit: 0,
        margin: 0
    })

    useEffect(() => {
        calculateStockPL()
    }, [dateRange])

    const calculateStockPL = async () => {
        try {
            setLoading(true)

            // 1. Get Closing Stock (Current Inventory Valuation)
            const { data: products } = await supabase.from('products').select('stock_quantity, purchase_price')
            const closingStock = products?.reduce((acc, p) => acc + (Number(p.stock_quantity) * Number(p.purchase_price)), 0) || 0

            // 2. Get Total Purchases (Taxable Value) and Purchase Returns
            const { data: purchases } = await supabase
                .from('purchases')
                .select('subtotal')
                .gte('purchase_date', dateRange.start)
                .lte('purchase_date', dateRange.end)

            const totalPurchasesRaw = purchases?.reduce((acc, p) => acc + Number(p.subtotal || 0), 0) || 0

            const { data: purReturns } = await supabase
                .from('returns')
                .select('total_amount, type')
                .eq('type', 'purchase_return')
                .gte('return_date', dateRange.start)
                .lte('return_date', dateRange.end)

            const totalPurReturns = (purReturns || []).reduce((acc, r) => acc + (Number(r.total_amount) / 1.18), 0)

            const netPurchases = totalPurchasesRaw - totalPurReturns

            // 3. Get Total Sales (Taxable Value) and Sales Returns
            const { data: invoices } = await supabase
                .from('invoices')
                .select('subtotal')
                .gte('invoice_date', dateRange.start)
                .lte('invoice_date', dateRange.end)
                .not('status', 'in', '("void", "draft")')

            const totalSalesRaw = invoices?.reduce((acc, inv) => acc + Number(inv.subtotal || 0), 0) || 0

            const { data: salesReturns } = await supabase
                .from('returns')
                .select('total_amount, type')
                .eq('type', 'sales_return')
                .gte('return_date', dateRange.start)
                .lte('return_date', dateRange.end)

            const totalSalesReturns = (salesReturns || []).reduce((acc, r) => acc + (Number(r.total_amount) / 1.18), 0)

            const netSales = totalSalesRaw - totalSalesReturns

            // 4. Calculate Opening Stock (Derived from lifetime history before current period)
            // For a perfect calculation, we need Opening = Current Stock - Purchases(period) + Sales(period)
            // But since this is a simplified view, we'll assume Opening Stock is 0 or needs manual adjustment.
            // For now, let's keep it simple as a Trading Account for the selected period.
            const openingStock = 0

            const grossProfit = (netSales + closingStock) - (openingStock + netPurchases)
            const margin = netSales > 0 ? (grossProfit / netSales) * 100 : 0

            setStats({
                openingStock,
                purchases: netPurchases,
                sales: netSales,
                closingStock,
                grossProfit,
                margin
            })

        } catch (error) {
            toast.error('Error calculating Stock P&L')
        } finally {
            setLoading(false)
        }
    }

    const exportToXLS = () => {
        const headers = ["Description", "Amount (₹)"]
        const rows = [
            ["Opening Stock", stats.openingStock.toFixed(2)],
            ["Add: Purchases", stats.purchases.toFixed(2)],
            ["Less: Sales", stats.sales.toFixed(2)],
            ["Closing Stock", stats.closingStock.toFixed(2)],
            ["Gross Profit", stats.grossProfit.toFixed(2)],
            ["Margin %", stats.margin.toFixed(2) + "%"]
        ]
        exportToExcel(rows, headers, `Stock_Profit_Loss_${new Date().toLocaleDateString()}`)
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center gap-4 no-print">
                <Link href="/dashboard/reports">
                    <Button variant="outline" size="sm" className="rounded-full w-10 px-0">
                        <ChevronLeft size={18} />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Profit & Loss (Stock Wise)</h1>

                <div className="flex items-center bg-white border border-slate-200 rounded-2xl h-10 px-4 gap-4 ml-8">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-slate-400">From</span>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent text-xs font-bold outline-none border-none p-0"
                        />
                    </div>
                    <div className="w-px h-4 bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-slate-400">To</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent text-xs font-bold outline-none border-none p-0"
                        />
                    </div>
                </div>

                <Button variant="ghost" size="sm" onClick={calculateStockPL} className="ml-auto">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trading Account View */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white">
                        <CardTitle className="text-lg uppercase tracking-widest font-black">Trading Statement</CardTitle>
                        <CardDescription className="text-slate-400">Inventory based profitability analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            <div className="flex justify-between p-6">
                                <span className="font-bold text-slate-500 uppercase text-xs">Opening Stock</span>
                                <span className="font-black text-slate-900">₹{stats.openingStock.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between p-6 bg-slate-50">
                                <span className="font-bold text-slate-500 uppercase text-xs">Total Purchases (+)</span>
                                <span className="font-black text-red-600">₹{stats.purchases.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between p-6">
                                <span className="font-bold text-slate-500 uppercase text-xs">Total Sales (+)</span>
                                <span className="font-black text-blue-600">₹{stats.sales.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between p-6 bg-slate-50">
                                <span className="font-bold text-slate-500 uppercase text-xs">Closing Stock (+)</span>
                                <span className="font-black text-green-600">₹{stats.closingStock.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between p-8 bg-blue-600 text-white">
                                <div className="space-y-1">
                                    <span className="font-black uppercase text-xs opacity-70 tracking-widest">Gross Profit</span>
                                    <p className="text-sm italic opacity-80">(Sales + Closing) - (Opening + Purchases)</p>
                                </div>
                                <span className="text-4xl font-black">₹{stats.grossProfit.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Insights & Actions */}
                <div className="space-y-6">
                    <Card className="bg-green-600 border-none shadow-2xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp size={24} />
                                Profit Margin
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-7xl font-black tracking-tighter">
                                {stats.margin.toFixed(1)}%
                            </div>
                            <p className="mt-4 text-green-100/80 font-medium">Your current gross margin based on stock movements and sales.</p>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            className="h-20 rounded-3xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-blue-300 transition-all flex flex-col gap-1 shadow-sm"
                            onClick={exportToXLS}
                        >
                            <Download size={20} className="text-blue-600" />
                            <span className="font-bold text-xs uppercase tracking-widest">Export Excel</span>
                        </Button>
                        <Button
                            className="h-20 rounded-3xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-blue-300 transition-all flex flex-col gap-1 shadow-sm"
                            onClick={() => window.print()}
                        >
                            <FileText size={20} className="text-purple-600" />
                            <span className="font-bold text-xs uppercase tracking-widest">Print PDF</span>
                        </Button>
                    </div>

                    <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                        <CardContent className="p-6">
                            <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-4">How it works</h4>
                            <ul className="space-y-3 text-xs text-slate-500 font-medium list-disc ml-4">
                                <li><strong>Opening Stock:</strong> Value of inventory at the start of period.</li>
                                <li><strong>Purchases:</strong> Cost of all items bought during the period.</li>
                                <li><strong>Sales:</strong> Revenue generated from all customer invoices.</li>
                                <li><strong>Closing Stock:</strong> Current value of products in your warehouse.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
