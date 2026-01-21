"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

import {
  LayoutDashboard,
  Users,
  Package,
  Tag,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Settings,
  Store,
  ChevronDown,
  Wallet,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const [salesOpen, setSalesOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setSalesOpen(pathname.startsWith("/dashboard/sales"));
    setPurchaseOpen(pathname.startsWith("/dashboard/purchase"));
    setSettingsOpen(pathname.startsWith("/dashboard/settings"));
  }, [pathname]);

  const isActive = (path: string) =>
    path === "/dashboard"
      ? pathname === path
      : pathname.startsWith(path);

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white">
      <div className="p-4 text-xl font-bold border-b border-white/10">
        Khata Billing
      </div>

      <nav className="p-2 space-y-1 text-sm">

        <SidebarLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" active={isActive("/dashboard")} />
        <SidebarLink href="/dashboard/parties" icon={<Users size={18} />} label="Parties" active={isActive("/dashboard/parties")} />
        <SidebarLink href="/dashboard/items" icon={<Package size={18} />} label="Items" active={isActive("/dashboard/items")} />
        <SidebarLink href="/dashboard/category" icon={<Tag size={18} />} label="Category" active={isActive("/dashboard/category")} />

        {/* SALES */}
        <Dropdown
          icon={<ShoppingCart size={18} />}
          label="Sales"
          open={salesOpen}
          setOpen={setSalesOpen}
          active={isActive("/dashboard/sales")}
        >
          <SubLink href="/dashboard/sales/sales-invoices" label="Sales Invoices" />
          <SubLink href="/dashboard/sales/quotation-estimate" label="Quotation / Estimate" />
          <SubLink href="/dashboard/sales/sales-return" label="Sales Return" />
          <SubLink href="/dashboard/sales/delivery-challan" label="Delivery Challan" />
          <SubLink href="/dashboard/sales/payment-in" label="Payment In" />
        </Dropdown>

        {/* PURCHASE */}
        <Dropdown
          icon={<CreditCard size={18} />}
          label="Purchase"
          open={purchaseOpen}
          setOpen={setPurchaseOpen}
          active={isActive("/dashboard/purchase")}
        >
          <SubLink href="/dashboard/purchase/purchase-bills" label="Purchase" />
          <SubLink href="/dashboard/purchase/purchase-return" label="Purchase Return" />
          <SubLink href="/dashboard/purchase/payment-out" label="Payment Out" />
        </Dropdown>

        <SidebarLink href="/dashboard/expense-income" icon={<Wallet size={18} />} label="Expense & Income" active={isActive("/dashboard/expense-income")} />
        <SidebarLink href="/dashboard/reports" icon={<BarChart3 size={18} />} label="Reports" active={isActive("/dashboard/reports")} />
        <SidebarLink href="/dashboard/pos" icon={<Store size={18} />} label="POS" active={isActive("/dashboard/pos")} />

        {/* SETTINGS */}
        <Dropdown
          icon={<Settings size={18} />}
          label="Settings"
          open={settingsOpen}
          setOpen={setSettingsOpen}
          active={isActive("/dashboard/settings")}
        >
          <SubLink href="/dashboard/settings/account" label="Account Settings" />
          <SubLink href="/dashboard/settings/company" label="Company Settings" />
          <SubLink href="/dashboard/settings/invoice" label="Invoice Settings" />
          <SubLink href="/dashboard/settings/invoice-themes" label="Invoice Themes" />
          <SubLink href="/dashboard/settings/custom-fields" label="Custom Fields" />
          <SubLink href="/dashboard/settings/change-password" label="Change Password" />
          <SubLink href="/dashboard/settings/thermal-print" label="Thermal Print" />
          <SubLink href="/dashboard/settings/backup-restore" label="Backup & Restore" />
          <SubLink href="/dashboard/settings/pricing" label="Pricing Plans 👑" />
          <SubLink href="/dashboard/settings/business-card" label="Business Card 👑" />
        </Dropdown>

      </nav>
    </aside>
  );
}

/* ---------- Components ---------- */

function SidebarLink({ href, icon, label, active }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2
      ${active ? "bg-white/10 text-sky-400" : "hover:bg-white/5"}`}
    >
      {icon}
      {label}
    </Link>
  );
}

function Dropdown({ icon, label, open, setOpen, active, children }: any) {
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2
        ${active ? "bg-white/10 text-sky-400" : "hover:bg-white/5"}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          {label}
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && <div className="ml-8 space-y-1 text-gray-300">{children}</div>}
    </>
  );
}

function SubLink({ href, label }: any) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`block rounded-md px-2 py-1
      ${active ? "text-sky-400" : "hover:text-white"}`}
    >
      {label}
    </Link>
  );
}
