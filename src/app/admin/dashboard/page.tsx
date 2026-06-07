"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Profile } from "@/types";
import {
    MdPeople,
    MdStar,
    MdCheckCircle,
    MdSchedule,
    MdLocalOffer,
    MdRedeem,
} from "react-icons/md";

interface DashboardStats {
    totalUsers: number;
    premiumUsers: number;
    activePremium: number;
    expiringSoon: number;
    totalCoupons: number;
    totalRedemptions: number;
}

function getAdminAuthHeader(): string {
    const username = sessionStorage.getItem("admin_user") || "";
    const password = sessionStorage.getItem("admin_pass") || "";
    return "Basic " + btoa(username + ":" + password);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

const PLAN_COLORS: Record<string, string> = {
    free: "bg-slate-600",
    monthly: "bg-emerald-600",
    yearly: "bg-blue-600",
    lifetime: "bg-purple-600",
};

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { Authorization: getAdminAuthHeader() };
                const [statsRes, usersRes] = await Promise.all([
                    fetch("/api/admin/stats", { headers }),
                    fetch("/api/admin/users?limit=10&page=1", { headers }),
                ]);

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    setRecentUsers(usersData.users || []);
                }
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const statCards = [
        { label: "Total Users", value: stats?.totalUsers ?? "-", icon: MdPeople, color: "text-blue-400", bgColor: "bg-blue-600/10" },
        { label: "Premium Users", value: stats?.premiumUsers ?? "-", icon: MdStar, color: "text-amber-400", bgColor: "bg-amber-600/10" },
        { label: "Active Premium", value: stats?.activePremium ?? "-", icon: MdCheckCircle, color: "text-emerald-400", bgColor: "bg-emerald-600/10" },
        { label: "Expiring Soon", value: stats?.expiringSoon ?? "-", icon: MdSchedule, color: "text-rose-400", bgColor: "bg-rose-600/10" },
        { label: "Total Coupons", value: stats?.totalCoupons ?? "-", icon: MdLocalOffer, color: "text-purple-400", bgColor: "bg-purple-600/10" },
        { label: "Total Redemptions", value: stats?.totalRedemptions ?? "-", icon: MdRedeem, color: "text-cyan-400", bgColor: "bg-cyan-600/10" },
    ];

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
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-1">Overview of your application metrics</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((card) => (
                    <Card key={card.label} className="border-slate-800 bg-slate-950">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">{card.label}</p>
                                    <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                                    <card.icon className={`w-6 h-6 ${card.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Plan Distribution */}
                <Card className="border-slate-800 bg-slate-950">
                    <CardHeader>
                        <CardTitle className="text-white">Plan Distribution</CardTitle>
                        <CardDescription className="text-slate-400">Users by subscription plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentUsers.length > 0 ? (
                            <div className="space-y-3">
                                {(["free", "monthly", "yearly", "lifetime"] as const).map((plan) => {
                                    const count = recentUsers.filter((u) => u.plan_type === plan).length;
                                    const maxCount = recentUsers.length || 1;
                                    return (
                                        <div key={plan} className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-sm ${PLAN_COLORS[plan]}`} />
                                            <span className="text-sm text-slate-300 capitalize w-16">{plan}</span>
                                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${PLAN_COLORS[plan]}`}
                                                    style={{ width: `${(count / maxCount) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-slate-400 w-8 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm">No user data available</p>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Users */}
                <Card className="border-slate-800 bg-slate-950">
                    <CardHeader>
                        <CardTitle className="text-white">Recent Users</CardTitle>
                        <CardDescription className="text-slate-400">Latest registered profiles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentUsers.length === 0 ? (
                            <p className="text-slate-500 text-sm">No users found</p>
                        ) : (
                            <div className="space-y-3">
                                {recentUsers.slice(0, 8).map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0"
                                    >
                                        <div className="min-w-0 mr-3">
                                            <p className="text-sm font-medium text-white truncate">
                                                {user.full_name || user.company_name || "N/A"}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                        </div>
                                        <Badge
                                            className={`text-[10px] font-bold uppercase shrink-0 ${PLAN_COLORS[user.plan_type || "free"]}`}
                                        >
                                            {user.plan_type || "free"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
