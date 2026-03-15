"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useCallback } from "react";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { useTranslation } from "react-i18next";
import { MdDashboard, MdPeople, MdInventory, MdShoppingCart, MdCreditCard, MdBarChart, MdSettings, MdExpandMore, MdWallet, MdClose, MdLogout, MdAdd, MdChevronLeft, MdChevronRight, MdDescription, MdStorage, MdBusiness, MdPersonAdd, MdSend, MdCamera, MdVerifiedUser, MdHistory, MdAccountBalance, MdAccessTime, MdAllInbox, MdStorefront } from "react-icons/md";
import { FiBox } from "react-icons/fi";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { teamService } from "../../services/team.service";
import { useEffect } from "react";

/* ================= TYPES ================= */

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
    showMobileMenu: boolean;
    setShowMobileMenu: (v: boolean) => void;
}
interface SidebarLinkProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick?: () => void;
    badge?: string;
    isCollapsed?: boolean;
}

interface DropdownProps {
    icon: React.ReactNode;
    label: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    active: boolean;
    children: React.ReactNode;
    isCollapsed?: boolean;
    setIsCollapsed?: (v: boolean) => void;
}

interface SubLinkProps {
    href: string;
    label: string;
    onClick?: () => void;
    badge?: string;
}

export function Sidebar({ isCollapsed, setIsCollapsed, showMobileMenu, setShowMobileMenu }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useTranslation();

    const [manualSalesOpen, setSalesOpen] = useState(false);
    const [manualPurchaseOpen, setPurchaseOpen] = useState(false);
    const [manualSettingsOpen, setSettingsOpen] = useState(false);
    const [manualOrdersOpen, setOrdersOpen] = useState(false);
    const [manualInventoryOpen, setInventoryOpen] = useState(false);
    const [manualFinanceOpen, setFinanceOpen] = useState(false);
    const [manualToolsOpen, setToolsOpen] = useState(false);

    // RBAC
    const [userRole, setUserRole] = useState<string>('owner');

    useEffect(() => {
        teamService.getMyRole().then(data => {
            if (data?.role) {
                setUserRole(data.role);
            }
        }).catch(() => {
            // team_members table may not exist yet - default to owner
        });
    }, []);

    const isMounted = typeof window !== "undefined";

    const salesOpen = manualSalesOpen || pathname.startsWith("/dashboard/sales") || pathname.includes("/invoices") || pathname.includes("/quotations") || pathname.startsWith("/dashboard/orders/sales") || (pathname.includes("returns") && pathname.includes("sales"));
    const purchaseOpen = manualPurchaseOpen || pathname.startsWith("/dashboard/purchase") || pathname.includes("/purchases") || pathname.startsWith("/dashboard/orders/purchase") || (pathname.includes("returns") && pathname.includes("purchase"));
    const ordersOpen = manualOrdersOpen || pathname.startsWith("/dashboard/orders");
    const settingsOpen = manualSettingsOpen || pathname.startsWith("/dashboard/settings");
    const inventoryOpen = manualInventoryOpen || pathname.startsWith("/dashboard/products") || pathname.startsWith("/dashboard/alerts");
    const financeOpen = manualFinanceOpen || pathname.startsWith("/dashboard/expenses") || pathname.startsWith("/dashboard/cash-flow") || pathname.startsWith("/dashboard/cheques") || pathname.startsWith("/dashboard/settings/bank-accounts");
    const toolsOpen = manualToolsOpen || pathname.startsWith("/dashboard/scanner") || pathname.startsWith("/dashboard/store") || pathname.startsWith("/dashboard/reminders") || pathname.startsWith("/dashboard/pos");

    const isActive = (path: string): boolean => {
        return path === "/dashboard" ? pathname === path : pathname.startsWith(path);
    };

    const closeMobileMenu = useCallback(() => {
        setShowMobileMenu(false);
    }, [setShowMobileMenu]);

    if (!isMounted) {
        return <div className="w-64 h-screen bg-slate-900 hidden lg:block" />;
    }

    return (
        <>
            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-out bg-slate-900 dark:bg-slate-950 border-r border-white/10 shadow-2xl h-full",
                    showMobileMenu ? "translate-x-0 w-80 max-w-[calc(100vw-2rem)]" : "-translate-x-full lg:translate-x-0 lg:w-64",
                    isCollapsed && !showMobileMenu && "lg:w-20"
                )}
            >
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/5 bg-slate-900 dark:bg-slate-950">
                    <div className="flex items-center gap-3 overflow-hidden text-nowrap">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-600/20 text-white shrink-0">B</div>
                        {(!isCollapsed || showMobileMenu) && (
                            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="text-xl font-bold tracking-tight text-white block">Billmensor</span>
                                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block -mt-1">Enterprise</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={closeMobileMenu}
                        className="lg:hidden p-2 text-slate-400 hover:bg-white/5 rounded-xl"
                    >
                        <MdClose size={20} />
                    </button>
                </div>

                {/* Global Action */}
                {userRole !== 'viewer' && (
                    <div className="p-4 px-3">
                        <Link
                            href="/dashboard/invoices/create"
                            onClick={() => {
                                if (showMobileMenu) closeMobileMenu();
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-2xl shadow-xl shadow-blue-900/40 transition-all active:scale-95 group",
                                isCollapsed && !showMobileMenu ? "justify-center" : "px-4"
                            )}
                        >
                            <MdAdd size={20} strokeWidth={3} className="shrink-0" />
                            {(!isCollapsed || showMobileMenu) && <span className="font-black text-xs uppercase tracking-widest">{t("New Invoice")}</span>}
                        </Link>
                    </div>
                )}

                {/* Navigation Wrapper */}
                <nav className="flex-1 p-3 pt-2 space-y-1 overflow-y-auto scrollbar-hide">
                    {/* Main Group */}
                    <div className="space-y-1">
                        <SidebarLink
                            href="/dashboard"
                            icon={<MdDashboard size={18} />}
                            label={t("Dashboard")}
                            active={isActive("/dashboard")}
                            onClick={closeMobileMenu}
                            isCollapsed={isCollapsed && !showMobileMenu}
                        />
                        <SidebarLink
                            href="/dashboard/customers"
                            icon={<MdPeople size={18} />}
                            label={t("Customers")}
                            active={isActive("/dashboard/customers")}
                            onClick={closeMobileMenu}
                            isCollapsed={isCollapsed && !showMobileMenu}
                        />
                    </div>

                    {/* Inventory Dropdown */}
                    <Dropdown
                        icon={<MdInventory size={18} />}
                        label={t("Inventory")}
                        open={inventoryOpen}
                        setOpen={setInventoryOpen}
                        active={isActive("/dashboard/products") || isActive("/dashboard/alerts")}
                        isCollapsed={isCollapsed && !showMobileMenu}
                        setIsCollapsed={setIsCollapsed}
                    >
                        <SubLink href="/dashboard/products" label="Items / Products" onClick={closeMobileMenu} />
                        <SubLink href="/dashboard/alerts" label="Stock Alerts" onClick={closeMobileMenu} badge="NEW" />
                    </Dropdown>

                    {/* Sales Dropdown */}
                    <Dropdown
                        icon={<MdShoppingCart size={18} />}
                        label={t("Sales")}
                        open={salesOpen}
                        setOpen={setSalesOpen}
                        active={pathname.includes("invoices") || pathname.includes("quotations") || pathname.startsWith("/dashboard/orders/sales") || (pathname.includes("returns") && pathname.includes("sales"))}
                        isCollapsed={isCollapsed && !showMobileMenu}
                        setIsCollapsed={setIsCollapsed}
                    >
                        <SubLink href="/dashboard/invoices" label="Sales Invoices" onClick={closeMobileMenu} />
                        <SubLink href="/dashboard/quotations" label="Quotation / Estimate" onClick={closeMobileMenu} />
                        <SubLink href="/dashboard/orders/sales" label="Sales Orders" onClick={closeMobileMenu} badge="NEW" />
                        <SubLink href="/dashboard/returns?type=sales_return" label="Sales Return" onClick={closeMobileMenu} />
                        <SubLink href="/dashboard/delivery-challans" label="Delivery Challan" onClick={closeMobileMenu} />
                        <SubLink href="/dashboard/payments-in" label="Payment In" onClick={closeMobileMenu} />
                    </Dropdown>

                    {/* Purchase Dropdown */}
                    <Dropdown
                        icon={<MdCreditCard size={18} />}
                        label={t("Purchase")}
                        open={purchaseOpen}
                        setOpen={setPurchaseOpen}
                        active={isActive("/dashboard/purchases") || pathname.startsWith("/dashboard/orders/purchase") || (pathname.includes("returns") && pathname.includes("purchase"))}
                        isCollapsed={isCollapsed && !showMobileMenu}
                        setIsCollapsed={setIsCollapsed}
                    >
                        <SubLink href="/dashboard/purchases" label="Purchase Bills" onClick={closeMobileMenu} />
                        <SubLink href="/dashboard/orders/purchase" label="Purchase Orders" onClick={closeMobileMenu} badge="NEW" />
                        <SubLink href="/dashboard/returns?type=purchase_return" label="Purchase Return" onClick={closeMobileMenu} />
                        <SubLink href="/dashboard/payments-out" label="Payment Out" onClick={closeMobileMenu} />
                    </Dropdown>

                    {/* Finance Dropdown */}
                    {(userRole === 'owner' || userRole === 'admin') && (
                        <Dropdown
                            icon={<MdWallet size={18} />}
                            label={t("Finance")}
                            open={financeOpen}
                            setOpen={setFinanceOpen}
                            active={isActive("/dashboard/expenses") || isActive("/dashboard/cash-flow") || isActive("/dashboard/cheques") || isActive("/dashboard/settings/bank-accounts")}
                            isCollapsed={isCollapsed && !showMobileMenu}
                            setIsCollapsed={setIsCollapsed}
                        >
                            <SubLink href="/dashboard/expenses" label="Expenses" onClick={closeMobileMenu} />
                            <SubLink href="/dashboard/cash-flow" label="Cash Flow" onClick={closeMobileMenu} badge="NEW" />
                            <SubLink href="/dashboard/cheques" label="Cheques" onClick={closeMobileMenu} badge="NEW" />
                            <SubLink href="/dashboard/settings/bank-accounts" label="Bank Accounts" onClick={closeMobileMenu} badge="NEW" />
                        </Dropdown>
                    )}

                    {/* Smart Tools Dropdown */}
                    {userRole !== 'viewer' && (
                        <Dropdown
                            icon={<FiBox size={18} />}
                            label={t("Smart Tools")}
                            open={toolsOpen}
                            setOpen={setToolsOpen}
                            active={isActive("/dashboard/scanner") || isActive("/dashboard/store") || isActive("/dashboard/reminders") || isActive("/dashboard/pos")}
                            isCollapsed={isCollapsed && !showMobileMenu}
                            setIsCollapsed={setIsCollapsed}
                        >
                            <SubLink href="/dashboard/scanner" label="OCR Scanner" onClick={closeMobileMenu} badge="NEW" />
                            <SubLink href="/dashboard/store" label="Online Store" onClick={closeMobileMenu} badge="NEW" />
                            <SubLink href="/dashboard/reminders" label="Payment Reminders" onClick={closeMobileMenu} badge="NEW" />
                            <SubLink href="/dashboard/pos" label="POS Terminal" onClick={closeMobileMenu} />
                            <SubLink href="/dashboard/staff" label="Staff & Payroll" onClick={closeMobileMenu} badge="NEW" />
                        </Dropdown>
                    )}

                    {(userRole === 'owner' || userRole === 'admin' || userRole === 'viewer') && (
                        <SidebarLink
                            href="/dashboard/reports"
                            icon={<MdBarChart size={18} />}
                            label={t("Reports")}
                            active={isActive("/dashboard/reports")}
                            onClick={closeMobileMenu}
                            isCollapsed={isCollapsed && !showMobileMenu}
                        />
                    )}

                    {(userRole === 'owner' || userRole === 'admin') && (
                        <div className="mt-6 pt-6 border-t border-white/5">
                            <Dropdown
                                icon={<MdSettings size={18} />}
                                label={t("Settings")}
                                open={settingsOpen}
                                setOpen={setSettingsOpen}
                                active={pathname.startsWith("/dashboard/settings")}
                                isCollapsed={isCollapsed && !showMobileMenu}
                                setIsCollapsed={setIsCollapsed}
                            >
                                <SubLink href="/dashboard/settings/account" label="Account Setting" onClick={closeMobileMenu} />
                                <SubLink href="/dashboard/settings/team" label="Team Members" onClick={closeMobileMenu} badge="NEW" />
                                <SubLink href="/dashboard/settings/print" label="Print Setting" onClick={closeMobileMenu} />
                                <SubLink href="/dashboard/settings/e-invoice" label="E-Invoice" onClick={closeMobileMenu} badge="NEW" />
                                <SubLink href="/dashboard/settings/backup" label="Backup & Restore" onClick={closeMobileMenu} badge="NEW" />
                                <SubLink href="/dashboard/settings/billing" label="Billing & Plan" onClick={closeMobileMenu} />
                            </Dropdown>

                            <div className="px-3 mt-4 space-y-2">
                                <LanguageToggle />
                                <ThemeToggle />
                            </div>
                        </div>
                    )}

                    {(userRole === 'staff' || userRole === 'viewer') && (
                        <div className="mt-6 pt-6 border-t border-white/5 px-3 space-y-2">
                            <LanguageToggle />
                            <ThemeToggle />
                        </div>
                    )}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/5 space-y-2">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full hidden lg:flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium border border-transparent hover:border-white/20 text-slate-200 hover:bg-white/5 hover:text-white transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 flex items-center justify-center">
                                {isCollapsed ? <MdChevronRight size={18} /> : <MdChevronLeft size={18} />}
                            </div>
                            {!isCollapsed && <span>{t("Collapse Sidebar")}</span>}
                        </div>
                    </button>

                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push('/login');
                        }}
                        className={cn(
                            "w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 text-slate-400 hover:bg-red-500/10 hover:text-red-400",
                            isCollapsed && !showMobileMenu && "justify-center px-0"
                        )}
                    >
                        <MdLogout size={18} />
                        {(!isCollapsed || showMobileMenu) && <span>{t("Logout")}</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}

