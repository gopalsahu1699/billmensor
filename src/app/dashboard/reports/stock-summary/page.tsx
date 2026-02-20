'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Package, Search, Download, FileText, ChevronLeft, AlertTriangle, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { exportToExcel } from '@/lib/excel-utils'

export default function StockSummaryReport() {
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchStockData()
    }, [])

    const fetchStockData = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('stock_quantity', { ascending: false })

            if (error) throw error
            setProducts(data || [])
        } catch (error: any) {
            toast.error('Error fetching stock data')
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalValuation = products.reduce((acc, curr) => acc + (curr.stock_quantity * curr.purchase_price), 0)
    const lowStockItems = products.filter(p => p.stock_quantity <= (p.min_stock_level || 5)).length

    const exportToXLS = () => {
        const headers = ["Product Name", "Category", "Current Stock", "Unit Price (Purchase)", "Total Value"]
        const rows = products.map(p => [
            p.name,
            p.category || 'Uncategorized',
            p.stock_quantity,
            p.purchase_price.toFixed(2),
            (p.stock_quantity * p.purchase_price).toFixed(2)
        ])

        exportToExcel(rows, headers, `Stock_Summary_${new Date().toLocaleDateString()}`)
        toast.success("Stock Summary Exported")
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-6 print:space-y-4">
            <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
                <h1 className="text-2xl font-bold">Inventory Stock Summary Report</h1>
                <p className="text-slate-500">As of: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="flex items-center gap-4 no-print">
                <Link href="/dashboard/reports">
                    <Button variant="outline" size="sm" className="rounded-full w-10 px-0">
                        <ChevronLeft size={18} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Stock Summary</h1>
                    <p className="text-slate-500 text-sm">Real-time inventory valuation and replenishment status.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 text-sm font-bold uppercase">Total Valuation</p>
                                <h3 className="text-2xl font-black text-blue-900">₹{totalValuation.toLocaleString('en-IN')}</h3>
                            </div>
                            <div className="p-3 bg-blue-200/50 rounded-xl text-blue-700">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-orange-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-600 text-sm font-bold uppercase">Low Stock Alerts</p>
                                <h3 className="text-2xl font-black text-orange-900">{lowStockItems} Items</h3>
                            </div>
                            <div className="p-3 bg-orange-200/50 rounded-xl text-orange-700">
                                <AlertTriangle size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-purple-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-600 text-sm font-bold uppercase">Total Items In Stock</p>
                                <h3 className="text-2xl font-black text-purple-900">{products.length} Products</h3>
                            </div>
                            <div className="p-3 bg-purple-200/50 rounded-xl text-purple-700">
                                <Package size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Actions */}
            <Card className="no-print">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" size={18} />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handlePrint} disabled={products.length === 0}>
                                <FileText size={18} className="mr-2" /> PDF
                            </Button>
                            <Button variant="outline" onClick={exportToXLS} disabled={products.length === 0} className="border-green-200 text-green-700 hover:bg-green-50">
                                <Download size={18} className="mr-2" /> XLS
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stock Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Product Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Current Stock</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Purchase Rate</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Stock Valuation</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase no-print">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading inventory data...</td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No products found matching your search.</td>
                                    </tr>
                                ) : filteredProducts.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{p.category || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "font-bold px-2 py-0.5 rounded",
                                                p.stock_quantity <= (p.min_stock_level || 5) ? "bg-red-50 text-red-600" : "text-slate-900"
                                            )}>
                                                {p.stock_quantity} {p.unit || 'pcs'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 underline decoration-slate-200">₹{p.purchase_price.toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-4 font-bold text-blue-600">₹{(p.stock_quantity * p.purchase_price).toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-4 no-print">
                                            {p.stock_quantity <= (p.min_stock_level || 5) ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                                    <AlertTriangle size={12} /> Low Stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                    In Stock
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
