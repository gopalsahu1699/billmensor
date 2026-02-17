"use client";

import { motion } from "framer-motion";
import { Search, Plus, Filter, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ExpenseIncomePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Expense & Income</h1>
          <p className="text-slate-400 mt-1 font-medium">Manage and track your business cash flow</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 px-6">
            <Plus className="w-4 h-4 mr-2" /> Add Transaction
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Income", value: "₹0", color: "text-green-400" },
          { label: "Total Expense", value: "₹0", color: "text-red-400" },
          { label: "Net Balance", value: "₹0", color: "text-blue-400" },
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

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search by category or notes..."
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

      {/* Data Table */}
      <div className="rounded-3xl glass-dark border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                {["Transaction ID", "Date", "Category", "Payment Mode", "Status", "Amount"].map((head) => (
                  <th key={head} className="px-6 py-4 font-semibold text-slate-300 uppercase tracking-wider">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-slate-950 border border-white/5">
                      <Search className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-400 text-lg font-medium">No transactions found</p>
                    <p className="text-slate-600 text-sm">Try adjusting your filters or search terms</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