function SidebarLink({ href, icon, label, active, onClick, isCollapsed, badge }: SidebarLinkProps) {
    if (href === "#") {
        return (
            <div className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium opacity-50 cursor-not-allowed text-slate-400",
                isCollapsed && "justify-center px-0"
            )}>
                <div className="shrink-0 w-5 h-5 flex items-center justify-center">{icon}</div>
                {!isCollapsed && <span className="flex-1">{label}</span>}
                {!isCollapsed && badge && <span className="bg-slate-800 text-[8px] px-1.5 py-0.5 rounded text-slate-300 font-black">{badge}</span>}
            </div>
        )
    }

    return (
        <Link
            href={href}
            onClick={() => {
                if (onClick) onClick();
            }}
            className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 border border-transparent hover:border-white/20 outline-none",
                active
                    ? "bg-blue-600/10 text-blue-400 border-blue-600/20 shadow-lg shadow-blue-600/5 backdrop-blur-sm"
                    : "text-slate-200 hover:bg-white/5 hover:text-white",
                isCollapsed && "justify-center px-0"
            )}
        >
            <div className="shrink-0 w-5 h-5 flex items-center justify-center font-bold">{icon}</div>
            {!isCollapsed && <span className="whitespace-nowrap flex-1">{label}</span>}
            {!isCollapsed && active && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-auto" />}
        </Link>
    );
}

