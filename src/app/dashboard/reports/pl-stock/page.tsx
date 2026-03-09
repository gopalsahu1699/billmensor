'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { IoTrendingUp, IoChevronBack, IoDownload, IoRefresh, IoDocument, IoShare } from "react-icons/io5"
import { toast } from 'sonner'
import Link from 'next/link'
import { exportToExcel } from '@/lib/excel-utils'
import { downloadPDF, sharePDF } from '@/lib/pdf-service'


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

    const calculateStockPL = React.useCallback(async () => {
        try {
            setLoading(true)

            // 1. Fetch all products for base opening stock and current unit costs
            const { data: products, error: prodError } = await supabase
                .from('products')
                .select('id, opening_stock_value, purchase_price, stock_quantity')
            if (prodError) throw prodError

            const unitCosts = new Map(products.map(p => [p.id, Number(p.purchase_price || 0)]))
            const initialBaseValue = products.reduce((acc, p) => acc + Number(p.opening_stock_value || 0), 0)

            // 2. Fetch all movements to reconstruct history
            const [salesRes, purRes, retRes, adjRes] = await Promise.all([
                supabase.from('invoice_items').select('product_id, quantity, invoices(invoice_date)').not('invoices.status', 'in', '("void", "draft", "cancelled")'),
                supabase.from('purchase_items').select('product_id, quantity, unit_price, purchases(purchase_date)'),
                supabase.from('return_items').select('product_id, quantity, returns(return_date, type)'),
                supabase.from('stock_adjustments').select('product_id, quantity, adjustment_type, created_at')
            ])

            const startDate = new Date(dateRange.start)
            const endDate = new Date(dateRange.end)
            endDate.setHours(23, 59, 59, 999) // End of day

            // Valuation helper
            interface MovementItem {
                product_id: string;
                quantity: number;
                unit_price?: number;
                adjustment_type?: string;
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                invoices?: any; // Supabase returns as array or object depending on join
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                purchases?: any;
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                returns?: any;
                created_at?: string;
            }

            const getValuation = (items: MovementItem[], type: 'sales' | 'purchases' | 'returns' | 'adjustments', filter: (date: Date) => boolean) => {
                return items.reduce((acc, item) => {
                    let dateStr: string | undefined

                    if (type === 'sales') {
                        const inv = Array.isArray(item.invoices) ? item.invoices[0] : item.invoices
                        dateStr = inv?.invoice_date
                    } else if (type === 'purchases') {
                        const pur = Array.isArray(item.purchases) ? item.purchases[0] : item.purchases
                        dateStr = pur?.purchase_date
                    } else if (type === 'returns') {
                        const ret = Array.isArray(item.returns) ? item.returns[0] : item.returns
                        dateStr = ret?.return_date
                    } else {
                        dateStr = item.created_at
                    }

                    if (!dateStr) return acc
                    const date = new Date(dateStr)
                    if (!filter(date)) return acc

                    const unitCost = unitCosts.get(item.product_id) || 0
                    const qty = Number(item.quantity || 0)

                    if (type === 'sales') return acc + (qty * unitCost)
                    if (type === 'purchases') return acc + (qty * Number(item.unit_price || unitCost))
                    if (type === 'returns') {
                        const ret = Array.isArray(item.returns) ? item.returns[0] : item.returns
                        if (!ret) return acc
                        const isSalesReturn = ret.type === 'sales_return'
                        return isSalesReturn ? acc + (qty * unitCost) : acc - (qty * unitCost)
                    }
                    if (type === 'adjustments') {
                        return item.adjustment_type === 'add' ? acc + (qty * unitCost) : acc - (qty * unitCost)
                    }
                    return acc
                }, 0)
            }

            // Calculations for BEFORE period (to get Opening Stock)
            const beforeFilter = (d: Date) => d < startDate
            const valBefore =
                getValuation(purRes.data || [], 'purchases', beforeFilter) +
                getValuation(adjRes.data || [], 'adjustments', beforeFilter) +
                getValuation(retRes.data || [], 'returns', beforeFilter) -
                getValuation(salesRes.data || [], 'sales', beforeFilter)

            const openingStock = initialBaseValue + valBefore

            // Calculations DURING period
            const duringFilter = (d: Date) => d >= startDate && d <= endDate

            // For P&L, we need Net Sales and Net Purchases (Taxable Value) during the period
            // Not just stock valuation, but the actual transaction revenue/cost
            const { data: invDuring } = await supabase.from('invoices')
                .select('subtotal').gte('invoice_date', dateRange.start).lte('invoice_date', dateRange.end)
                .not('status', 'in', '("void", "draft", "cancelled")')
            const { data: purDuring } = await supabase.from('purchases')
                .select('subtotal').gte('purchase_date', dateRange.start).lte('purchase_date', dateRange.end)
            const { data: retDuring } = await supabase.from('returns')
                .select('subtotal, type').gte('return_date', dateRange.start).lte('return_date', dateRange.end)

            const netSales = (invDuring?.reduce((a, b) => a + Number(b.subtotal || 0), 0) || 0) -
                (retDuring?.filter(r => r.type === 'sales_return').reduce((a, b) => a + Number(b.subtotal || 0), 0) || 0)

            const netPurchases = (purDuring?.reduce((a, b) => a + Number(b.subtotal || 0), 0) || 0) -
                (retDuring?.filter(r => r.type === 'purchase_return').reduce((a, b) => a + Number(b.subtotal || 0), 0) || 0)

            // Net Stock Movement during period at COST
            const stockMovementDuring =
                getValuation(purRes.data || [], 'purchases', duringFilter) +
                getValuation(adjRes.data || [], 'adjustments', duringFilter) +
                getValuation(retRes.data || [], 'returns', duringFilter) -
                getValuation(salesRes.data || [], 'sales', duringFilter)

            const closingStock = openingStock + stockMovementDuring

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

        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Error calculating Stock P&L')
        } finally {
            setLoading(false)
        }
    }, [dateRange.start, dateRange.end])

    useEffect(() => {
        calculateStockPL()
    }, [calculateStockPL])

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


    const handleShare = async () => {
        await sharePDF({
            elementId: 'report-content',
            filename: `Stock_Profit_Loss_${new Date().toLocaleDateString()}.pdf`,
            title: 'Profit & Loss Report (Stock Wise)',
            text: `Attached is the stock-wise profit & loss statement for the period ${dateRange.start} to ${dateRange.end}.`
        })
    }

    const handlePrint = async () => {
        await downloadPDF({
            elementId: 'report-content',
            filename: `Stock_Profit_Loss_${new Date().toLocaleDateString()}.pdf`
        })
    }



    return (
        <div id="report-content" className="space-y-8 pb-20">
            <div className="flex items-center gap-4 no-print">
                <Link href="/dashboard/reports">
                    <Button variant="outline" size="sm" className="rounded-full w-10 px-0">
                        <IoChevronBack size={18} />
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
                    <IoRefresh size={16} className={loading ? "animate-spin" : ""} />
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
                                <IoTrendingUp size={24} />
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                            className="h-20 rounded-3xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-blue-300 transition-all flex flex-col gap-1 shadow-sm"
                            onClick={exportToXLS}
                        >
                            <IoDownload size={20} className="text-blue-600" />
                            <span className="font-bold text-xs uppercase tracking-widest">Export Excel</span>
                        </Button>
                        <Button
                            className="h-20 rounded-3xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-blue-300 transition-all flex flex-col gap-1 shadow-sm"
                            onClick={handleShare}
                        >
                            <IoShare size={20} className="text-green-600" />
                            <span className="font-bold text-xs uppercase tracking-widest">Share PDF</span>
                        </Button>
                        <Button
                            className="h-20 rounded-3xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-blue-300 transition-all flex flex-col gap-1 shadow-sm"
                            onClick={handlePrint}
                        >
                            <IoDocument size={20} className="text-purple-600" />
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
