"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Zap, Shield, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface RazorpayInstance {
    open(): void;
}

interface RazorpayOptions {
    key: string | undefined;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayResponse) => Promise<void>;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme?: {
        color?: string;
    };
}

interface RazorpayConstructor {
    new(options: RazorpayOptions): RazorpayInstance;
}

declare global {
    interface Window {
        Razorpay: RazorpayConstructor;
    }
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

export default function BillingPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error: unknown) {
            console.error(error);
            toast.error("Failed to fetch billing info");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async (planType: 'monthly' | 'yearly') => {
        setProcessing(planType);
        const amount = planType === 'monthly' ? 199 : 1999;

        try {
            // 1. Create Order
            const res = await fetch('/api/razorpay/order', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType, amount }),
            });

            const order = await res.json();
            if (order.error) throw new Error(order.error);

            // 2. Open Razorpay Modal
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "BillMensor",
                description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Backup Subscription`,
                order_id: order.id,
                handler: async (response: RazorpayResponse) => {
                    try {
                        // 3. Verify Payment
                        const verifyRes = await fetch('/api/razorpay/verify', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...response,
                                planType,
                            }),
                        });

                        const result = await verifyRes.json();
                        if (result.success) {
                            toast.success("Subscription activated successfully!");
                            fetchProfile();
                        } else {
                            throw new Error(result.error || "Payment verification failed");
                        }
                    } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : "Verification failed";
                        toast.error(message);
                    }
                },
                prefill: {
                    name: profile?.full_name || "",
                    email: profile?.email || "",
                    contact: profile?.phone || "",
                },
                theme: {
                    color: "#2563eb",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Checkout failed";
            toast.error(message);
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]">Loading billing info...</div>;
    }

    const isExpired = profile?.plan_expiry && new Date(profile.plan_expiry) < new Date();
    const daysLeft = profile?.plan_expiry ? Math.ceil((new Date(profile.plan_expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
                <p className="text-slate-500 text-lg">Manage your cloud backup plan and data security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Plan Card */}
                <Card className="md:col-span-2 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Current Plan</CardTitle>
                                <CardDescription>Your active subscription details</CardDescription>
                            </div>
                            <Badge variant={profile?.plan_type === 'free' ? 'secondary' : 'default'} className="h-6 px-4 text-xs font-bold uppercase tracking-widest">
                                {profile?.plan_type || 'Free'} Plan
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Shield className="text-blue-600 w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold flex items-center gap-2">
                                    Cloud Backup Status:
                                    {profile?.plan_type !== 'free' && !isExpired ? (
                                        <span className="text-emerald-600 flex items-center gap-1 text-sm"><CheckCircle2 size={14} /> Protected</span>
                                    ) : (
                                        <span className="text-rose-600 flex items-center gap-1 text-sm"><AlertCircle size={14} /> Not Protected</span>
                                    )}
                                </div>
                                <div className="text-sm text-slate-500">
                                    {profile?.plan_expiry
                                        ? `Expiring on ${format(new Date(profile.plan_expiry), "PPP")}`
                                        : "No active backup plan. Your data is only stored locally."
                                    }
                                </div>
                            </div>
                        </div>

                        {isExpired && (
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <span className="font-bold uppercase tracking-widest text-xs block mb-1">Backup Expired!</span>
                                    Your cloud backup will be permanently deleted in 2 days if not renewed. Upgrade now to keep your data safe.
                                </div>
                            </div>
                        )}

                        {!isExpired && daysLeft > 0 && daysLeft <= 7 && (
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-start gap-3">
                                <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="text-sm font-medium">
                                    Your plan expires in {daysLeft} days. Renew now to avoid data deletion risks.
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Benefits Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Premium Benefits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {[
                                "Daily Cloud Backups",
                                "Data Recovery Support",
                                "Multi-Device Sync",
                                "WhatsApp Priority Support",
                                "Remove 'BillMensor' Branding"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                    <CheckCircle2 className="text-blue-500 w-4 h-4 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Monthly Plan */}
                <div className="p-10 rounded-[40px] bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Zap size={100} />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-widest italic mb-2">Monthly</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-5xl font-black italic">₹199</span>
                        <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">/ Month</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                        Perfect for businesses starting with cloud safety. Manual and automatic daily backups.
                    </p>
                    <Button
                        onClick={() => handleCheckout('monthly')}
                        disabled={processing !== null || profile?.plan_type === 'monthly'}
                        className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest shadow-lg"
                    >
                        {processing === 'monthly' ? "Processing..." : profile?.plan_type === 'monthly' ? "Active Plan" : "Get Monthly Backup"}
                    </Button>
                </div>

                {/* Yearly Plan */}
                <div className="p-10 rounded-[40px] bg-blue-600 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20 group">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                        <Shield size={100} />
                    </div>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest mb-4">RECOMMENDED (2 MONTHS FREE)</div>
                    <h3 className="text-2xl font-black uppercase tracking-widest italic mb-2">Yearly Plan</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-5xl font-black italic">₹1,999</span>
                        <span className="text-blue-100 font-bold uppercase text-xs tracking-widest">/ Year</span>
                    </div>
                    <p className="text-sm text-blue-100/80 mb-8 leading-relaxed">
                        Best value for growing businesses. Includes 2 months for free and premium support.
                    </p>
                    <Button
                        onClick={() => handleCheckout('yearly')}
                        disabled={processing !== null || profile?.plan_type === 'yearly'}
                        className="w-full h-14 rounded-2xl bg-white text-blue-600 hover:bg-white/90 font-black uppercase tracking-widest shadow-xl shadow-blue-900/20"
                    >
                        {processing === 'yearly' ? "Processing..." : profile?.plan_type === 'yearly' ? "Active Plan" : "Get 2 Months Free"}
                    </Button>
                </div>
            </div>

            <p className="text-center text-slate-400 text-sm italic">
                *Payments are processed securely via Razorpay. Subscriptions are recurring.
                Data retention policy applies to expired plans after 2 days.
            </p>
        </div>
    );
}
