"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setSubmitted(true);
            toast.success("Reset link sent to your email!");
        } catch (error: any) {
            toast.error(error.message || "Failed to send reset link");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-[#020617] overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl glass-dark shadow-2xl mx-4"
            >
                <Link href="/login" className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                </Link>

                <div className="text-center mb-8">
                    <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                        <Mail className="w-6 h-6 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Forgot Password?</h1>
                    <p className="text-slate-400 mt-2">No worries, we'll send you reset instructions.</p>
                </div>

                {!submitted ? (
                    <form onSubmit={handleReset} className="space-y-6">
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

                        <Button
                            disabled={loading}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Send Reset Link <Send className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm leading-relaxed">
                            We've sent a password reset link to <span className="font-bold text-green-300">{email}</span>. Please check your inbox and spam folder.
                        </div>
                        <Button
                            onClick={() => setSubmitted(false)}
                            variant="outline"
                            className="w-full h-12 border-slate-700 text-slate-300 hover:text-white rounded-xl"
                        >
                            Didn't receive the email? Try again
                        </Button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
