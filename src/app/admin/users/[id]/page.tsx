"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Profile } from "@/types";
import {
    MdPerson,
    MdEmail,
    MdBusiness,
    MdPhone,
    MdLocationOn,
    MdCreditCard,
    MdWarning,
    MdCancel,
    MdNotifications,
    MdDelete,
    MdArrowBack,
    MdSend,
    MdEdit,
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

function getDaysUntilExpiry(expiry: string): number {
    if (!expiry) return -1;
    const now = new Date();
    const exp = new Date(expiry);
    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
}

const PLAN_COLORS: Record<string, string> = {
    free: "bg-slate-600 text-white",
    monthly: "bg-emerald-600 text-white",
    yearly: "bg-blue-600 text-white",
    lifetime: "bg-purple-600 text-white",
};

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showChangePlan, setShowChangePlan] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [planType, setPlanType] = useState("");
    const [planStatus, setPlanStatus] = useState("");
    const [planExpiry, setPlanExpiry] = useState("");
    const [saving, setSaving] = useState(false);
    const [showSendNotif, setShowSendNotif] = useState(false);
    const [notifTitle, setNotifTitle] = useState("");
    const [notifMessage, setNotifMessage] = useState("");
    const [notifType, setNotifType] = useState("info");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`/api/admin/users/${userId}`, {
                    headers: { Authorization: getAdminAuthHeader() },
                });
                if (!res.ok) throw new Error("Failed to fetch user");
                const data = await res.json();
                setUser(data);
                setPlanType(data.plan_type || "free");
                setPlanStatus(data.plan_status || "");
                setPlanExpiry(data.plan_expiry ? data.plan_expiry.split("T")[0] : "");
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to fetch user");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [userId]);

    const handleChangePlan = async () => {
        setSaving(true);
        try {
            const body: Record<string, string> = {};
            if (planType) body.plan_type = planType;
            if (planStatus) body.plan_status = planStatus;
            if (planExpiry) body.plan_expiry = new Date(planExpiry).toISOString();

            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAdminAuthHeader(),
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update plan");
            }
            toast.success("Plan updated successfully");
            setShowChangePlan(false);
            const updated = await res.json();
            setUser(updated);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update plan");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
                headers: { Authorization: getAdminAuthHeader() },
            });
            if (!res.ok) throw new Error("Failed to delete user");
            toast.success("User deleted");
            router.push("/admin/users");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete user");
        } finally {
            setSaving(false);
        }
    };

    const handleSendNotification = async () => {
        if (!notifTitle || !notifMessage) {
            toast.error("Title and message are required");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAdminAuthHeader(),
                },
                body: JSON.stringify({
                    title: notifTitle,
                    message: notifMessage,
                    type: notifType,
                    target_audience: "selected",
                    target_user_ids: [userId],
                }),
            });
            if (!res.ok) throw new Error("Failed to send notification");
            toast.success("Notification sent");
            setShowSendNotif(false);
            setNotifTitle("");
            setNotifMessage("");
            setNotifType("info");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to send notification");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-6 text-center text-slate-500">
                <p>User not found</p>
                <Button onClick={() => router.push("/admin/users")} className="mt-4 border-slate-700 text-slate-300">
                    Back to Users
                </Button>
            </div>
        );
    }

    const expiryDays = getDaysUntilExpiry(user.plan_expiry || "");

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push("/admin/users")}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <MdArrowBack className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">{user.full_name || "User Detail"}</h1>
                    <p className="text-slate-400 mt-1">{user.email}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Info */}
                <Card className="border-slate-800 bg-slate-950 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white">Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <MdPerson className="text-slate-500 w-5 h-5" />
                                <div>
                                    <p className="text-xs text-slate-500">Full Name</p>
                                    <p className="text-sm text-white">{user.full_name || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MdEmail className="text-slate-500 w-5 h-5" />
                                <div>
                                    <p className="text-xs text-slate-500">Email</p>
                                    <p className="text-sm text-white">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MdBusiness className="text-slate-500 w-5 h-5" />
                                <div>
                                    <p className="text-xs text-slate-500">Company</p>
                                    <p className="text-sm text-white">{user.company_name || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MdPhone className="text-slate-500 w-5 h-5" />
                                <div>
                                    <p className="text-xs text-slate-500">Phone</p>
                                    <p className="text-sm text-white">{user.phone || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 md:col-span-2">
                                <MdLocationOn className="text-slate-500 w-5 h-5" />
                                <div>
                                    <p className="text-xs text-slate-500">Address</p>
                                    <p className="text-sm text-white">{user.address || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MdCreditCard className="text-slate-500 w-5 h-5" />
                                <div>
                                    <p className="text-xs text-slate-500">GSTIN</p>
                                    <p className="text-sm text-white">{user.gstin || "-"}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Registered</p>
                                <p className="text-sm text-white">{formatDate(user.created_at)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Plan Info */}
                <Card className="border-slate-800 bg-slate-950">
                    <CardHeader>
                        <CardTitle className="text-white">Plan Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-500">Plan Type</p>
                            <Badge className={`mt-1 ${PLAN_COLORS[user.plan_type || "free"]}`}>
                                {user.plan_type || "free"}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Plan Status</p>
                            <Badge className={`mt-1 ${user.plan_status === "active" ? "bg-emerald-600" : user.plan_status === "expired" ? "bg-rose-600" : "bg-slate-600"}`}>
                                {user.plan_status || "N/A"}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Plan Expiry</p>
                            <p className="text-sm text-white mt-1">{formatDate(user.plan_expiry || "")}</p>
                            {expiryDays >= 0 && (
                                <p className={`text-xs mt-1 ${expiryDays <= 7 ? "text-rose-400" : expiryDays <= 30 ? "text-amber-400" : "text-emerald-400"}`}>
                                    {expiryDays === 0 ? "Expires today" : `${expiryDays} days remaining`}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 pt-4 border-t border-slate-800">
                            <Button
                                onClick={() => setShowChangePlan(true)}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                            >
                                <MdEdit className="w-4 h-4 mr-1" />
                                Change Plan
                            </Button>
                            <Button
                                onClick={() => setShowSendNotif(true)}
                                className="w-full bg-amber-600 hover:bg-amber-500 text-white"
                            >
                                <MdNotifications className="w-4 h-4 mr-1" />
                                Send Notification
                            </Button>
                            <Button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-800"
                            >
                                <MdDelete className="w-4 h-4 mr-1" />
                                Delete User
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Change Plan Modal */}
            {showChangePlan && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Change Plan</h2>
                                <button onClick={() => setShowChangePlan(false)} className="p-2 hover:bg-slate-800 rounded-lg">
                                    <MdCancel className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Plan Type</label>
                                    <select
                                        value={planType}
                                        onChange={(e) => setPlanType(e.target.value)}
                                        className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                                    >
                                        <option value="free">Free</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="lifetime">Lifetime</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Plan Status</label>
                                    <select
                                        value={planStatus}
                                        onChange={(e) => setPlanStatus(e.target.value)}
                                        className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                                    >
                                        <option value="">-</option>
                                        <option value="active">Active</option>
                                        <option value="expired">Expired</option>
                                        <option value="canceled">Canceled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Plan Expiry</label>
                                    <Input
                                        type="date"
                                        value={planExpiry}
                                        onChange={(e) => setPlanExpiry(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowChangePlan(false)}
                                        className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleChangePlan}
                                        disabled={saving}
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold"
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Send Notification Modal */}
            {showSendNotif && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Send Notification</h2>
                                <button onClick={() => setShowSendNotif(false)} className="p-2 hover:bg-slate-800 rounded-lg">
                                    <MdCancel className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                                    <Input
                                        type="text"
                                        value={notifTitle}
                                        onChange={(e) => setNotifTitle(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white"
                                        placeholder="Notification title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Message</label>
                                    <textarea
                                        value={notifMessage}
                                        onChange={(e) => setNotifMessage(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white resize-none"
                                        placeholder="Notification message"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                                    <select
                                        value={notifType}
                                        onChange={(e) => setNotifType(e.target.value)}
                                        className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                                    >
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="promotional">Promotional</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowSendNotif(false)}
                                        className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSendNotification}
                                        disabled={saving}
                                        className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold"
                                    >
                                        <MdSend className="w-4 h-4 mr-1" />
                                        {saving ? "Sending..." : "Send"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full">
                        <div className="p-6 text-center">
                            <div className="mx-auto w-12 h-12 rounded-full bg-rose-600/20 flex items-center justify-center mb-4">
                                <MdWarning className="w-6 h-6 text-rose-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Delete User?</h2>
                            <p className="text-sm text-slate-400 mb-6">
                                This action cannot be undone. All user data including invoices, products, and settings will be permanently deleted.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDeleteUser}
                                    disabled={saving}
                                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold"
                                >
                                    <MdDelete className="w-4 h-4 mr-1" />
                                    {saving ? "Deleting..." : "Delete"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
