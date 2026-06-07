"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminStats, Profile, Coupon } from "@/types";
import { toast } from "sonner";
import {
    MdBarChart,
    MdPeople,
    MdStar,
    MdAttachMoney,
    MdLocalOffer,
    MdSchedule,
    MdDownload,
} from "react-icons/md";

function getAdminAuthHeader(): string {
    const username = sessionStorage.getItem("admin_user") || "";
    const password = sessionStorage.getItem("admin_pass") || "";
    return "Basic " + btoa(username + ":" + password);
}

const PLAN_COLORS: Record<string, string> = {
    free: "bg-slate-600",
    monthly: "bg-emerald-600",
    yearly: "bg-blue-600",
    lifetime: "bg-purple-600",
};

function formatDate(dateStr: string): string {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function AdminReportsPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<Profile[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { Authorization: getAdminAuthHeader() };
                const [statsRes, usersRes, couponsRes] = await Promise.all([
                    fetch("/api/admin/stats", { headers }),
                    fetch("/api/admin/users?limit=1000", { headers }),
                    fetch("/api/admin/coupons", { headers }),
                ]);

                if (statsRes.ok) {
                    setStats(await statsRes.json());
                }

                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setUsers(data.users || []);
                }

                if (couponsRes.ok) {
                    const data = await couponsRes.json();
                    setCoupons(data as Coupon[]);
                }
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Revenue estimation: monthly users x 199 + yearly users x 1999
    const monthlyUsers = users.filter((u) => u.plan_type === "monthly").length;
    const yearlyUsers = users.filter((u) => u.plan_type === "yearly").length;
    const revenueEstimate = monthlyUsers * 199 + yearlyUsers * 1999;

    // Plan distribution counts
    const planCounts = {
        free: users.filter((u) => !u.plan_type || u.plan_type === "free").length,
        monthly: monthlyUsers,
        yearly: yearlyUsers,
        lifetime: users.filter((u) => u.plan_type === "lifetime").length,
    };
    const totalUsersCount = users.length || 1;

    // Expiring soon (within 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = users
        .filter((u) => {
            if (!u.plan_expiry) return false;
            const expiry = new Date(u.plan_expiry);
            return expiry > now && expiry <= thirtyDaysFromNow;
        })
        .map((u) => {
            const expiry = new Date(u.plan_expiry!);
            const daysLeft = Math.ceil(
                (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            return { ...u, daysLeft };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft);

    // Coupon summary
    const totalCoupons = coupons.length;
    const totalRedemptions = coupons.reduce((sum, c) => sum + c.used_count, 0);
    const mostUsedCoupon =
        coupons.length > 0
            ? coupons.reduce((max, c) => (c.used_count > max.used_count ? c : max), coupons[0])
            : null;

    const handleExportCSV = () => {
        if (users.length === 0) {
            toast.error("No users to export");
            return;
        }
        const headers = ["Name", "Email", "Company", "Plan Type", "Status", "Expiry", "Registered"];
        const rows = users.map((u) => [
            u.full_name || "",
            u.email || "",
            u.company_name || "",
            u.plan_type || "free",
            u.plan_status || "",
            u.plan_expiry || "",
            u.created_at ? formatDate(u.created_at) : "",
        ]);
        const csv = [headers, ...rows]
            .map((r) => r.map((c) => `"${c}"`).join(","))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "users_export.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported");
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <MdBarChart className="text-blue-400" />
                    Reports & Analytics
                </h1>
                <p className="text-slate-400 mt-1">Application overview</p>
            </div>

            {/* Stats Cards — 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <Card className="border-slate-800 bg-slate-950">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">Total Users</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    {stats?.totalUsers ?? users.length}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center">
                                <MdPeople className="w-6 h-6 text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Premium Users */}
                <Card className="border-slate-800 bg-slate-950">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">Premium Users</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    {stats?.premiumUsers ?? "-"}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center">
                                <MdStar className="w-6 h-6 text-amber-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Revenue Est. */}
                <Card className="border-slate-800 bg-slate-950">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">Total Revenue Est.</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    ₹{revenueEstimate.toLocaleString("en-IN")}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 flex items-center justify-center">
                                <MdAttachMoney className="w-6 h-6 text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Coupons */}
                <Card className="border-slate-800 bg-slate-950">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">Total Coupons</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    {stats?.totalCoupons ?? totalCoupons}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-600/10 flex items-center justify-center">
                                <MdLocalOffer className="w-6 h-6 text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Plan Distribution + Coupon Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Plan Distribution Card */}
                <Card className="border-slate-800 bg-slate-950">
                    <CardHeader>
                        <CardTitle className="text-white">Plan Distribution</CardTitle>
                        <CardDescription className="text-slate-400">Users by subscription type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {(["free", "monthly", "yearly", "lifetime"] as const).map((plan) => {
                                const count = planCounts[plan];
                                const percent = Math.round((count / totalUsersCount) * 100);
                                const barWidth = Math.max((count / totalUsersCount) * 100, 0);
                                return (
                                    <div key={plan}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-sm ${PLAN_COLORS[plan]}`} />
                                                <span className="text-sm text-slate-300 capitalize">{plan}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white">{count}</span>
                                                <span className="text-xs text-slate-500">({percent}%)</span>
                                            </div>
                                        </div>
                                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${PLAN_COLORS[plan]} transition-all`}
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Coupon Summary Card */}
                <Card className="border-slate-800 bg-slate-950">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <MdLocalOffer className="w-5 h-5 text-purple-400" />
                            Coupon Summary
                        </CardTitle>
                        <CardDescription className="text-slate-400">Coupon performance overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                                <div className="flex items-center gap-2">
                                    <MdLocalOffer className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm text-slate-300">Total Coupons</span>
                                </div>
                                <span className="text-lg font-bold text-white">{totalCoupons}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                                <div className="flex items-center gap-2">
                                    <MdStar className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm text-slate-300">Total Redemptions</span>
                                </div>
                                <span className="text-lg font-bold text-white">{totalRedemptions}</span>
                            </div>
                            {mostUsedCoupon && (
                                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MdStar className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm text-slate-300">Most Used Coupon</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold text-white text-sm">
                                            {mostUsedCoupon.code}
                                        </span>
                                        <Badge className="bg-amber-600 text-white text-[10px]">
                                            {mostUsedCoupon.used_count} uses
                                        </Badge>
                                    </div>
                                    {mostUsedCoupon.description && (
                                        <p className="text-xs text-slate-500 mt-1">{mostUsedCoupon.description}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Expiring Soon Card */}
            <Card className="border-slate-800 bg-slate-950">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <MdSchedule className="w-5 h-5 text-rose-400" />
                        Expiring Soon
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Users whose plans expire within the next 30 days
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {expiringSoon.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">
                            No users expiring within 30 days
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="text-left text-xs text-slate-500 uppercase tracking-widest font-semibold pb-3 pr-4">
                                            Name
                                        </th>
                                        <th className="text-left text-xs text-slate-500 uppercase tracking-widest font-semibold pb-3 px-4 hidden sm:table-cell">
                                            Email
                                        </th>
                                        <th className="text-left text-xs text-slate-500 uppercase tracking-widest font-semibold pb-3 px-4">
                                            Plan Type
                                        </th>
                                        <th className="text-left text-xs text-slate-500 uppercase tracking-widest font-semibold pb-3 px-4 hidden md:table-cell">
                                            Expiry Date
                                        </th>
                                        <th className="text-left text-xs text-slate-500 uppercase tracking-widest font-semibold pb-3 pl-4">
                                            Days Left
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiringSoon.map((u) => (
                                        <tr
                                            key={u.id}
                                            className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors"
                                        >
                                            <td className="py-3 pr-4">
                                                <p className="text-sm font-medium text-white truncate max-w-[150px]">
                                                    {u.full_name || u.company_name || "N/A"}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate sm:hidden">
                                                    {u.email}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4 hidden sm:table-cell">
                                                <span className="text-sm text-slate-400 truncate max-w-[180px] block">
                                                    {u.email}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge
                                                    className={`text-[10px] font-bold uppercase ${PLAN_COLORS[u.plan_type || "free"]}`}
                                                >
                                                    {u.plan_type || "free"}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell">
                                                <span className="text-sm text-slate-400">
                                                    {formatDate(u.plan_expiry!)}
                                                </span>
                                            </td>
                                            <td className="py-3 pl-4">
                                                <Badge
                                                    className={`text-[10px] font-bold ${
                                                        u.daysLeft < 7
                                                            ? "bg-red-600 text-white"
                                                            : u.daysLeft < 30
                                                              ? "bg-amber-600 text-white"
                                                              : "bg-slate-700 text-slate-300"
                                                    }`}
                                                >
                                                    {u.daysLeft}d
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Export Section */}
            <Card className="border-slate-800 bg-slate-950">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <MdDownload className="w-5 h-5 text-blue-400" />
                        Export Data
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Download user data for external analysis
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={handleExportCSV}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                        >
                            <MdDownload size={18} className="mr-2" />
                            Export Users CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
