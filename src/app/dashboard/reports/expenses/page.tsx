'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Wallet, Calendar, ChevronLeft, Download, PieChart, ArrowDown, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { exportToExcel } from '@/lib/excel-utils'

export default function ExpenseSummaryReport() {
    const [loading, setLoading] = useState(false)
    const [expenses, setExpenses] = useState<any[]>([])
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        fetchExpenses()
    }, [])

    async function fetchExpenses() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .gte('expense_date', dateRange.start)
                .lte('expense_date', dateRange.end)
                .order('expense_date', { ascending: false })

            if (error) throw error
            setExpenses(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const exportToXLS = () => {
        const headers = ["Date", "Category", "Description", "Amount"]
        const rows = expenses.map(exp => [
            new Date(exp.expense_date).toLocaleDateString(),
            exp.category,
            exp.description,
            exp.amount.toFixed(2)
        ])

        exportToExcel(rows, headers, `Expense_Report_${dateRange.start}`)
        toast.success("Excel Report Exported")
    }

    const handlePrint = () => {
        window.print()
    }

    const categoryTotals: any = {}
    let grandTotal = 0
    expenses.forEach(exp => {
        const cat = exp.category || 'Uncategorized'
        categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount
        grandTotal += exp.amount
    })

    const sortedCategories = Object.entries(categoryTotals).sort((a: any, b: any) => b[1] - a[1])

    return (
        <div className="space-y-6 print:space-y-4">
            <div className="hidden print:block border-b-2 border-red-900 pb-4 mb-6">
                <h1 className="text-2xl font-bold">Expense Analysis Report</h1>
                <p className="text-slate-500">Period: {dateRange.start} onwards</p>
            </div>

            <div className="flex items-center gap-4 no-print">
                <Link href="/dashboard/reports">
                    <Button variant="outline" size="sm" className="rounded-full w-10 px-0">
                        <ChevronLeft size={18} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Expense Analysis</h1>
                    <p className="text-slate-500">Review your operational costs by category and date.</p>
                </div>
            </div>

            <Card className="border-red-100 bg-red-50/20">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5 min-w-[300px]">
                            <label className="text-xs font-bold text-red-500 uppercase flex items-center gap-1">
                                <Calendar size={12} /> Date Range
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                                <span className="text-slate-400">to</span>
                                <input
                                    type="date"
                                    className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button onClick={fetchExpenses} isLoading={loading} className="bg-red-600 hover:bg-red-700 no-print">
                            Apply Filter
                        </Button>
                        <div className="ml-auto flex gap-2 no-print">
                            <Button variant="outline" onClick={handlePrint} disabled={expenses.length === 0}>
                                <FileText size={18} className="mr-2" /> PDF
                            </Button>
                            <Button variant="outline" onClick={exportToXLS} disabled={expenses.length === 0}>
                                <Download size={18} className="mr-2" /> XLS
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-red-600 text-white border-none shadow-lg shadow-red-100">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-red-100">Total Spending</CardDescription>
                            <CardTitle className="text-3xl">₹ {grandTotal.toLocaleString('en-IN')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-red-100 flex items-center gap-1">
                                <ArrowDown size={12} /> Cash out for this period
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <PieChart size={18} className="text-slate-400" /> Category Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sortedCategories.map(([cat, amount]: any, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-slate-600 truncate mr-2">{cat}</span>
                                        <span className="text-slate-900 font-bold">₹ {amount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div
                                            className="bg-red-500 h-1.5 rounded-full"
                                            style={{ width: `${(amount / grandTotal) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {sortedCategories.length === 0 && (
                                <p className="text-center py-4 text-slate-400 text-xs italic">No categorised data.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Expense Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                                        <th className="py-3">Date</th>
                                        <th className="py-3">Category</th>
                                        <th className="py-3">Description</th>
                                        <th className="py-3 text-right">Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {expenses.map((exp) => (
                                        <tr key={exp.id} className="hover:bg-slate-50/50">
                                            <td className="py-3 text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                                            <td className="py-3">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                                                    {exp.category}
                                                </span>
                                            </td>
                                            <td className="py-3 text-slate-600 italic max-w-xs truncate">{exp.description}</td>
                                            <td className="py-3 text-right font-bold text-slate-900">
                                                {exp.amount.toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-slate-400 italic">No expenses recorded for this period.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
