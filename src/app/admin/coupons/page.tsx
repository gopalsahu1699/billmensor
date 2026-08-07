"use client";

import { useState, useEffect, useCallback } from "react";
import { Coupon, CouponRedemption } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    MdAdd,
    MdLocalOffer,
    MdCheckCircle,
    MdCancel,
    MdVisibility,
    MdVisibilityOff,
    MdExpandMore,
    MdExpandLess,
    MdCalendarToday,
} from "react-icons/md";

type PlanType = "free" | "monthly" | "yearly" | "lifetime";

function getAdminAuthHeader(): string {
    const username = sessionStorage.getItem("admin_user") || "";
    const password = sessionStorage.getItem("admin_pass") || "";
    return "Basic " + btoa(username + ":" + password);
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [expandedCoupon, setExpandedCoupon] = useState<string | null>(null);
    const [redemptions, setRedemptions] = useState<Record<string, CouponRedemption[]>>({});
    const [loadingRedemptions, setLoadingRedemptions] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        code: "",
        description: "",
        plan_type: "yearly" as PlanType,
        discount_percent: 100,
        max_uses: 1,
        per_user_limit: 1,
        valid_until: "",
    });
    const [saving, setSaving] = useState(false);

    const fetchCoupons = useCallback(async () => {
        try {
            const res = await fetch("/api/coupons", {
                headers: { Authorization: getAdminAuthHeader() },
            });
            if (!res.ok) {
                if (res.status === 403) {
                    toast.error("Admin access denied. Please login again.");
                    return;
                }
                const data = await res.json();
                throw new Error(data.error || "Failed to fetch coupons");
            }
            const data = await res.json();
            setCoupons(data as Coupon[]);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to fetch coupons";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/coupons", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAdminAuthHeader(),
                },
                body: JSON.stringify({
                    ...formData,
                    code: formData.code.toUpperCase(),
                    valid_until: formData.valid_until || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create coupon");
            }

            toast.success("Coupon created successfully!");
            setShowModal(false);
            resetForm();
            fetchCoupons();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to create coupon";
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (coupon: Coupon) => {
        try {
            const res = await fetch(`/api/coupons/${coupon.id}/toggle`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: getAdminAuthHeader(),
                },
                body: JSON.stringify({ is_active: !coupon.is_active }),
            });

            if (!res.ok) {
                const fallbackRes = await fetch("/api/coupons", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: getAdminAuthHeader(),
                    },
                    body: JSON.stringify({
                        id: coupon.id,
                        is_active: !coupon.is_active,
                    }),
                });
                if (!fallbackRes.ok) {
                    const data = await fallbackRes.json();
                    throw new Error(data.error || "Failed to update coupon");
                }
            }

            toast.success(`Coupon ${coupon.is_active ? "deactivated" : "activated"}`);
            fetchCoupons();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update coupon";
            toast.error(message);
        }
    };

    const handleViewRedemptions = async (couponId: string) => {
        if (expandedCoupon === couponId) {
            setExpandedCoupon(null);
            return;
        }

        setExpandedCoupon(couponId);
        setLoadingRedemptions(couponId);

        try {
            const res = await fetch(`/api/coupons/${couponId}/redemptions`, {
                headers: { Authorization: getAdminAuthHeader() },
            });

            if (!res.ok) {
                const fallbackRes = await fetch(`/api/admin/coupon-redemptions?coupon_id=${couponId}`, {
                    headers: { Authorization: getAdminAuthHeader() },
                });
                if (!fallbackRes.ok) {
                    throw new Error("Failed to fetch redemptions");
                }
                const data = await fallbackRes.json();
                setRedemptions((prev) => ({ ...prev, [couponId]: data as CouponRedemption[] }));
                return;
            }

            const data = await res.json();
            setRedemptions((prev) => ({ ...prev, [couponId]: data as CouponRedemption[] }));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to fetch redemptions";
            toast.error(message);
        } finally {
            setLoadingRedemptions(null);
        }
    };

    const resetForm = () => {
        setFormData({
            code: "",
            description: "",
            plan_type: "yearly",
            discount_percent: 100,
            max_uses: 1,
            per_user_limit: 1,
            valid_until: "",
        });
    };

    const getPlanBadgeColor = (plan_type: string) => {
        switch (plan_type) {
            case "lifetime": return "bg-purple-600";
            case "yearly": return "bg-blue-600";
            case "monthly": return "bg-emerald-600";
            default: return "bg-slate-600";
        }
    };

    const usagePercent = (used: number, max: number) => {
        if (max === 0) return 0;
        return Math.min(100, (used / max) * 100);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Coupon Management</h1>
                    <p className="text-slate-400 mt-1">Create and manage promo codes for premium plans</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                    <MdAdd size={18} className="mr-1" />
                    New Coupon
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-slate-800 bg-slate-950">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-white">{coupons.length}</div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Total</p>
                    </CardContent>
                </Card>
                <Card className="border-slate-800 bg-slate-950">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-emerald-400">
                            {coupons.filter((c) => c.is_active).length}
                        </div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Active</p>
                    </CardContent>
                </Card>
                <Card className="border-slate-800 bg-slate-950">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-400">
                            {coupons.reduce((sum, c) => sum + c.used_count, 0)}
                        </div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Redemptions</p>
                    </CardContent>
                </Card>
                <Card className="border-slate-800 bg-slate-950">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-400">
                            {coupons.reduce((sum, c) => sum + (c.max_uses - c.used_count), 0)}
                        </div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Remaining</p>
                    </CardContent>
                </Card>
            </div>

            {/* Coupons Table */}
            <Card className="border-slate-800 bg-slate-950">
                <CardHeader>
                    <CardTitle className="text-white">All Coupons</CardTitle>
                    <CardDescription className="text-slate-400">Click on a coupon to see redemption details</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <MdLocalOffer className="mx-auto w-12 h-12 mb-4 opacity-30" />
                            <p className="font-medium">No coupons yet</p>
                            <p className="text-sm">Create your first coupon to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {coupons.map((coupon) => (
                                <div key={coupon.id} className="border border-slate-800 rounded-xl overflow-hidden">
                                    <div
                                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                                        onClick={() => handleViewRedemptions(coupon.id)}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                                <MdLocalOffer className="text-blue-400 w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-mono font-bold text-sm tracking-wider text-white">{coupon.code}</div>
                                                <div className="text-xs text-slate-500 truncate">{coupon.description || "No description"}</div>
                                            </div>
                                        </div>

                                        <Badge className={`${getPlanBadgeColor(coupon.plan_type)} text-white text-[10px] font-bold uppercase tracking-widest h-6 shrink-0 hidden sm:block`}>
                                            {coupon.plan_type}
                                        </Badge>

                                        <div className="text-sm font-bold text-slate-300 shrink-0 hidden md:block">
                                            {coupon.discount_percent}% off
                                        </div>

                                        <div className="w-24 shrink-0 hidden lg:block">
                                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                                <span>{coupon.used_count}/{coupon.max_uses}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${usagePercent(coupon.used_count, coupon.max_uses) >= 90 ? "bg-rose-500" : usagePercent(coupon.used_count, coupon.max_uses) >= 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                                                    style={{ width: `${usagePercent(coupon.used_count, coupon.max_uses)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-500 shrink-0 hidden xl:block">
                                            {coupon.valid_until
                                                ? `Until ${new Date(coupon.valid_until).toLocaleDateString("en-IN")}`
                                                : "No expiry"}
                                        </div>

                                        <Badge
                                            variant={coupon.is_active ? "default" : "secondary"}
                                            className={`text-[10px] font-bold shrink-0 ${coupon.is_active ? "bg-emerald-600" : ""}`}
                                        >
                                            {coupon.is_active ? "Active" : "Inactive"}
                                        </Badge>

                                        {expandedCoupon === coupon.id ? (
                                            <MdExpandLess className="text-slate-400 w-5 h-5 shrink-0" />
                                        ) : (
                                            <MdExpandMore className="text-slate-400 w-5 h-5 shrink-0" />
                                        )}
                                    </div>

                                    {expandedCoupon === coupon.id && (
                                        <div className="border-t border-slate-800 p-4 bg-slate-900/50">
                                            <div className="flex items-center gap-2 mb-3">
                                                <MdCheckCircle className="w-4 h-4 text-emerald-500" />
                                                <span className="text-sm font-bold text-white">Redemptions</span>
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {redemptions[coupon.id]?.length || 0}
                                                </Badge>
                                            </div>

                                            {loadingRedemptions === coupon.id ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                </div>
                                            ) : !redemptions[coupon.id] || redemptions[coupon.id].length === 0 ? (
                                                <p className="text-sm text-slate-500 italic">No redemptions yet</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {redemptions[coupon.id].map((r) => (
                                                        <div
                                                            key={r.id}
                                                            className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <MdCheckCircle className="text-emerald-500 w-4 h-4" />
                                                                <span className="text-sm font-mono text-slate-300">{r.user_id.slice(0, 8)}...</span>
                                                                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                                                                    {r.plan_granted}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                <MdCalendarToday className="w-3 h-3" />
                                                                {new Date(r.redeemed_at).toLocaleDateString("en-IN")}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800">
                                                <Button
                                                    size="sm"
                                                    variant={coupon.is_active ? "outline" : "primary"}
                                                    onClick={(e) => { e.stopPropagation(); handleToggleActive(coupon); }}
                                                    className={coupon.is_active ? "text-rose-400 border-rose-800 hover:bg-rose-950" : ""}
                                                >
                                                    {coupon.is_active ? (
                                                        <>
                                                            <MdVisibilityOff className="w-4 h-4 mr-1" />
                                                            Deactivate
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MdVisibility className="w-4 h-4 mr-1" />
                                                            Activate
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Coupon Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Create New Coupon</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-slate-800 rounded-lg"
                                >
                                    <MdCancel className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCoupon} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Coupon Code <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. LIFETIME10"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="font-mono uppercase tracking-wider bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. Launch special offer"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Plan Type</label>
                                        <select
                                            value={formData.plan_type}
                                            onChange={(e) => setFormData({ ...formData, plan_type: e.target.value as PlanType })}
                                            className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                                        >
                                            <option value="free">Free</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                            <option value="lifetime">Lifetime</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Discount %</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={formData.discount_percent}
                                            onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                                            className="bg-slate-900 border-slate-700 text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Max Uses</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={formData.max_uses}
                                            onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) || 1 })}
                                            className="bg-slate-900 border-slate-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Per User Limit</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={formData.per_user_limit}
                                            onChange={(e) => setFormData({ ...formData, per_user_limit: parseInt(e.target.value) || 1 })}
                                            className="bg-slate-900 border-slate-700 text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Valid Until (optional)</label>
                                    <Input
                                        type="date"
                                        value={formData.valid_until}
                                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                        min={new Date().toISOString().split("T")[0]}
                                        className="bg-slate-900 border-slate-700 text-white"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold"
                                    >
                                        {saving ? "Creating..." : "Create Coupon"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
