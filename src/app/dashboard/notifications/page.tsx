'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/types';
import {
    MdNotifications,
    MdInfo,
    MdWarning,
    MdCampaign,
    MdLocalOffer,
} from 'react-icons/md';

const TYPE_BADGE_CLASSES: Record<string, string> = {
    info: 'bg-blue-600 text-white',
    warning: 'bg-amber-600 text-white',
    promotional: 'bg-purple-600 text-white',
    urgent: 'bg-red-600 text-white',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
    info: <MdInfo className="w-5 h-5 text-blue-400" />,
    warning: <MdWarning className="w-5 h-5 text-amber-400" />,
    promotional: <MdCampaign className="w-5 h-5 text-purple-400" />,
    urgent: <MdLocalOffer className="w-5 h-5 text-red-400" />,
};

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getRelativeDateGroup(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (notifDate >= today) return 'Today';
    if (notifDate >= yesterday) return 'Yesterday';
    if (notifDate >= weekAgo) return 'This Week';
    return 'Older';
}

function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
    const groups: Record<string, Notification[]> = {};
    for (const n of notifications) {
        const group = getRelativeDateGroup(n.created_at);
        if (!groups[group]) groups[group] = [];
        groups[group].push(n);
    }
    return groups;
}

const GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Older'];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const data = await res.json();
            setNotifications(data.notifications || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const grouped = groupByDate(notifications);

    return (
        <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <MdNotifications className="text-blue-400" />
                    Notifications
                </h1>
                <p className="text-slate-400 mt-1">
                    Stay updated with your latest notifications
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : notifications.length === 0 ? (
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <MdNotifications className="w-16 h-16 text-slate-600 mb-4" />
                        <p className="text-lg font-medium text-slate-400">No notifications yet</p>
                        <p className="text-sm text-slate-500 mt-1">
                            You&apos;ll see notifications here when they arrive
                        </p>
                    </CardContent>
                </Card>
            ) : (
                GROUP_ORDER.filter((g) => grouped[g]?.length).map((group) => (
                    <div key={group}>
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                            {group}
                        </h2>
                        <div className="space-y-3">
                            {grouped[group].map((n) => (
                                <Card
                                    key={n.id}
                                    className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors"
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                                {TYPE_ICONS[n.type] || (
                                                    <MdNotifications className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CardTitle className="text-sm font-semibold text-white truncate">
                                                        {n.title}
                                                    </CardTitle>
                                                    <Badge
                                                        className={`text-[10px] font-bold uppercase shrink-0 ${TYPE_BADGE_CLASSES[n.type] || 'bg-slate-600 text-white'}`}
                                                    >
                                                        {n.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-400 line-clamp-2">
                                                    {n.message}
                                                </p>
                                                <p className="text-[10px] text-slate-600 mt-1">
                                                    {formatTime(n.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
