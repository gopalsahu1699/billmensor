"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Notification } from "@/types";
import { toast } from "sonner";
import {
    MdNotifications,
    MdSend,
    MdHistory,
} from "react-icons/md";

function getAdminAuthHeader(): string {
    const username = sessionStorage.getItem("admin_user") || "";
    const password = sessionStorage.getItem("admin_pass") || "";
    return "Basic " + btoa(username + ":" + password);
}

const NOTIFICATION_TYPES = ["info", "warning", "promotional", "urgent"] as const;
type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const TARGET_AUDIENCES = ["all", "premium", "free"] as const;
type TargetAudience = (typeof TARGET_AUDIENCES)[number];

const TYPE_BADGE_COLORS: Record<NotificationType, string> = {
    info: "bg-blue-600 text-white",
    warning: "bg-amber-600 text-white",
    promotional: "bg-purple-600 text-white",
    urgent: "bg-red-600 text-white",
};

const TYPE_ICON_COLORS: Record<NotificationType, string> = {
    info: "text-blue-400",
    warning: "text-amber-400",
    promotional: "text-purple-400",
    urgent: "text-red-400",
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState<NotificationType>("info");
    const [targetAudience, setTargetAudience] = useState<TargetAudience>("all");

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/admin/notifications", {
                headers: { Authorization: getAdminAuthHeader() },
            });
            if (!res.ok) throw new Error("Failed to fetch notifications");
            const data = await res.json();
            setNotifications(data.notifications || data || []);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Failed to fetch notifications";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setMessage("");
        setType("info");
        setTargetAudience("all");
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            const res = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAdminAuthHeader(),
                },
                body: JSON.stringify({
                    title,
                    message,
                    type,
                    target_audience: targetAudience,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to send notification");
            }

            toast.success("Notification sent successfully!");
            resetForm();
            fetchNotifications();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Failed to send notification";
            toast.error(msg);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <MdNotifications className="text-blue-400" />
                    Notifications
                </h1>
                <p className="text-slate-400 mt-1">Send notifications to your users</p>
            </div>

            {/* Send Form Card */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <MdSend className="w-5 h-5 text-blue-400" />
                        Send Notification
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Create and send a push notification to your users
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSend} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Title <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder="e.g. New Feature Available!"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Message <span className="text-rose-500">*</span>
                            </label>
                            <Textarea
                                placeholder="Enter your notification message..."
                                required
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as NotificationType)}
                                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                                >
                                    {NOTIFICATION_TYPES.map((t) => (
                                        <option key={t} value={t}>
                                            {t.charAt(0).toUpperCase() + t.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Target Audience
                                </label>
                                <select
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
                                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                                >
                                    {TARGET_AUDIENCES.map((a) => (
                                        <option key={a} value={a}>
                                            {a === "all"
                                                ? "All Users"
                                                : a.charAt(0).toUpperCase() + a.slice(1) + " Users"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Preview Card */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Preview</label>
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                                        <MdNotifications className={`w-5 h-5 ${TYPE_ICON_COLORS[type]}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold text-white truncate">
                                                {title || "Notification Title"}
                                            </p>
                                            <Badge
                                                className={`text-[10px] font-bold uppercase shrink-0 ${TYPE_BADGE_COLORS[type]}`}
                                            >
                                                {type}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-400 line-clamp-2">
                                            {message || "Notification message preview will appear here..."}
                                        </p>
                                        <p className="text-[10px] text-slate-600 mt-1">
                                            Billmensor {"&middot;"} Just now {"&middot;"} {targetAudience === "all" ? "Broadcast" : targetAudience + " Users"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                            isLoading={sending}
                        >
                            <MdSend size={18} className="mr-2" />
                            {sending ? "Sending..." : "Send Notification"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Notification History Card */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <MdHistory className="w-5 h-5 text-blue-400" />
                        Notification History
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        All previously sent notifications
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <MdNotifications className="mx-auto w-12 h-12 mb-4 opacity-30" />
                            <p className="font-medium">No notifications sent yet</p>
                            <p className="text-sm">Send your first notification above</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="text-left text-xs text-slate-500 uppercase tracking-widest font-semibold pb-3 pr-4">
                                            Title
                                        </th>
                                        <th className="text-left text-xs text-slate-500 uppercase tracking-widest font-semibold pb-3 px-4 hidden sm:table-cell">
                                            Type
                                        </th>
                                        <th className="text-left text-xs text-slate-500 uppercase tracking-widest font-semibold pb-3 px-4 hidden md:table-cell">
                                            Target
                                        </th>
                                        <th className="text-left text-xs text-slate-500 uppercase tracking-widest font-semibold pb-3 pl-4 hidden lg:table-cell">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notifications.map((n) => (
                                        <tr
                                            key={n.id}
                                            className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors"
                                        >
                                            <td className="py-3 pr-4">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {n.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate max-w-xs">
                                                        {n.message}
                                                    </p>
                                                    <div className="sm:hidden mt-1 flex items-center gap-2">
                                                        <Badge
                                                            className={`text-[10px] font-bold uppercase ${TYPE_BADGE_COLORS[n.type]}`}
                                                        >
                                                            {n.type}
                                                        </Badge>
                                                        <span className="text-[10px] text-slate-500">
                                                             {n.target_audience === 'all' ? 'Broadcast' : n.target_audience === 'premium' ? 'Premium Users' : n.target_audience === 'free' ? 'Free Users' : 'Broadcast'}
                                                         </span>
                                                        <span className="text-[10px] text-slate-500">
                                                            {formatDate(n.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden sm:table-cell">
                                                <Badge
                                                    className={`text-[10px] font-bold uppercase ${TYPE_BADGE_COLORS[n.type]}`}
                                                >
                                                    {n.type}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell">
                                                 <span className="text-sm text-slate-400 capitalize">
                                                     {n.target_audience === 'all' ? 'All Users' : n.target_audience === 'premium' ? 'Premium Users' : n.target_audience === 'free' ? 'Free Users' : 'All Users'}
                                                 </span>
                                             </td>
                                            <td className="py-3 pl-4 hidden lg:table-cell">
                                                <span className="text-sm text-slate-500">
                                                    {formatDate(n.created_at)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