function Dropdown({ icon, label, open, setOpen, active, children, isCollapsed, setIsCollapsed }: DropdownProps) {
    if (isCollapsed) {
        return (
            <button
                onClick={() => {
                    if (setIsCollapsed) setIsCollapsed(false);
                    setOpen(true);
                }}
                className={cn(
                    "flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium transition-all border border-transparent hover:border-white/20",
                    active ? "bg-blue-600/10 text-blue-400" : "text-slate-200 hover:bg-white/5"
                )}
            >
                <div className="shrink-0 w-5 h-5 flex items-center justify-center">{icon}</div>
            </button>
        )
    }

    return (
        <div className="space-y-1">
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 border border-transparent hover:border-white/20",
                    active
                        ? "bg-blue-600/10 text-blue-400 border-blue-600/20"
                        : "text-slate-200 hover:bg-white/5 hover:text-white"
                )}
            >
                <div className="flex items-center gap-3">
                    <div className="shrink-0 w-5 h-5 flex items-center justify-center">{icon}</div>
                    <span className="whitespace-nowrap">{label}</span>
                </div>
                <MdExpandMore
                    size={16}
                    className={cn("transition-transform duration-200", open && "rotate-180")}
                />
            </button>

            <div
                className={cn(
                    "ml-4 pl-4 border-l border-white/10 space-y-1 overflow-hidden transition-all duration-300",
                    open ? "max-h-96 opacity-100 py-1" : "max-h-0 opacity-0 py-0"
                )}
            >
                {children}
            </div>
        </div>
    );
}

function SubLink({ href, label, onClick, badge }: SubLinkProps) {
    const pathname = usePathname();
    const active = pathname === href;

    if (href === "#") {
        return (
            <div className="flex items-center justify-between px-3 py-2 text-xs opacity-50 text-slate-400 uppercase tracking-tighter font-black italic">
                <span>{label}</span>
                <span className="text-[8px] bg-slate-800 px-1 py-0.5 rounded text-white/50">{badge}</span>
            </div>
        )
    }

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "block rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 border border-transparent hover:border-white/20 outline-none",
                active || pathname === href.split('?')[0]
                    ? "bg-blue-600/10 text-blue-400 border-blue-600/30 shadow-sm"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
            )}
        >
            <span className="truncate">{label}</span>
        </Link>
    );
}
