"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

/* ================= TYPES ================= */

interface SidebarProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  active: boolean;
  children: React.ReactNode;
}

interface SubLinkProps {
  href: string;
  label: string;
  onClick?: () => void;
}



export default function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [salesOpen, setSalesOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setSalesOpen(pathname.startsWith("/dashboard/sales"));
    setPurchaseOpen(pathname.startsWith("/dashboard/purchase"));
    setSettingsOpen(pathname.startsWith("/dashboard/settings"));
  }, [pathname]);

  const isActive = (path: string): boolean => {
    return path === "/dashboard" ? pathname === path : pathname.startsWith(path);
  };

  const toggleMobileMenu = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  if (!isMounted) {
    return <div className="w-64 h-12 bg-slate-900 hidden md:block" />;
  }

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={toggleMobileMenu}
        className="fixed top-4 right-4 z-1000 p-3 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl hover:shadow-white/10 transition-all duration-200 md:hidden text-white"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-99 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-100 w-80 max-w-[calc(100vw-2rem)] min-h-screen
          bg-slate-900 dark:bg-slate-950 border-r border-slate-200 dark:border-white/10 shadow-2xl
          transform transition-all duration-300 ease-out
          ${isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
          md:translate-x-0 md:static md:w-64 md:shadow-none md:border-r
          supports-[backdrop-filter:blur(20px)]:backdrop-blur-xl
        `}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 p-6 pb-6 bg-slate-900 dark:bg-slate-950 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-600/20 text-white">B</div>
            <span className="text-xl font-bold tracking-tight text-white">BillMensor</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 pt-2 space-y-2 text-sm overflow-y-auto h-[calc(100vh-8rem)] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 md:h-auto md:pb-8">

          {/* Main Links */}
          <div className="space-y-1.5 mb-4">
            <SidebarLink
              href="/dashboard"
              icon={<LayoutDashboard size={18} strokeWidth={2} />}
              label="Dashboard"
              active={isActive("/dashboard")}
              onClick={closeMobileMenu}
            />
            <SidebarLink
              href="/dashboard/parties"
              icon={<Users size={18} strokeWidth={2} />}
              label="Parties"
              active={isActive("/dashboard/parties")}
              onClick={closeMobileMenu}
            />
            <SidebarLink
              href="/dashboard/items"
              icon={<Package size={18} strokeWidth={2} />}
              label="Items"
              active={isActive("/dashboard/items")}
              onClick={closeMobileMenu}
            />
            <SidebarLink
              href="/dashboard/category"
              icon={<Tag size={18} strokeWidth={2} />}
              label="Category"
              active={isActive("/dashboard/category")}
              onClick={closeMobileMenu}
            />
          </div>

          {/* Sales Dropdown */}
          <Dropdown
            icon={<ShoppingCart size={18} strokeWidth={2} />}
            label="Sales"
            open={salesOpen}
            setOpen={setSalesOpen}
            active={isActive("/dashboard/sales")}
          >
            <SubLink href="/dashboard/sales/sales-invoices" label="Sales Invoices" onClick={closeMobileMenu} />
            <SubLink href="/dashboard/sales/quotation-estimate" label="Quotation / Estimate" onClick={closeMobileMenu} />
            <SubLink href="/dashboard/sales/sales-return" label="Sales Return" onClick={closeMobileMenu} />
            <SubLink href="/dashboard/sales/delivery-challan" label="Delivery Challan" onClick={closeMobileMenu} />
            <SubLink href="/dashboard/sales/payment-in" label="Payment In" onClick={closeMobileMenu} />
          </Dropdown>

          {/* Purchase Dropdown */}
          <Dropdown
            icon={<CreditCard size={18} strokeWidth={2} />}
            label="Purchase"
            open={purchaseOpen}
            setOpen={setPurchaseOpen}
            active={isActive("/dashboard/purchase")}
          >
            <SubLink href="/dashboard/purchase/purchase-bills" label="Purchase Bills" onClick={closeMobileMenu} />
            <SubLink href="/dashboard/purchase/purchase-return" label="Purchase Return" onClick={closeMobileMenu} />
            <SubLink href="/dashboard/purchase/payment-out" label="Payment Out" onClick={closeMobileMenu} />
          </Dropdown>

          {/* Standalone Links */}
          <div className="space-y-1.5">
            <SidebarLink
              href="/dashboard/expense-income"
              icon={<Wallet size={18} strokeWidth={2} />}
              label="Expense & Income"
              active={isActive("/dashboard/expense-income")}
              onClick={closeMobileMenu}
            />
            <SidebarLink
              href="/dashboard/reports"
              icon={<BarChart3 size={18} strokeWidth={2} />}
              label="Reports"
              active={isActive("/dashboard/reports")}
              onClick={closeMobileMenu}
            />
            <SidebarLink
              href="/dashboard/pos"
              icon={<Store size={18} strokeWidth={2} />}
              label="POS"
              active={isActive("/dashboard/pos")}
              onClick={closeMobileMenu}
            />
          </div>

          {/* Settings Dropdown */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <Dropdown
              icon={<Settings size={18} strokeWidth={2} />}
              label="Settings"
              open={settingsOpen}
              setOpen={setSettingsOpen}
              active={isActive("/dashboard/settings")}
            >
              <SubLink href="/dashboard/settings/account" label="Account Settings" onClick={closeMobileMenu} />
              <SubLink href="/dashboard/settings/company" label="Company Settings" onClick={closeMobileMenu} />
              <SubLink href="/dashboard/settings/invoice" label="Invoice Settings" onClick={closeMobileMenu} />
              <SubLink href="/dashboard/settings/invoice-themes" label="Invoice Themes" onClick={closeMobileMenu} />
              <SubLink href="/dashboard/settings/custom-fields" label="Custom Fields" onClick={closeMobileMenu} />
              <SubLink href="/dashboard/settings/change-password" label="Change Password" onClick={closeMobileMenu} />
              <SubLink href="/dashboard/settings/thermal-print" label="Thermal Print" onClick={closeMobileMenu} />
              <SubLink href="/dashboard/settings/backup-restore" label="Backup & Restore" onClick={closeMobileMenu} />
              <SubLink href="/dashboard/settings/pricing" label="Pricing Plans 👑" onClick={closeMobileMenu} />
              <SubLink href="/dashboard/settings/business-card" label="Business Card 👑" onClick={closeMobileMenu} />
            </Dropdown>
          </div>

          <div className="mt-2 space-y-1">
            <ThemeToggle />
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            {/* Placeholder for Logout */}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.refresh();
                router.push('/login');
              }}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 text-slate-300 hover:bg-white/5 hover:text-white"
            >
              <div className="shrink-0 w-5 h-5"><X size={18} strokeWidth={2} /></div>
              <span>Logout</span>
            </button>
          </div>

        </nav>

      </aside>

    </>
  );
}

function SidebarLink({ href, icon, label, active, onClick }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200
        border border-transparent hover:border-white/20
        ${active
          ? "bg-linear-to-r from-sky-500/20 via-sky-500/10 to-blue-500/20 text-sky-400 shadow-lg shadow-sky-500/10 border-sky-400/30 backdrop-blur-sm"
          : "text-slate-300 hover:bg-white/5 hover:text-white hover:shadow-md"
        }
        focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:ring-offset-2 focus:ring-offset-slate-900
      `}
    >
      <div className="shrink-0 w-5 h-5">{icon}</div>
      <span className="whitespace-nowrap flex-1">{label}</span>
      {active && <div className="w-2 h-2 bg-sky-400 rounded-full ml-auto opacity-75" />}
    </Link>
  );
}

