'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
    ArrowLeft,
    Package,
    History,
    TrendingUp,
    TrendingDown,
    Scale,
    Loader2,
    Edit,
    Trash2,
    Calendar,
    Tag,
    IndianRupee,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react'

interface LedgerEntry {
    id: string
    date: string
    type: 'sale' | 'purchase' | 'return_in' | 'return_out' | 'adjustment_add' | 'adjustment_reduce'
    reference: string
    party?: string
    qty_in: number
    qty_out: number
    balance: number
    description: string
    link?: string
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [product, setProduct] = useState<any>(null)
    const [ledger, setLedger] = useState<LedgerEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProductData()
    }, [id])

    async function fetchProductData() {
        try {
            setLoading(true)

            // 1. Fetch Product details
            const { data: prod, error: prodError } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single()

            if (prodError) throw prodError
            setProduct(prod)

            // 2. Fetch all movements
            const [salesRes, purRes, retRes, adjRes] = await Promise.all([
                supabase.from('invoice_items').select('*, invoices(invoice_number, invoice_date, customers(name))').eq('product_id', id),
                supabase.from('purchase_items').select('*, purchases(purchase_number, purchase_date, suppliers:supplier_id(name))').eq('product_id', id),
                supabase.from('return_items').select('*, returns(return_number, return_date, type, customers(name))').eq('product_id', id),
                supabase.from('stock_adjustments').select('*').eq('product_id', id)
            ])

            const entries: LedgerEntry[] = []

            // Process Sales (Qty Out)
            salesRes.data?.forEach(item => {
                entries.push({
                    id: item.id,
                    date: item.invoices.invoice_date,
                    type: 'sale',
                    reference: item.invoices.invoice_number,
                    party: item.invoices.customers?.name,
                    qty_in: 0,
                    qty_out: item.quantity,
                    balance: 0, // Calculated later
                    description: 'Sales Invoice',
                    link: `/dashboard/invoices/${item.invoice_id}`
                })
            })

            // Process Purchases (Qty In)
            purRes.data?.forEach(item => {
                entries.push({
                    id: item.id,
                    date: item.purchases.purchase_date,
                    type: 'purchase',
                    reference: item.purchases.purchase_number,
                    party: item.purchases.suppliers?.name,
                    qty_in: item.quantity,
                    qty_out: 0,
                    balance: 0,
                    description: 'Purchase Bill',
                    link: `/dashboard/purchases/${item.purchase_id}`
                })
            })

            // Process Returns
            retRes.data?.forEach(item => {
                const isSalesReturn = item.returns.type === 'sales_return'
                entries.push({
                    id: item.id,
                    date: item.returns.return_date,
                    type: isSalesReturn ? 'return_in' : 'return_out',
                    reference: item.returns.return_number,
                    party: item.returns.customers?.name,
                    qty_in: isSalesReturn ? item.quantity : 0,
                    qty_out: isSalesReturn ? 0 : item.quantity,
                    balance: 0,
                    description: isSalesReturn ? 'Sales Return (In)' : 'Purchase Return (Out)',
                    link: `/dashboard/returns/${item.return_id}`
                })
            })

            // Process Adjustments
            adjRes.data?.forEach(item => {
                const isAdd = item.adjustment_type === 'add'
                entries.push({
                    id: item.id,
                    date: item.created_at,
                    type: isAdd ? 'adjustment_add' : 'adjustment_reduce',
                    reference: 'MANUAL',
                    qty_in: isAdd ? item.quantity : 0,
                    qty_out: !isAdd ? item.quantity : 0,
                    balance: 0,
                    description: item.reason || 'Manual Adjustment'
                })
            })

            // Sort by date and calculate running balance
            // Note: Since we don't have historical snapshots, we calculate backwards from current stock
            // or forwards from 0. For simplicity, let's sort purely by date.
            const sorted = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

            let runningBal = 0
            sorted.forEach(e => {
                runningBal += (e.qty_in - e.qty_out)
                e.balance = runningBal
            })

            setLedger(sorted.reverse()) // Latest first in display

        } catch (error: any) {
            toast.error(error.message)
            router.push('/dashboard/products')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="py-40 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
            <p className="text-slate-500 font-medium tracking-tight">Recalculating stock ledger...</p>
        </div>
    )

    if (!product) return null

    const totalSold = ledger.filter(e => e.type === 'sale').reduce((s, e) => s + e.qty_out, 0)
    const totalPurchased = ledger.filter(e => e.type === 'purchase').reduce((s, e) => s + e.qty_in, 0)

    const getEntryIcon = (type: string) => {
        switch (type) {
            case 'sale': return <TrendingDown className="text-red-500" size={16} />
            case 'purchase': return <TrendingUp className="text-green-500" size={16} />
            case 'return_in': return <TrendingUp className="text-blue-500" size={16} />
            case 'return_out': return <TrendingDown className="text-orange-500" size={16} />
            default: return <Scale className="text-slate-400" size={16} />
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Action Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-2xl h-12 w-12 hover:bg-slate-100 transition-all">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Catalog Item</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{product.category || 'Uncategorized'}</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">{product.name}</h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/products/create?edit=${id}`)}
                        className="flex items-center gap-2 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Edit size={18} /> Edit Product
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar: Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden">
                        <div className="p-6 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Stock</p>
                                <div className="flex items-end gap-2">
                                    <h3 className="text-5xl font-black italic tracking-tighter text-white">{product.stock_quantity}</h3>
                                    <span className="text-xs font-bold text-slate-400 mb-2 uppercase">{product.unit || 'pcs'}</span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-slate-800">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">SKU / HSN</p>
                                    <p className="font-mono text-sm">{product.sku || 'N/A'}</p>
                                    {product.hsn_code && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">HSN: {product.hsn_code}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Selling Price</p>
                                        <p className="text-lg font-black text-blue-400 italic">₹{product.price}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Cost Price</p>
                                        <p className="text-lg font-black text-slate-400 italic">₹{product.purchase_price || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {product.stock_quantity < (product.min_stock_level || 5) && (
                            <div className="bg-red-600 px-6 py-3 flex items-center gap-2 animate-pulse">
                                <AlertTriangle size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Low Stock Alert</span>
                            </div>
                        )}
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader><CardTitle className="text-sm uppercase tracking-widest font-black text-slate-400">Performance</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-medium">Total Acquired</span>
                                <span className="text-sm font-black text-green-600">+{totalPurchased}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                <span className="text-xs text-slate-500 font-medium">Total Sold</span>
                                <span className="text-sm font-black text-red-600">-{totalSold}</span>
                            </div>
                            <div className="pt-2">
                                <p className="text-xs text-slate-400 italic leading-relaxed">Movement tracked across {ledger.length} entries.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Stock Ledger */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 px-8 py-6">
                            <CardTitle className="text-xl font-black text-slate-900 tracking-tight italic uppercase flex items-center gap-2">
                                <History className="text-primary" size={24} /> Stock Ledger
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto text-sm">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            <th className="px-8 py-4">Status & Movement</th>
                                            <th className="px-8 py-4">Reference / Account</th>
                                            <th className="px-8 py-4 text-center">In (+)</th>
                                            <th className="px-8 py-4 text-center">Out (-)</th>
                                            <th className="px-8 py-4 text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {ledger.map((entry, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white transition-all shadow-sm group-hover:shadow-md">
                                                            {getEntryIcon(entry.type)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{entry.description}</p>
                                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                                                                {new Date(entry.date).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div>
                                                        {entry.link ? (
                                                            <button
                                                                onClick={() => router.push(entry.link!)}
                                                                className="text-blue-600 font-black uppercase tracking-tight hover:underline text-xs"
                                                            >
                                                                {entry.reference}
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-400 font-black uppercase tracking-tight text-xs">{entry.reference}</span>
                                                        )}
                                                        {entry.party && <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{entry.party}</p>}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    {entry.qty_in > 0 ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-black">+{entry.qty_in}</span>
                                                    ) : <span className="text-slate-200">-</span>}
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    {entry.qty_out > 0 ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-black">-{entry.qty_out}</span>
                                                    ) : <span className="text-slate-200">-</span>}
                                                </td>
                                                <td className="px-8 py-5 text-right font-black italic text-slate-900">
                                                    {entry.balance}
                                                </td>
                                            </tr>
                                        ))}
                                        {ledger.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">
                                                    No movement recorded for this item yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
