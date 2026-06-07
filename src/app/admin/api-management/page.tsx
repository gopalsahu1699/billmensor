"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    MdApi,
    MdPayment,
    MdStorage,
    MdList,
    MdCheckCircle,
} from "react-icons/md";

const API_ENDPOINTS = [
    { method: "GET", path: "/api/admin/notifications", description: "Fetch all notifications" },
    { method: "POST", path: "/api/admin/notifications", description: "Send a new notification" },
    { method: "DELETE", path: "/api/admin/notifications", description: "Delete all notifications" },
    { method: "GET", path: "/api/admin/users", description: "List all users" },
    { method: "PATCH", path: "/api/admin/users", description: "Update user details" },
    { method: "GET", path: "/api/admin/coupons", description: "List all coupons" },
    { method: "POST", path: "/api/admin/coupons", description: "Create a new coupon" },
    { method: "PATCH", path: "/api/admin/coupons", description: "Update an existing coupon" },
    { method: "DELETE", path: "/api/admin/coupons", description: "Delete a coupon" },
    { method: "GET", path: "/api/admin/reports", description: "Fetch analytics reports" },
    { method: "GET", path: "/api/admin/settings", description: "Get admin settings" },
    { method: "PATCH", path: "/api/admin/settings", description: "Update admin settings" },
];

const METHOD_COLORS: Record<string, string> = {
    GET: "bg-emerald-600 text-white",
    POST: "bg-blue-600 text-white",
    PATCH: "bg-amber-600 text-white",
    DELETE: "bg-rose-600 text-white",
};

function maskRazorpayKey(keyId: string): string {
    if (!keyId) return "Not configured";
    if (keyId.length <= 10) return keyId;
    return keyId.slice(0, 10) + "***";
}

function maskSupabaseUrl(url: string): string {
    if (!url) return "Not configured";
    try {
        const parsed = new URL(url);
        return `https://***${parsed.hostname.replace(/^[^.]+/, "")}`;
    } catch {
        return "https://***.supabase.co";
    }
}

export default function AdminApiManagementPage() {
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const razorpayEnv = razorpayKeyId.startsWith("rzp_test") ? "Test" : "Live";

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <MdApi className="text-blue-400" />
                    API Management
                </h1>
                <p className="text-slate-400 mt-1">
                    Manage payment gateway, database, and API endpoints
                </p>
            </div>

            {/* Payment Gateway Card */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <MdPayment className="w-5 h-5 text-blue-400" />
                        Payment Gateway
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Razorpay payment integration settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                            <div className="flex items-center gap-2">
                                <MdPayment className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-300">Key ID</span>
                            </div>
                            <span className="text-sm text-slate-400 font-mono">
                                {maskRazorpayKey(razorpayKeyId)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                            <div className="flex items-center gap-2">
                                <MdCheckCircle className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-300">Environment</span>
                            </div>
                            <Badge
                                className={`text-xs font-bold ${
                                    razorpayEnv === "Test"
                                        ? "bg-amber-600 text-white"
                                        : "bg-emerald-600 text-white"
                                }`}
                            >
                                {razorpayEnv}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Database Card */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <MdStorage className="w-5 h-5 text-blue-400" />
                        Database
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Supabase database connection
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                            <div className="flex items-center gap-2">
                                <MdStorage className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-300">Supabase URL</span>
                            </div>
                            <span className="text-sm text-slate-400 font-mono">
                                {maskSupabaseUrl(supabaseUrl)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* API Endpoints Card */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <MdList className="w-5 h-5 text-blue-400" />
                        API Endpoints
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        All available admin API endpoints
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left text-xs text-slate-500 uppercase tracking-widest font-semibold pb-3 pr-4">
                                        Method
                                    </th>
                                    <th className="text-left text-xs text-slate-500 uppercase tracking-widest font-semibold pb-3 px-4">
                                        Path
                                    </th>
                                    <th className="text-left text-xs text-slate-500 uppercase tracking-widest font-semibold pb-3 pl-4">
                                        Description
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {API_ENDPOINTS.map((endpoint, idx) => (
                                    <tr
                                        key={`${endpoint.method}-${endpoint.path}-${idx}`}
                                        className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="py-3 pr-4">
                                            <Badge
                                                className={`text-[10px] font-bold uppercase ${METHOD_COLORS[endpoint.method] || "bg-slate-600 text-white"}`}
                                            >
                                                {endpoint.method}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <code className="text-sm text-blue-300 font-mono">
                                                {endpoint.path}
                                            </code>
                                        </td>
                                        <td className="py-3 pl-4">
                                            <span className="text-sm text-slate-400">
                                                {endpoint.description}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
