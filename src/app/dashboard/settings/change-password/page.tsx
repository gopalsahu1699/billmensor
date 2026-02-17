"use client";

import { motion } from "framer-motion";
import { Lock, ShieldCheck, KeyRound, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePasswordPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto space-y-8 py-10"
        >
            <div className="text-center">
                <div className="inline-flex p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 mb-4 animate-float">
                    <KeyRound className="w-8 h-8 text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Change Password</h1>
                <p className="text-slate-400 font-medium">Protect your account with a secure password</p>
            </div>

            <motion.div
                whileHover={{ scale: 1.01 }}
                className="p-8 rounded-3xl glass-dark border border-white/5 shadow-2xl space-y-6"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-slate-300 ml-1">Current Password</Label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <Input type="password" placeholder="••••••••" className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-blue-500/50" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300 ml-1">New Password</Label>
                        <div className="relative group">
                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <Input type="password" placeholder="Minimum 8 characters" className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-blue-500/50" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300 ml-1">Confirm New Password</Label>
                        <div className="relative group">
                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <Input type="password" placeholder="••••••••" className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl text-white focus:border-blue-500/50" />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-4">
                    <Button className="h-12 bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 font-bold transition-all active:scale-95">
                        Reset Password
                    </Button>
                    <p className="text-xs text-center text-slate-500 italic flex items-center justify-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        You'll be asked to re-login on all devices.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
