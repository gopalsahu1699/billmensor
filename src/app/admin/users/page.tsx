"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Profile } from "@/types";
import {
    MdSearch,
    MdVisibility,
    MdDownload,
    MdChevronLeft,
    MdChevronRight,
    MdPeople,
} from "react-icons/md";
import { toast } from "sonner";

function getAdminAuthHeader(): string {
    const username = sessionStorage.getItem("admin_user") || "";
    const password = sessionStorage.getItem("admin_pass") || "";
    return "Basic " + btoa(username + ":" + password);
}

function formatDate(dateStr: string): string {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<Profile[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [planTypeFilter, setPlanTypeFilter] = useState("");
    const [planStatusFilter, setPlanStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [changingPlan, setChangingPlan] = useState<string | null>(null);
    const limit = 20;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            });
            if (search) params.set("search", search);
            if (planTypeFilter) params.set("plan_type", planTypeFilter);
            if (planStatusFilter) params.set("plan_status", planStatusFilter);

            const res = await fetch(`/api/admin/users?${params}`, {
                headers: { Authorization: getAdminAuthHeader() },
            });

            if (!res.ok) throw new Error("Failed to fetch users");

            const data = await res.json();
            setUsers(data.users || []);
            setTotal(data.total || 0);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    }, [page, search, planTypeFilter, planStatusFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "users_export.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported");
    };

    const handleChangePlan = async (userId: string, field: string, value: string) => {
        setChangingPlan(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAdminAuthHeader(),
                },
                body: JSON.stringify({ [field]: value }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update plan");
            }
            toast.success("Plan updated");
            fetchUsers();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update plan");
        } finally {
            setChangingPlan(null);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MdPeople className="text-blue-400" />
                        User Management
                    </h1>
                    <p className="text-slate-400 mt-1">{total} total users</p>
                </div>
                <Button
                    onClick={handleExportCSV}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                    <MdDownload className="w-4 h-4 mr-1" />
                    Export CSV
                </Button>
            </div>

            {/* Filters */}
            <Card className="border-slate-800 bg-slate-950">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <Input
                                    type="text"
                                    placeholder="Search by name, email, company..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 pl-10"
                                />
                            </div>
                        </div>
                        <select
                            value={planTypeFilter}
                            onChange={(e) => { setPlanTypeFilter(e.target.value); setPage(1); }}
                            className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                        >
                            <option value="">All Plans</option>
                            <option value="free">Free</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="lifetime">Lifetime</option>
                        </select>
                        <select
                            value={planStatusFilter}
                            onChange={(e) => { setPlanStatusFilter(e.target.value); setPage(1); }}
                            className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="canceled">Canceled</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="border-slate-800 bg-slate-950">
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <MdPeople className="mx-auto w-12 h-12 mb-4 opacity-30" />
                            <p className="font-medium">No users found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="text-left py-3 px-2 text-slate-400 font-medium">Name</th>
                                        <th className="text-left py-3 px-2 text-slate-400 font-medium hidden md:table-cell">Email</th>
                                        <th className="text-left py-3 px-2 text-slate-400 font-medium hidden lg:table-cell">Company</th>
                                        <th className="text-left py-3 px-2 text-slate-400 font-medium">Plan</th>
                                        <th className="text-left py-3 px-2 text-slate-400 font-medium hidden lg:table-cell">Status</th>
                                        <th className="text-left py-3 px-2 text-slate-400 font-medium hidden xl:table-cell">Expiry</th>
                                        <th className="text-left py-3 px-2 text-slate-400 font-medium hidden xl:table-cell">Registered</th>
                                        <th className="text-left py-3 px-2 text-slate-400 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/admin/users/${user.id}`)}
                                        >
                                            <td className="py-3 px-2 text-white font-medium">
                                                {user.full_name || "N/A"}
                                            </td>
                                            <td className="py-3 px-2 text-slate-400 hidden md:table-cell">{user.email}</td>
                                            <td className="py-3 px-2 text-slate-400 hidden lg:table-cell">{user.company_name || "-"}</td>
                                            <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={user.plan_type || "free"}
                                                    onChange={(e) => handleChangePlan(user.id, "plan_type", e.target.value)}
                                                    disabled={changingPlan === user.id}
                                                    className="h-7 rounded border border-slate-700 bg-slate-900 px-2 text-xs text-white disabled:opacity-50"
                                                >
                                                    <option value="free">Free</option>
                                                    <option value="monthly">Monthly</option>
                                                    <option value="yearly">Yearly</option>
                                                    <option value="lifetime">Lifetime</option>
                                                </select>
                                            </td>
                                            <td className="py-3 px-2 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={user.plan_status || ""}
                                                    onChange={(e) => handleChangePlan(user.id, "plan_status", e.target.value)}
                                                    disabled={changingPlan === user.id}
                                                    className="h-7 rounded border border-slate-700 bg-slate-900 px-2 text-xs text-white disabled:opacity-50"
                                                >
                                                    <option value="">-</option>
                                                    <option value="active">Active</option>
                                                    <option value="expired">Expired</option>
                                                    <option value="canceled">Canceled</option>
                                                </select>
                                            </td>
                                            <td className="py-3 px-2 text-slate-400 hidden xl:table-cell">
                                                {formatDate(user.plan_expiry || "")}
                                            </td>
                                            <td className="py-3 px-2 text-slate-400 hidden xl:table-cell">
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => router.push(`/admin/users/${user.id}`)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                                                        title="View Details"
                                                    >
                                                        <MdVisibility className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-4">
                            <p className="text-sm text-slate-500">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                >
                                    <MdChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                >
                                    <MdChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