function Dropdown({ icon, label, open, setOpen, active, children }: DropdownProps) {
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={`
          group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200
          border border-transparent hover:border-white/20
          ${active
            ? "bg-linear-to-r from-sky-500/20 via-sky-500/10 to-blue-500/20 text-sky-400 shadow-lg shadow-sky-500/10 border-sky-400/30 backdrop-blur-sm"
            : "text-slate-300 hover:bg-white/5 hover:text-white hover:shadow-md"
          }
          focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:ring-offset-2 focus:ring-offset-slate-900
        `}
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-5 h-5">{icon}</div>
          <span className="whitespace-nowrap">{label}</span>
        </div>
        <ChevronDown
          size={16}
          strokeWidth={2.5}
          className={`transition-transform duration-200 ease-in-out ${open ? "rotate-180" : ""} group-hover:scale-110`}
        />
      </button>

      <div
        className={`
          ml-4 pl-4 border-l-2 border-white/10 space-y-1.5 overflow-hidden transition-all duration-200
          ${open ? "max-h-96 opacity-100 py-2" : "max-h-0 opacity-0 py-0"}
        `}
      >
        {children}
      </div>
    </>
  );
}

function SubLink({ href, label, onClick }: SubLinkProps) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        block rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200
        border border-transparent hover:border-white/20
        ${active
          ? "bg-sky-500/10 text-sky-400 border-sky-400/40 shadow-sm backdrop-blur-sm"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
        }
        focus:outline-none focus:ring-1 focus:ring-sky-500/40
      `}
    >
      <span className="truncate">{label}</span>
    </Link>


  );

}
