"use client";

import { motion } from "framer-motion";
import { Plus, Search, Download, Printer, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PurchaseReturnPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white text-gradient">Purchase Returns</h1>
                    <p className="text-slate-400 mt-1 font-medium">Record and manage stock sent back to vendors</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/20 px-6">
                        <Plus className="w-4 h-4 mr-2" /> Add Purchase Return
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { label: "Total Return Value", value: "₹0", color: "text-white" },
                    { label: "Returns This Month", value: "0", color: "text-blue-400" },
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

            {/* Table Placeholder */}
            <div className="rounded-3xl glass-dark border border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                {["Return No", "Date", "Original Bill", "Vendor", "Value"].map((head) => (
                                    <th key={head} className="px-6 py-4 font-semibold text-slate-300 uppercase tracking-wider">
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic">
                                    No return records found.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
