"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    MdSettings,
    MdPerson,
    MdLock,
    MdInfo,
    MdWarning,
    MdDeleteForever,
    MdCloud,
    MdCancel,
} from "react-icons/md";

function getAdminAuthHeader(): string {
    const username = sessionStorage.getItem("admin_user") || "";
    const password = sessionStorage.getItem("admin_pass") || "";
    return "Basic " + btoa(username + ":" + password);
}

export default function AdminSettingsPage() {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [clearing, setClearing] = useState(false);

    const adminUser = typeof window !== "undefined"
        ? sessionStorage.getItem("admin_user") || "Unknown"
        : "Unknown";
    const appVersion = "1.0.0";
    const environment = typeof window !== "undefined"
        ? window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? "Development"
            : "Production"
        : "Unknown";

    const handleClearNotifications = async () => {
        setClearing(true);
        try {
            const res = await fetch("/api/admin/notifications", {
                method: "DELETE",
                headers: { Authorization: getAdminAuthHeader() },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to clear notifications");
            }

            toast.success("All notifications cleared");
            setShowConfirmModal(false);
        } catch (error: unknown) {
            const msg =
                error instanceof Error ? error.message : "Failed to clear notifications";
            toast.error(msg);
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <MdSettings className="text-blue-400" />
                    Admin Settings
                </h1>
                <p className="text-slate-400 mt-1">
                    Manage your admin account and application settings
                </p>
            </div>

            {/* Account Card */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <MdPerson className="w-5 h-5 text-blue-400" />
                        Account
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Current administrator information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-slate-500 uppercase tracking-widest mb-1">
                                Username
                            </label>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <MdPerson className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-white font-medium">{adminUser}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <MdLock className="w-5 h-5 text-amber-400" />
                        Change Password
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Update your admin password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-800/50">
                        <div className="flex items-start gap-3">
                            <MdWarning className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-amber-200 font-medium mb-1">
                                    Manual Password Update Required
                                </p>
                                <p className="text-sm text-slate-400">
                                    To change the admin password, update{" "}
                                    <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 text-xs font-mono">
                                        ADMIN_PASSWORD
                                    </code>{" "}
                                    in{" "}
                                    <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 text-xs font-mono">
                                        .env.local
                                    </code>{" "}
                                    and restart the server.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* App Info Card */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <MdInfo className="w-5 h-5 text-blue-400" />
                        App Info
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Current application configuration
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                            <div className="flex items-center gap-2">
                                <MdInfo className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-300">App Version</span>
                            </div>
                            <span className="text-sm text-white font-mono">{appVersion}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                            <div className="flex items-center gap-2">
                                <MdCloud className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-300">Environment</span>
                            </div>
                            <span
                                className={`text-sm font-mono font-bold ${
                                    environment === "Production"
                                        ? "text-emerald-400"
                                        : "text-amber-400"
                                }`}
                            >
                                {environment}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone Card */}
            <Card className="bg-slate-900/50 border-rose-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <MdWarning className="w-5 h-5 text-rose-400" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Irreversible destructive actions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-rose-950/20 border border-rose-800/30">
                            <div>
                                <p className="text-sm font-medium text-white">
                                    Clear All Notifications
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Permanently delete all notifications from the database
                                </p>
                            </div>
                            <Button
                                variant="danger"
                                onClick={() => setShowConfirmModal(true)}
                                className="bg-rose-600 hover:bg-rose-500 text-white font-bold shrink-0 ml-4"
                            >
                                <MdDeleteForever size={18} className="mr-1" />
                                Clear All
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-rose-800/50 rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-rose-600/20 flex items-center justify-center">
                                    <MdWarning className="w-5 h-5 text-rose-400" />
                                </div>
                                <h2 className="text-lg font-bold text-white">
                                    Confirm Destructive Action
                                </h2>
                            </div>
                            <p className="text-sm text-slate-400 mb-6">
                                Are you sure you want to permanently delete all notifications?
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowConfirmModal(false)}
                                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                >
                                    <MdCancel size={16} className="mr-1" />
                                    Cancel
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={handleClearNotifications}
                                    isLoading={clearing}
                                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
                                >
                                    <MdDeleteForever size={18} className="mr-1" />
                                    {clearing ? "Clearing..." : "Yes, Delete All"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
