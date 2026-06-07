"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    MdDashboard,
    MdPeople,
    MdLocalOffer,
    MdNotifications,
    MdBarChart,
    MdApi,
    MdSettings,
    MdLogout,
    MdMenu,
    MdClose,
    MdChevronLeft,
} from "react-icons/md";

const NAV_ITEMS = [
    { href: "/admin/dashboard", label: "Dashboard", icon: MdDashboard },
    { href: "/admin/users", label: "Users", icon: MdPeople },
    { href: "/admin/coupons", label: "Coupons", icon: MdLocalOffer },
    { href: "/admin/notifications", label: "Notifications", icon: MdNotifications },
    { href: "/admin/reports", label: "Reports", icon: MdBarChart },
    { href: "/admin/api-management", label: "API Management", icon: MdApi },
    { href: "/admin/settings", label: "Settings", icon: MdSettings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [adminUser, setAdminUser] = useState("");

    useEffect(() => {
        const auth = sessionStorage.getItem("admin_auth");
        const user = sessionStorage.getItem("admin_user") || "";
        setAdminUser(user);
        if (auth !== "true") {
            router.replace("/admin/login");
        } else {
            setChecking(false);
        }
    }, [router]);

    const handleLogout = () => {
        sessionStorage.removeItem("admin_auth");
        sessionStorage.removeItem("admin_user");
        sessionStorage.removeItem("admin_pass");
        router.replace("/admin/login");
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const isActive = (href: string) => {
        if (href === "/admin/dashboard") {
            return pathname === "/admin/dashboard";
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">B</span>
                        </div>
                        <span className="text-white font-bold text-sm">Billmensor</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1 text-slate-400 hover:text-white"
                    >
                        <MdClose className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <button
                                key={item.href}
                                onClick={() => {
                                    router.push(item.href);
                                    setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    active
                                        ? "bg-blue-600/20 text-blue-400"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                }`}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div className="border-t border-slate-800 p-3 space-y-2 shrink-0">
                    <div className="px-3 py-2">
                        <p className="text-xs text-slate-500">Logged in as</p>
                        <p className="text-sm text-white font-medium truncate">{adminUser}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/30 transition-colors"
                    >
                        <MdLogout className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar (mobile) */}
                <header className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950 lg:hidden shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">B</span>
                        </div>
                        <span className="text-white font-bold text-sm">Billmensor</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-slate-400 hover:text-white"
                    >
                        <MdMenu className="w-6 h-6" />
                    </button>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
