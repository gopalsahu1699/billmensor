"use client";

import { motion } from "framer-motion";
import { Cloud, RefreshCw, HardDrive, ShieldCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackupRestorePage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
        >
            <div className="flex items-center gap-4">
                <div className="p-4 rounded-3xl bg-blue-600/10 border border-blue-600/20">
                    <Cloud className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Backup & Restore</h1>
                    <p className="text-slate-400 font-medium">Keep your business data safe and portable</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="p-8 rounded-3xl glass-dark border border-white/5 shadow-2xl space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-purple-400" />
                            Local Backup
                        </h3>
                        <span className="text-xs text-slate-500">Last: 2 days ago</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Download your entire database as an encrypted SQLite file. Recommended for offline archives.
                    </p>
                    <Button className="w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold">
                        <Download className="w-4 h-4 mr-2" /> Download Backup
                    </Button>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="p-8 rounded-3xl glass-dark border border-white/5 shadow-2xl space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-green-400">
                            <ShieldCheck className="w-5 h-5" />
                            Cloud Auto-Sync
                        </h3>
                        <span className="text-xs text-green-500 font-bold px-2 py-0.5 rounded-full bg-green-500/10">ACTIVE</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Your data is automatically synced to Supabase Cloud every 60 seconds. Rest easy.
                    </p>
                    <Button className="w-full h-12 bg-green-600/10 hover:bg-green-600/20 text-green-400 rounded-xl border border-green-500/20 font-bold">
                        <RefreshCw className="w-4 h-4 mr-2" /> Sync Now
                    </Button>
                </motion.div>
            </div>

            <motion.div
                whileHover={{ y: -2 }}
                className="p-8 rounded-3xl glass-dark border border-white/5 shadow-2xl"
            >
                <h4 className="text-lg font-bold mb-4">Restore Data</h4>
                <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
                    <p className="text-sm text-red-100/70 mb-4">
                        Restoring from a backup will overwrite your current data. This action is critical and requires caution.
                    </p>
                    <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl">
                        Import Backup File (.json)
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
