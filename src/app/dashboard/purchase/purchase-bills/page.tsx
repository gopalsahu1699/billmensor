"use client";

import { motion } from "framer-motion";
import { Plus, Search, Download, Printer, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PurchaseBillsPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white text-gradient">Purchase Bills</h1>
                    <p className="text-slate-400 mt-1 font-medium">Record and manage your incoming stock and bills</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 px-6">
                        <Plus className="w-4 h-4 mr-2" /> Create Purchase Bill
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Purchases", value: "₹0", color: "text-white" },
                    { label: "Paid Amount", value: "₹0", color: "text-green-400" },
                    { label: "Pending Bills", value: "₹0", color: "text-yellow-400" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="p-6 rounded-3xl glass-dark shadow-xl border border-white/5"
                    >
                        <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search bills, vendors..."
                        className="pl-10 bg-transparent border-none text-white focus:ring-0 placeholder:text-slate-500 h-10"
                    />
                </div>
                <div className="flex items-center gap-2 pr-2">
                    <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">
                        <Printer className="w-4 h-4 mr-2" /> Print
                    </Button>
                </div>
            </div>

            {/* Table Placeholder */}
            <div className="rounded-3xl glass-dark border border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                {["Bill No", "Date", "Vendor", "Status", "Amount", "Balance"].map((head) => (
                                    <th key={head} className="px-6 py-4 font-semibold text-slate-300 uppercase tracking-wider">
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center">
                                    <p className="text-slate-500 italic">No purchase records found.</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
