'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { FileText, TrendingUp, TrendingDown, IndianRupee, Calendar, ChevronLeft, Download, FileCheck } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { exportToExcel } from '@/lib/excel-utils'

export default function GSTR3BReport() {
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })
    const [reportData, setReportData] = useState<any>({
        outward: { taxable: 0, igst: 0, cgst: 0, sgst: 0, total: 0 },
        inward: { taxable: 0, igst: 0, cgst: 0, sgst: 0, total: 0 },
        netTax: 0
    })

    useEffect(() => {
        fetchTaxSummary()
    }, [dateRange])

    const fetchTaxSummary = async () => {
        try {
            setLoading(true)

            // 1. Fetch Profile
            const { data: profData } = await supabase.from('profiles').select('*').single()
            setProfile(profData)
            const bizState = profData?.place_of_supply?.toLowerCase()

            // 2. Fetch Sales (Outward)
            const { data: sales, error: salesError } = await supabase
                .from('invoices')
                .select('subtotal, tax_total, total_amount, supply_place')
                .gte('invoice_date', dateRange.start)
                .lte('invoice_date', dateRange.end)
                .not('status', 'in', '("void", "draft")')

            if (salesError) throw salesError

            // 3. Fetch Purchases (Inward)
            const { data: purchases } = await supabase
                .from('purchases')
                .select('subtotal, tax_total, total_amount, supply_place')
                .gte('purchase_date', dateRange.start)
                .lte('purchase_date', dateRange.end)

            // 4. Fetch Returns & Precise Items
            const { data: returnsData } = await supabase
                .from('returns')
                .select('id, total_amount, type, supply_place')
                .gte('return_date', dateRange.start)
                .lte('return_date', dateRange.end)

            const returnIds = (returnsData || []).map(r => r.id)
            const { data: returnItems } = await supabase
                .from('return_items')
                .select('return_id, tax_amount, total')
                .in('return_id', returnIds)

            // 5. Aggregate Sales
            const outwardRaw = (sales || []).reduce((acc, inv) => {
                const tax = Number(inv.tax_total || 0)
                const taxable = Number(inv.subtotal || 0)
                const isInterState = inv.supply_place && bizState && inv.supply_place.toLowerCase() !== bizState

                return {
                    taxable: acc.taxable + taxable,
                    tax: acc.tax + tax,
                    igst: acc.igst + (isInterState ? tax : 0),
                    cgst: acc.cgst + (!isInterState ? tax / 2 : 0),
                    sgst: acc.sgst + (!isInterState ? tax / 2 : 0),
                    total: acc.total + Number(inv.total_amount || 0)
                }
            }, { taxable: 0, tax: 0, igst: 0, cgst: 0, sgst: 0, total: 0 })

            // 6. Aggregate Purchases (ITC)
            const inwardRaw = (purchases || []).reduce((acc, pur) => {
                const tax = Number(pur.tax_total || 0)
                const taxable = Number(pur.subtotal || 0)
                const isInterState = pur.supply_place && bizState && pur.supply_place.toLowerCase() !== bizState

                return {
                    taxable: acc.taxable + taxable,
                    tax: acc.tax + tax,
                    igst: acc.igst + (isInterState ? tax : 0),
                    cgst: acc.cgst + (!isInterState ? tax / 2 : 0),
                    sgst: acc.sgst + (!isInterState ? tax / 2 : 0),
                    total: acc.total + Number(pur.total_amount || 0)
                }
            }, { taxable: 0, tax: 0, igst: 0, cgst: 0, sgst: 0, total: 0 })

            // 7. Aggregate Returns for Offsets
            const returnsAgg = (returnsData || []).reduce((acc, ret) => {
                const items = (returnItems || []).filter(item => item.return_id === ret.id)
                const tax = items.reduce((sum, i) => sum + Number(i.tax_amount || 0), 0)
                const taxable = items.reduce((sum, i) => sum + (Number(i.total || 0) - Number(i.tax_amount || 0)), 0)
                const isInterState = ret.supply_place && bizState && ret.supply_place.toLowerCase() !== bizState

                if (ret.type === 'sales_return') {
                    acc.s_taxable += taxable
                    acc.s_tax += tax
                    acc.s_igst += isInterState ? tax : 0
                    acc.s_cgst += !isInterState ? tax / 2 : 0
                    acc.s_sgst += !isInterState ? tax / 2 : 0
                } else {
                    acc.p_taxable += taxable
                    acc.p_tax += tax
                    acc.p_igst += isInterState ? tax : 0
                    acc.p_cgst += !isInterState ? tax / 2 : 0
                    acc.p_sgst += !isInterState ? tax / 2 : 0
                }
                return acc
            }, {
                s_taxable: 0, s_tax: 0, s_igst: 0, s_cgst: 0, s_sgst: 0,
                p_taxable: 0, p_tax: 0, p_igst: 0, p_cgst: 0, p_sgst: 0
            })

            // 8. Calculate Final Consolidated Stats
            const outward = {
                taxable: outwardRaw.taxable - returnsAgg.s_taxable,
                igst: outwardRaw.igst - returnsAgg.s_igst,
                cgst: outwardRaw.cgst - returnsAgg.s_cgst,
                sgst: outwardRaw.sgst - returnsAgg.s_sgst,
                tax: outwardRaw.tax - returnsAgg.s_tax,
                total: outwardRaw.total - (returnsAgg.s_taxable + returnsAgg.s_tax)
            }

            const inward = {
                taxable: inwardRaw.taxable - returnsAgg.p_taxable,
                igst: inwardRaw.igst - returnsAgg.p_igst,
                cgst: inwardRaw.cgst - returnsAgg.p_cgst,
                sgst: inwardRaw.sgst - returnsAgg.p_sgst,
                tax: inwardRaw.tax - returnsAgg.p_tax,
                total: inwardRaw.total - (returnsAgg.p_taxable + returnsAgg.p_tax)
            }

            setReportData({
                outward,
                inward,
                netTax: outward.tax - inward.tax
            })

        } catch (error: any) {
            toast.error('Error generating 3B summary')
        } finally {
            setLoading(false)
        }
    }

    const exportToXLS = () => {
        const headers = ["Section", "Description", "Taxable Value", "Integrated Tax (IGST)", "Central Tax (CGST)", "State Tax (SGST)", "Total Tax"]
        const rows = [
            ["3.1", "Outward Taxable Supplies (Sales)", reportData.outward.taxable.toFixed(2), reportData.outward.igst.toFixed(2), reportData.outward.cgst.toFixed(2), reportData.outward.sgst.toFixed(2), reportData.outward.tax.toFixed(2)],
            ["4.0", "Eligible ITC (Purchases)", reportData.inward.taxable.toFixed(2), reportData.inward.igst.toFixed(2), reportData.inward.cgst.toFixed(2), reportData.inward.sgst.toFixed(2), reportData.inward.tax.toFixed(2)],
            ["6.1", "Net Tax Payable", "-", "-", "-", "-", reportData.netTax.toFixed(2)]
        ]

        exportToExcel(rows, headers, `GSTR3B_Summary_${dateRange.start}`)
    }

    const handlePrint = () => window.print()

    return (
        <div className="space-y-6 print:space-y-4">
            <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
                <h1 className="text-2xl font-bold">GSTR-3B Monthly Tax Summary</h1>
                <p className="text-slate-500">Period: {dateRange.start} to {dateRange.end}</p>
            </div>

            <div className="flex items-center gap-4 no-print">
                <Link href="/dashboard/reports">
                    <Button variant="outline" size="sm" className="rounded-full w-10 px-0">
                        <ChevronLeft size={18} />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">GSTR-3B Summary</h1>
            </div>

            {/* Date Filter Card */}
            <Card className="no-print border-blue-100 bg-blue-50/30">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500">End Date</label>
                                <input
                                    type="date"
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button onClick={fetchTaxSummary} isLoading={loading} className="bg-blue-600 h-11 px-8">
                            Generate Summary
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handlePrint} className="h-11">
                                <FileText size={18} />
                            </Button>
                            <Button variant="outline" onClick={exportToXLS} className="h-11">
                                <Download size={18} />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Outward Taxable Supplies */}
                <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                    <div className="bg-blue-600 h-1"></div>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="text-blue-600" size={20} />
                            3.1 Outward Taxable Supplies
                        </CardTitle>
                        <CardDescription>All sales and liabilities for the period</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-500 font-medium">Taxable Value</span>
                            <span className="font-bold">₹{reportData.outward.taxable.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 border border-slate-100 rounded-lg text-center">
                                <p className="text-[10px] uppercase font-bold text-slate-400">IGST</p>
                                <p className="font-bold text-sm">₹{reportData.outward.igst.toFixed(2)}</p>
                            </div>
                            <div className="p-3 border border-slate-100 rounded-lg text-center">
                                <p className="text-[10px] uppercase font-bold text-slate-400">CGST</p>
                                <p className="font-bold text-sm">₹{reportData.outward.cgst.toFixed(2)}</p>
                            </div>
                            <div className="p-3 border border-slate-100 rounded-lg text-center">
                                <p className="text-[10px] uppercase font-bold text-slate-400">SGST</p>
                                <p className="font-bold text-sm">₹{reportData.outward.sgst.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="pt-2 border-t flex justify-between items-center">
                            <span className="font-black uppercase text-xs">Total Tax Liability</span>
                            <span className="text-xl font-black text-blue-600">₹{(reportData.outward.igst + reportData.outward.cgst + reportData.outward.sgst).toLocaleString('en-IN')}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Inward Supplies / ITC */}
                <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                    <div className="bg-green-600 h-1"></div>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingDown className="text-green-600" size={20} />
                            4.0 Eligible ITC
                        </CardTitle>
                        <CardDescription>Input tax credit on purchases</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-500 font-medium">Taxable Value</span>
                            <span className="font-bold">₹{reportData.inward.taxable.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-4 border border-green-100 bg-green-50/50 rounded-xl flex justify-between items-center">
                            <div>
                                <p className="text-xs font-bold text-green-700 uppercase">Input Tax Credit Available</p>
                                <p className="text-2xl font-black text-green-800">₹{reportData.inward.tax.toLocaleString('en-IN')}</p>
                            </div>
                            <FileCheck className="text-green-600 opacity-20" size={48} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 border border-green-100/50 rounded-lg text-center bg-white">
                                <p className="text-[9px] uppercase font-bold text-slate-400">IGST</p>
                                <p className="font-bold text-xs text-green-600">₹{reportData.inward.igst.toFixed(2)}</p>
                            </div>
                            <div className="p-2 border border-green-100/50 rounded-lg text-center bg-white">
                                <p className="text-[9px] uppercase font-bold text-slate-400">CGST</p>
                                <p className="font-bold text-xs text-green-600">₹{reportData.inward.cgst.toFixed(2)}</p>
                            </div>
                            <div className="p-2 border border-green-100/50 rounded-lg text-center bg-white">
                                <p className="text-[9px] uppercase font-bold text-slate-400">SGST</p>
                                <p className="font-bold text-xs text-green-600">₹{reportData.inward.sgst.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Net Tax Payable */}
            <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
                <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-widest">
                            Financial Summary
                        </div>
                        <h2 className="text-3xl font-black">Net Tax Liability</h2>
                        <p className="text-slate-400 text-sm max-w-sm">
                            The amount of tax after deducting ITC from your total outward supplies.
                        </p>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-tighter">Tax Payable to Govt</p>
                        <div className="flex items-center justify-center md:justify-end gap-3 text-5xl md:text-6xl font-black">
                            {reportData.netTax < 0 ? (
                                <>
                                    <span className="text-green-400">₹0.00</span>
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded uppercase tracking-widest">Extra ITC</span>
                                </>
                            ) : (
                                <span className="text-blue-400">₹{reportData.netTax.toLocaleString('en-IN')}</span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
