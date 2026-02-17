"use client";

import { motion } from "framer-motion";
import { CreditCard, QrCode, Share2, Download, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BusinessCardPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-blue-400" />
                        Digital Business Card
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium italic">Your business identity, always mobile.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-12 px-6">
                        <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 h-12 px-6">
                        <Share2 className="w-4 h-4 mr-2" /> Share Card
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                {/* Live Preview */}
                <motion.div
                    whileHover={{ rotateY: 10, rotateX: -5 }}
                    style={{ perspective: 1000 }}
                    className="group"
                >
                    <div className="relative aspect-[16/9] rounded-[32px] bg-linear-to-br from-[#1e1e1e] to-[#0a0a0a] border border-white/10 shadow-[0_35px_100px_-15px_rgba(0,0,0,0.8)] p-8 flex flex-col justify-between overflow-hidden">
                        {/* Design Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

                        <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-1">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg text-white">B</div>
                                <h2 className="text-xl font-black text-white tracking-tight pt-4">BillMensor Tech</h2>
                                <p className="text-blue-400 text-xs font-bold tracking-widest uppercase">Solution Partner</p>
                            </div>
                            <div className="p-3 bg-white rounded-2xl shadow-xl">
                                <QrCode className="w-16 h-16 text-black" />
                            </div>
                        </div>

                        <div className="relative z-10">
                            <p className="text-xs text-slate-500 font-bold tracking-widest mb-4">MEMBER SINCE 2024</p>
                            <div className="space-y-1">
                                <p className="text-white font-bold">Johnathan Doe</p>
                                <p className="text-slate-400 text-[10px] tracking-wide">+91 99999 00000 | demo@billmensor.com</p>
                            </div>
                        </div>
                    </div>
                    <p className="mt-6 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        Tap and hold to save to photos
                    </p>
                </motion.div>

                {/* Settings */}
                <div className="space-y-6">
                    <motion.div
                        whileHover={{ x: 5 }}
                        className="p-6 rounded-3xl glass-dark border border-white/5 shadow-2xl"
                    >
                        <h4 className="font-bold text-white mb-4">Public URL</h4>
                        <div className="flex gap-2">
                            <div className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center px-4 text-slate-400 text-sm overflow-hidden truncate">
                                billmensor.in/biz/john-doe-001
                            </div>
                            <Button variant="ghost" className="h-12 w-12 rounded-xl border border-white/10 hover:bg-white/5 text-blue-400">
                                <ExternalLink className="w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>

                    <div className="p-6 rounded-3xl glass-dark border border-white/5 shadow-2xl space-y-4">
                        <h4 className="font-bold text-white mb-2">Card Essentials</h4>
                        {[
                            { label: "Show GSTIN", val: "Yes" },
                            { label: "Design Theme", val: "Obsidian Silver" },
                            { label: "NFC Enabled", val: "BillMensor Plus 👑" }
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                <span className="text-slate-400 text-sm">{item.label}</span>
                                <span className="text-white text-sm font-bold">{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
