"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { IoShield, IoCheckmarkCircle, IoAlertCircle, IoTime } from "react-icons/io5";
import { MdBolt, MdDownload, MdComputer, MdCheckCircle, MdLocalOffer } from "react-icons/md";
import { Input } from "@/components/ui/input";
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
    const [couponCode, setCouponCode] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponResult, setCouponResult] = useState<null | { type: 'success' | 'error'; message: string; plan_type?: string; discount_percent?: number }>(null);
    const [couponRedeemed, setCouponRedeemed] = useState(false);

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

    const handleCouponApply = async () => {
        if (!couponCode.trim()) {
            setCouponResult({ type: 'error', message: 'Please enter a coupon code' });
            return;
        }

        setCouponLoading(true);
        setCouponResult(null);

        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode.trim() }),
            });

            const data = await res.json();

            if (res.ok && data.valid) {
                setCouponResult({
                    type: 'success',
                    message: `Coupon valid! ${data.plan_type} plan at ${data.discount_percent}% off.`,
                    plan_type: data.plan_type,
                    discount_percent: data.discount_percent,
                });
            } else {
                setCouponResult({ type: 'error', message: data.error || 'Invalid coupon code' });
            }
        } catch {
            setCouponResult({ type: 'error', message: 'Failed to validate coupon' });
        } finally {
            setCouponLoading(false);
        }
    };

    const handleCouponRedeem = async () => {
        setCouponLoading(true);

        try {
            const res = await fetch('/api/coupons/redeem', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode.trim() }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(`Coupon redeemed! You now have the ${data.plan_type} plan.`);
                setCouponRedeemed(true);
                setCouponResult({ type: 'success', message: `Coupon redeemed successfully! You now have the ${data.plan_type} plan.`, plan_type: data.plan_type });
                fetchProfile();
            } else {
                setCouponResult({ type: 'error', message: data.error || 'Failed to redeem coupon' });
            }
        } catch {
            setCouponResult({ type: 'error', message: 'Failed to redeem coupon' });
        } finally {
            setCouponLoading(false);
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
                <p className="text-slate-500 text-lg">All features are free. Cloud Backup is the only paid feature.</p>
            </div>

            {/* Coupon Section */}
            {profile?.plan_type === 'free' || isExpired ? (
                <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                            <MdLocalOffer className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Have a promo code?</h3>
                            <p className="text-xs text-slate-500">Redeem a coupon to unlock premium backup plans for free</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Input
                            type="text"
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => {
                                setCouponCode(e.target.value.toUpperCase());
                                if (couponResult) setCouponResult(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCouponApply();
                            }}
                            disabled={couponLoading || couponRedeemed}
                            className="uppercase tracking-widest font-mono text-sm"
                        />
                        {couponResult?.type === 'success' && !couponRedeemed ? (
                            <Button
                                onClick={handleCouponRedeem}
                                disabled={couponLoading}
                                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shrink-0"
                            >
                                {couponLoading ? 'Redeeming...' : 'Redeem'}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleCouponApply}
                                disabled={couponLoading || couponRedeemed}
                                className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shrink-0"
                            >
                                {couponLoading ? 'Checking...' : 'Apply'}
                            </Button>
                        )}
                    </div>

                    {couponResult && (
                        <div className={`mt-3 p-3 rounded-xl text-sm flex items-start gap-2 ${
                            couponResult.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50'
                        }`}>
                            {couponResult.type === 'success' ? (
                                <MdCheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            ) : (
                                <IoAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            )}
                            <span>{couponResult.message}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
                    <IoCheckmarkCircle className="w-4 h-4 shrink-0" />
                    You already have an active {profile?.plan_type} plan. No coupon needed.
                </div>
            )}

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
                                <IoShield className="text-blue-600 w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold flex items-center gap-2">
                                    Cloud Backup Status:
                                    {profile?.plan_type !== 'free' && !isExpired ? (
                                        <span className="text-emerald-600 flex items-center gap-1 text-sm"><IoCheckmarkCircle size={14} /> Protected</span>
                                    ) : (
                                        <span className="text-rose-600 flex items-center gap-1 text-sm"><IoAlertCircle size={14} /> Not Protected</span>
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
                                <IoAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <span className="font-bold uppercase tracking-widest text-xs block mb-1">Backup Expired!</span>
                                    Your cloud backup will be permanently deleted in 2 days if not renewed. Upgrade now to keep your data safe.
                                </div>
                            </div>
                        )}

                        {!isExpired && daysLeft > 0 && daysLeft <= 7 && (
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-start gap-3">
                                <IoTime className="w-5 h-5 shrink-0 mt-0.5" />
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
                        <CardTitle className="text-lg">Cloud Backup Benefits</CardTitle>
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
                                    <IoCheckmarkCircle className="text-blue-500 w-4 h-4 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Free Tier */}
                <div className="p-10 rounded-[40px] bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <MdBolt size={100} />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-widest italic mb-2">Free Forever</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-5xl font-black italic">₹0</span>
                        <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">/ Forever</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                        All features + local data storage. No credit card required.
                    </p>
                    <div className="w-full h-14 rounded-2xl bg-slate-100 text-slate-500 font-black uppercase tracking-widest flex items-center justify-center">
                        {profile?.plan_type === 'free' ? 'Current Plan' : 'Default'}
                    </div>
                </div>

                {/* Premium Plan */}
                <div className="p-10 rounded-[40px] bg-blue-600 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20 group">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                        <IoShield size={100} />
                    </div>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest mb-4">CLOUD BACKUP</div>
                    <h3 className="text-2xl font-black uppercase tracking-widest italic mb-2">Cloud Backup</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-5xl font-black italic">₹199</span>
                        <span className="text-blue-100 font-bold uppercase text-xs tracking-widest">/ Month</span>
                    </div>
                    <p className="text-sm text-blue-100/80 mb-8 leading-relaxed">
                        Everything in Free + automatic cloud backup + multi-device sync.
                    </p>
                    <Button
                        onClick={() => handleCheckout('monthly')}
                        disabled={processing !== null || (profile?.plan_type !== 'free' && !isExpired)}
                        className="w-full h-14 rounded-2xl bg-white text-blue-600 hover:bg-white/90 font-black uppercase tracking-widest shadow-xl shadow-blue-900/20"
                    >
                        {processing === 'monthly' ? "Processing..." : (profile?.plan_type !== 'free' && !isExpired) ? "Active Plan" : "Upgrade to Cloud Backup"}
                    </Button>
                </div>
            </div>

            {/* Desktop App Section */}
            <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center shrink-0">
                        <MdComputer className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Windows Desktop App</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            {profile?.plan_type !== 'free' && !isExpired
                                ? "Your data is backed up to the cloud. Use the desktop app for offline access with local data storage."
                                : "Local data via desktop app + web app. No cloud sync. Download the free Windows app to get started."
                            }
                        </p>
                        <ul className="space-y-2 mb-4">
                            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <MdCheckCircle className="text-green-500 w-4 h-4 shrink-0" />
                                Free forever — all billing features included
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <MdCheckCircle className="text-green-500 w-4 h-4 shrink-0" />
                                Data stored locally on your Windows machine
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <MdCheckCircle className="text-green-500 w-4 h-4 shrink-0" />
                                Works offline — no internet required
                            </li>
                            {profile?.plan_type !== 'free' && !isExpired && (
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <MdCheckCircle className="text-green-500 w-4 h-4 shrink-0" />
                                    Optional cloud backup sync available
                                </li>
                            )}
                        </ul>
                        <Link href="/download">
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 py-2 text-sm font-bold flex items-center gap-2">
                                <MdDownload size={16} />
                                Download for Windows
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <p className="text-center text-slate-400 text-sm italic">
                *Payments are processed securely via Razorpay. Subscriptions are recurring.
                Data retention policy applies to expired plans after 2 days.
            </p>
        </div>
    );
}
