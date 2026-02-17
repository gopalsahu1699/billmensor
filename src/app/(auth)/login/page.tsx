"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            toast.success("Welcome back!");
            router.refresh();
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Login Error:", error);
            if (error.message?.includes("Email not confirmed")) {
                toast.error("Please confirm your email address before logging in. Check your inbox!");
            } else {
                toast.error(error.message || "Invalid credentials. Please check your email and password.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-[#020617] overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl glass-dark shadow-2xl mx-4"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4"
                    >
                        <LogIn className="w-6 h-6 text-blue-400" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">BillMensor</h1>
                    <p className="text-slate-400 mt-2">Sign in to your dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-slate-200 ml-1">Email Address</Label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <Input
                                type="email"
                                placeholder="name@company.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 h-12 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500 transition-all rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <Label className="text-slate-200">Password</Label>
                            <Link href="/forgot-password" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                                Forgot?
                            </Link>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <Input
                                type="password"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 h-12 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500 transition-all rounded-xl"
                            />
                        </div>
                    </div>

                    <Button
                        disabled={loading}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                Continue to Dashboard <ArrowRight className="w-4 h-4" />
                            </span>
                        )}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-slate-400 text-sm">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors underline-offset-4 hover:underline">
                            Create one for free
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
