'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Download, Loader2, Share2, Calculator, Receipt, TrendingUp, Filter, Banknote, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { downloadPDF } from '@/lib/pdf-utils'

export default function CAAuditReportPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })

    const [auditData, setAuditData] = useState({
        sales: { total: 0, taxable: 0, localTaxable: 0, igstTaxable: 0, igst: 0, cgst: 0, sgst: 0, count: 0, list: [] as any[] },
        purchases: { total: 0, taxable: 0, tax: 0, count: 0, list: [] as any[] },
        returns: { sales: 0, salesTaxable: 0, purchase: 0, purchaseTaxable: 0, totalTax: 0, list: [] as any[] },
        expenses: { total: 0, categories: {} as any, list: [] as any[] },
        netProfit: 0
    })

    useEffect(() => {
        fetchAuditData()
    }, [dateRange])

    async function fetchAuditData() {
        try {
            setLoading(true)

            // 1. Fetch Profile
            const { data: profData } = await supabase.from('profiles').select('*').single()
            setProfile(profData)
            const businessState = profData?.place_of_supply?.toLowerCase()

            // 2. Fetch Sales (Invoices)
            const { data: invoices } = await supabase
                .from('invoices')
                .select('*, customers:customer_id(name)')
                .gte('invoice_date', dateRange.start)
                .lte('invoice_date', dateRange.end)
                .not('status', 'in', '("void", "draft")')

            const salesAgg = (invoices || []).reduce((acc, inv) => {
                const tax = Number(inv.tax_total || 0)
                const isInterState = inv.supply_place && businessState && inv.supply_place.toLowerCase() !== businessState

                let igst = 0, cgst = 0, sgst = 0
                if (isInterState) {
                    igst = tax
                    acc.igstTaxable += Number(inv.subtotal || 0)
                } else {
                    cgst = tax / 2
                    sgst = tax / 2
                    acc.localTaxable += Number(inv.subtotal || 0)
                }

                return {
                    ...acc,
                    total: acc.total + Number(inv.total_amount || 0),
                    taxable: acc.taxable + Number(inv.subtotal || 0),
                    igst: acc.igst + igst,
                    cgst: acc.cgst + cgst,
                    sgst: acc.sgst + sgst,
                    count: acc.count + 1,
                    list: [...acc.list, inv]
                }
            }, { total: 0, taxable: 0, localTaxable: 0, igstTaxable: 0, igst: 0, cgst: 0, sgst: 0, count: 0, list: [] as any[] })

            // 3. Fetch Purchases
            const { data: purchases } = await supabase
                .from('purchases')
                .select('*, suppliers:supplier_id(name)')
                .gte('purchase_date', dateRange.start)
                .lte('purchase_date', dateRange.end)

            const purAgg = (purchases || []).reduce((acc, pur) => {
                return {
                    total: acc.total + Number(pur.total_amount || 0),
                    taxable: acc.taxable + Number(pur.subtotal || 0),
                    tax: acc.tax + Number(pur.tax_total || 0),
                    count: acc.count + 1,
                    list: [...acc.list, pur]
                }
            }, { total: 0, taxable: 0, tax: 0, count: 0, list: [] as any[] })

            // 4. Fetch Expenses
            const { data: expenses } = await supabase
                .from('expenses')
                .select('*')
                .gte('expense_date', dateRange.start)
                .lte('expense_date', dateRange.end)

            const expAgg = (expenses || []).reduce((acc, exp) => {
                const cat = exp.category || 'General'
                acc.total += Number(exp.amount || 0)
                acc.categories[cat] = (acc.categories[cat] || 0) + Number(exp.amount || 0)
                acc.list.push(exp)
                return acc
            }, { total: 0, categories: {} as any, list: [] as any[] })

            // 5. Fetch Returns & Precise Return Items
            const { data: returnsData } = await supabase
                .from('returns')
                .select('*, customers:customer_id(name)')
                .gte('return_date', dateRange.start)
                .lte('return_date', dateRange.end)

            // Fetch return items for all returns to get exact taxable/tax
            const returnIds = (returnsData || []).map(r => r.id)
            const { data: returnItems } = await supabase
                .from('return_items')
                .select('*')
                .in('return_id', returnIds)

            const retAgg = (returnsData || []).reduce((acc, ret) => {
                const items = (returnItems || []).filter(item => item.return_id === ret.id)
                const taxable = items.reduce((sum, i) => sum + Number(i.total - i.tax_amount), 0)
                const tax = items.reduce((sum, i) => sum + Number(i.tax_amount), 0)

                if (ret.type === 'sales_return') {
                    acc.sales += Number(ret.total_amount || 0)
                    acc.salesTaxable += taxable
                } else {
                    acc.purchase += Number(ret.total_amount || 0)
                    acc.purchaseTaxable += taxable
                }
                acc.totalTax += tax
                acc.list.push(ret)
                return acc
            }, { sales: 0, salesTaxable: 0, purchase: 0, purchaseTaxable: 0, totalTax: 0, list: [] as any[] })

            setAuditData({
                sales: salesAgg,
                purchases: purAgg,
                returns: retAgg,
                expenses: expAgg,
                netProfit: (salesAgg.taxable - retAgg.salesTaxable) - (purAgg.taxable - retAgg.purchaseTaxable) - expAgg.total
            })

        } catch (error: any) {
            toast.error('Failed to aggregate audit data')
        } finally {
            setLoading(false)
        }
    }

    async function handleShare() {
        try {
            await downloadPDF('ca-audit-render', `Audit_Report_${dateRange.start}_to_${dateRange.end}`)
            toast.success('Audit report generated')
        } catch (error) {
            toast.error('PDF generation failed')
        }
    }

    if (loading && !profile) return (
        <div className="py-40 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
            <p className="text-slate-500 font-medium font-black uppercase tracking-widest text-[10px]">Assembling Audit Intelligence...</p>
        </div>
    )

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Action Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-2xl h-12 w-12 hover:bg-slate-100 transition-all">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Compliance Center</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Chartered Accountant Export</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Consolidated Audit</h1>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-12 px-4 gap-4">
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
                    <Button
                        onClick={handleShare}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                    >
                        <Download size={18} /> Export PDF for CA
                    </Button>
                </div>
            </div>

            {/* Audit Document Area */}
            <div id="ca-audit-render" className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden print:shadow-none print:border-none">
                <div className="p-12 lg:p-20 space-y-16">
                    {/* Document Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-12">
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
                                <Calculator size={32} />
                            </div>
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Consolidated <br />Audit Report</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">
                                    Fiscal Year {(() => {
                                        const d = new Date(dateRange.start);
                                        const yr = d.getFullYear();
                                        return d.getMonth() >= 3 ? `${yr}-${(yr + 1).toString().slice(-2)}` : `${yr - 1}-${yr.toString().slice(-2)}`;
                                    })()} | Generated via Khata
                                </p>
                            </div>
                        </div>
                        <div className="text-right space-y-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Business Identity</p>
                                <p className="text-xl font-black text-slate-900">{profile?.company_name}</p>
                                <p className="text-[11px] font-black text-primary mt-1 uppercase tracking-widest">GSTIN: {profile?.gstin || 'UNREGISTERED'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Reporting Period</p>
                                <p className="text-sm font-black text-slate-900 leading-none">
                                    {new Date(dateRange.start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — {new Date(dateRange.end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Matrix Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-blue-50/50 p-8 rounded-[32px] border border-blue-100/50">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Total Revenue (Gross)</p>
                            <h3 className="text-3xl font-black text-slate-900 italic">₹{auditData.sales.total.toLocaleString('en-IN')}</h3>
                            <div className="mt-4 pt-4 border-t border-blue-200/30 flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                <span>Invoices: {auditData.sales.count}</span>
                                <span>Taxable: ₹{auditData.sales.taxable.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="bg-amber-50/50 p-8 rounded-[32px] border border-amber-100/50">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">Acquisitions (Purchases)</p>
                            <h3 className="text-3xl font-black text-slate-900 italic">₹{auditData.purchases.total.toLocaleString('en-IN')}</h3>
                            <div className="mt-4 pt-4 border-t border-amber-200/30 flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                <span>Bills: {auditData.purchases.count}</span>
                                <span>Input Credit: ₹{auditData.purchases.tax.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl shadow-slate-900/20">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Net Operating Margin</p>
                            <h3 className={`text-4xl font-black italic ${auditData.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ₹{Math.abs(auditData.netProfit).toLocaleString('en-IN')}
                                {auditData.netProfit < 0 && <span className="text-sm ml-2 font-black uppercase tracking-widest">(Loss)</span>}
                            </h3>
                            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">After all deductions</p>
                        </div>
                    </div>

                    {/* Tax Breakdown */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                                <TrendingUp size={16} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Taxation Breakdown (Liability)</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <th className="px-6 py-4">Tax Component</th>
                                        <th className="px-6 py-4 text-right">Taxable Amount</th>
                                        <th className="px-6 py-4 text-right">Tax Value</th>
                                        <th className="px-6 py-4 text-right">Total (Gross)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td className="px-6 py-6 font-black text-slate-900 uppercase italic">IGST (Inter-state)</td>
                                        <td className="px-6 py-6 text-right font-bold text-slate-500">₹{auditData.sales.igstTaxable.toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-6 text-right font-black text-blue-600">₹{auditData.sales.igst.toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-6 text-right font-black text-slate-900">₹{(auditData.sales.igstTaxable + auditData.sales.igst).toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-6 font-black text-slate-900 uppercase italic">CGST (Central)</td>
                                        <td className="px-6 py-6 text-right font-bold text-slate-500">₹{(auditData.sales.localTaxable).toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-6 text-right font-black text-blue-600">₹{auditData.sales.cgst.toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-6 text-right font-black text-slate-900">₹{(auditData.sales.localTaxable + auditData.sales.cgst).toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-6 font-black text-slate-900 uppercase italic">SGST (State)</td>
                                        <td className="px-6 py-6 text-right font-bold text-slate-500">₹{(auditData.sales.localTaxable).toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-6 text-right font-black text-blue-600">₹{auditData.sales.sgst.toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-6 text-right font-black text-slate-900">₹{(auditData.sales.localTaxable + auditData.sales.sgst).toLocaleString('en-IN')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Operational Expenses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                                    <Receipt size={16} />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Expense Portfolio</h3>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(auditData.expenses.categories).map(([cat, amt]: any) => (
                                    <div key={cat} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{cat}</span>
                                        <span className="text-sm font-black text-slate-900">₹{amt.toLocaleString('en-IN')}</span>
                                    </div>
                                ))}
                                {Object.keys(auditData.expenses.categories).length === 0 && (
                                    <p className="text-xs text-slate-400 italic">No operational expenses recorded in this period.</p>
                                )}
                                <div className="pt-4 flex justify-between items-center border-t-2 border-slate-900">
                                    <span className="text-[11px] font-black uppercase text-slate-900 tracking-widest">Total Operating Cost</span>
                                    <span className="text-lg font-black text-slate-900">₹{auditData.expenses.total.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Audit Verification */}
                        <div className="bg-slate-900 rounded-[32px] p-10 flex flex-col justify-between text-white border-4 border-slate-800">
                            <div>
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Verification Note</h4>
                                <p className="text-xs text-slate-400 leading-relaxed italic">
                                    "This report summarizes all digital records for the selected period. For accurate tax assessment, please verify these figures against your bank statements and physical receipts."
                                </p>
                            </div>
                            <div className="pt-10 space-y-4">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest border-b border-white/10 pb-4">
                                    <span className="text-slate-500">Acquisition Outflow</span>
                                    <span>₹{auditData.purchases.total.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                                    <span className="text-primary">Net Tax Liability (Payable)</span>
                                    <span className="text-xl italic">
                                        ₹{Math.max(0, (auditData.sales.igst + auditData.sales.cgst + auditData.sales.sgst) - auditData.purchases.tax).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                {(auditData.purchases.tax > (auditData.sales.igst + auditData.sales.cgst + auditData.sales.sgst)) && (
                                    <div className="flex justify-between text-[9px] font-bold text-green-400 uppercase tracking-widest mt-1">
                                        <span>ITC Carry Forward</span>
                                        <span>₹{(auditData.purchases.tax - (auditData.sales.igst + auditData.sales.cgst + auditData.sales.sgst)).toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Annexure: Transaction Logs */}
                    <div className="space-y-16 pt-16 border-t-2 border-slate-900">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Annexure: Detailed Transaction Logs</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Complete list of all recorded transactions for cross-verification</p>
                            </div>
                        </div>

                        {/* Sales Register */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] pl-2 border-l-4 border-blue-600">Sales Register (GSTR-1 Data)</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-50 font-black uppercase tracking-widest text-slate-400 border-y border-slate-100">
                                            <th className="px-4 py-3 text-left">Date</th>
                                            <th className="px-4 py-3 text-left">Invoice #</th>
                                            <th className="px-4 py-3 text-left">Customer</th>
                                            <th className="px-4 py-3 text-right">Taxable</th>
                                            <th className="px-4 py-3 text-right">GST</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                                        {auditData.sales.list.map((inv) => (
                                            <tr key={inv.id}>
                                                <td className="px-4 py-3">{new Date(inv.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                                <td className="px-4 py-3 text-slate-900 uppercase">{inv.invoice_number}</td>
                                                <td className="px-4 py-3 truncate max-w-[150px] uppercase">{inv.customers?.name || 'Cash Sale'}</td>
                                                <td className="px-4 py-3 text-right font-black">₹{Number(inv.subtotal).toLocaleString('en-IN')}</td>
                                                <td className="px-4 py-3 text-right">₹{Number(inv.tax_total).toLocaleString('en-IN')}</td>
                                                <td className="px-4 py-3 text-right text-slate-900 font-black">₹{Number(inv.total_amount).toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Purchase Register */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] pl-2 border-l-4 border-amber-600">Purchase Register (GSTR-2 Data)</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-50 font-black uppercase tracking-widest text-slate-400 border-y border-slate-100">
                                            <th className="px-4 py-3 text-left">Date</th>
                                            <th className="px-4 py-3 text-left">Bill #</th>
                                            <th className="px-4 py-3 text-left">Supplier</th>
                                            <th className="px-4 py-3 text-right">Taxable</th>
                                            <th className="px-4 py-3 text-right">GST</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                                        {auditData.purchases.list.map((pur) => (
                                            <tr key={pur.id}>
                                                <td className="px-4 py-3">{new Date(pur.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                                <td className="px-4 py-3 text-slate-900 uppercase">{pur.purchase_number}</td>
                                                <td className="px-4 py-3 truncate max-w-[150px] uppercase">{pur.suppliers?.name || 'Unknown'}</td>
                                                <td className="px-4 py-3 text-right font-black">₹{Number(pur.subtotal).toLocaleString('en-IN')}</td>
                                                <td className="px-4 py-3 text-right">₹{Number(pur.tax_total).toLocaleString('en-IN')}</td>
                                                <td className="px-4 py-3 text-right text-slate-900 font-black">₹{Number(pur.total_amount).toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Expense Log */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] pl-2 border-l-4 border-red-600">Operational Expense Log</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-50 font-black uppercase tracking-widest text-slate-400 border-y border-slate-100">
                                            <th className="px-4 py-3 text-left">Date</th>
                                            <th className="px-4 py-3 text-left">Description</th>
                                            <th className="px-4 py-3 text-left">Category</th>
                                            <th className="px-4 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                                        {auditData.expenses.list.map((exp) => (
                                            <tr key={exp.id}>
                                                <td className="px-4 py-3">{new Date(exp.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                                <td className="px-4 py-3 text-slate-900 uppercase">{exp.title}</td>
                                                <td className="px-4 py-3 uppercase">{exp.category}</td>
                                                <td className="px-4 py-3 text-right text-slate-900 font-black">₹{Number(exp.amount).toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Returns Log */}
                        {auditData.returns.list.length > 0 && (
                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] pl-2 border-l-4 border-slate-600">Returns (Debit/Credit Notes)</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[10px]">
                                        <thead>
                                            <tr className="bg-slate-50 font-black uppercase tracking-widest text-slate-400 border-y border-slate-100">
                                                <th className="px-4 py-3 text-left">Date</th>
                                                <th className="px-4 py-3 text-left">Type</th>
                                                <th className="px-4 py-3 text-left">Party</th>
                                                <th className="px-4 py-3 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                                            {auditData.returns.list.map((ret) => (
                                                <tr key={ret.id}>
                                                    <td className="px-4 py-3">{new Date(ret.return_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                                    <td className="px-4 py-3 text-slate-900 uppercase font-black italic">{ret.type.replace('_', ' ')}</td>
                                                    <td className="px-4 py-3 truncate max-w-[150px] uppercase">{ret.customers?.name || 'Unknown'}</td>
                                                    <td className="px-4 py-3 text-right text-slate-900 font-black">₹{Number(ret.total_amount).toLocaleString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Signature */}
                    <div className="flex justify-between items-end pt-12 border-t border-slate-100 opacity-60">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Generated On</p>
                            <p className="text-xs font-bold text-slate-900">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right space-y-4">
                            <div className="h-px w-48 bg-slate-900 ml-auto opacity-20"></div>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Authorized Signatory (Seal & Signature)</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .max-w-5xl { max-width: 100% !important; margin: 0 !important; width: 100% !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    .shadow-2xl { box-shadow: none !important; border: none !important; }
                    .rounded-[40px], .rounded-[32px] { border-radius: 0 !important; }
                }
            `}</style>
        </div>
    )
}
