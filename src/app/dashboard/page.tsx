"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  UserPlus,
  ShoppingCart,
  FileText,
  PackagePlus,
  Wallet,
  CreditCard
} from "lucide-react";

const QUICK_ACTIONS = [
  { label: "Create Party", href: "/dashboard/parties/create-party", icon: <UserPlus size={16} /> },
  { label: "Create Sale", href: "/dashboard/sales/sales-invoices/create-invoices", icon: <ShoppingCart size={16} /> },
  { label: "Create Quotation", href: "/dashboard/sales/quotation-estimate/create-quotation", icon: <FileText size={16} /> },
  { label: "Create Item", href: "/dashboard/items/create", icon: <PackagePlus size={16} /> },
  { label: "Create Expense", href: "/dashboard/expense-income", icon: <Wallet size={16} /> },
  { label: "Create Purchase", href: "/dashboard/purchase/purchase-bills", icon: <CreditCard size={16} /> },
];

export default function DashboardPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* ===== Header ===== */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Last 30 Days</p>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        </div>
      </header>

      {/* ===== Quick Actions ===== */}
      <div className="flex flex-wrap gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.label} href={action.href}>
            <Button variant="outline" size="sm" className="gap-2 bg-card hover:bg-accent text-foreground transition-all duration-200 shadow-sm border-border hover:border-primary/50">
              {action.icon}
              {action.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* ===== Summary Cards ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Sale"
          bg="bg-green-600"
          stats={[
            { label: "Total Sale", value: "₹0" },
            { label: "Paid", value: "₹0" },
            { label: "Unpaid", value: "₹0" },
          ]}
        />

        <DashboardCard
          title="Purchase"
          bg="bg-blue-600"
          stats={[
            { label: "Total Purchase", value: "₹0" },
            { label: "Paid", value: "₹0" },
            { label: "Unpaid", value: "₹0" },
          ]}
        />

        <ReturnCard title="Sale Return" bg="bg-slate-500" />
        <ReturnCard title="Purchase Return" bg="bg-red-600" />
      </div>

      {/* ===== Bottom Section ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            30-Day Sales Trend
          </h2>
          <div className="h-48 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground italic text-xs">
            Chart Visualization Area
          </div>
        </div>

        {/* Stats */}
        <aside className="space-y-3">
          <SmallCard title="Total Expense" value="₹0" />
          <SmallCard title="Expense Balance" value="₹0" />
          <SmallCard title="Items" value="1" />
          <SmallCard title="Parties" value="1" />
        </aside>
      </div>
    </motion.section>
  );
}


/* ----- Components ----- */

function DashboardCard({
  title,
  bg,
  stats,
}: {
  title: string;
  bg: string;
  stats?: { label: string; value: string }[];
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`${bg} rounded-2xl p-5 text-white shadow-xl relative overflow-hidden group`}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <h3 className="font-medium text-white/80 mb-1">{title}</h3>
      <p className="text-3xl font-bold">₹0</p>

      {stats && (
        <div className="mt-2 space-y-1 text-sm opacity-90">
          {stats.map((item) => (
            <div key={item.label} className="flex justify-between">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ReturnCard({
  title,
  bg,
}: {
  title: string;
  bg: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`${bg} relative overflow-hidden rounded-2xl p-5 text-white shadow-xl group`}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <h3 className="mb-3 font-semibold text-white/80">{title}</h3>

      <div className="mt-1 flex justify-between">
        <Stat label="Total" value="0" />
        <Stat label="Total Return" value="0" />
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function SmallCard({ title, value }: { title: string; value: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-2xl bg-card/40 backdrop-blur-md p-4 shadow-lg border border-border"
    >
      <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </motion.div>
  );
}
