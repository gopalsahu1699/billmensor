"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return toast.error("Passwords do not match");
        }

        if (password.length < 8) {
            return toast.error("Password must be at least 8 characters");
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setSuccess(true);
            toast.success("Password updated successfully!");
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (error: any) {
            toast.error(error.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-[#020617] overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl glass-dark shadow-2xl mx-4"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-4">
                        <Lock className="w-6 h-6 text-purple-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Set New Password</h1>
                    <p className="text-slate-400 mt-2">Enter a strong password for your account.</p>
                </div>

                {!success ? (
                    <form onSubmit={handleReset} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-slate-200 ml-1">New Password</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 h-12 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:ring-purple-500/50 focus:border-purple-500 transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-200 ml-1">Confirm Password</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10 h-12 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:ring-purple-500/50 focus:border-purple-500 transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <Button
                            disabled={loading}
                            className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                            <p className="font-bold">Password Updated!</p>
                            <p className="text-sm opacity-80 mt-1">Redirecting to login in 3 seconds...</p>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
