"use client";

import { motion } from "framer-motion";
import { Palette, Layers, Star, CheckCircle2, Layout, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvoiceThemesPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white text-gradient">Invoice Themes</h1>
                    <p className="text-slate-400 mt-1 font-medium">Choose a professional look for your business documents</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 px-6">
                    <Palette className="w-4 h-4 mr-2" /> Custom Theme Editor
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    {
                        name: "Modern Minimal",
                        img: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=400",
                        badge: "DEFAULT",
                        color: "border-blue-500/50"
                    },
                    {
                        name: "Classic Corporate",
                        img: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=400",
                        badge: "PROFESSIONAL",
                        color: "border-white/5"
                    },
                    {
                        name: "Electric Night",
                        img: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=400",
                        badge: "DARK MODE",
                        color: "border-white/5"
                    }
                ].map((theme, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className={`p-4 rounded-3xl glass-dark shadow-xl border ${theme.color} flex flex-col gap-4 group cursor-pointer`}
                    >
                        <div className="relative rounded-2xl overflow-hidden aspect-[3/4] border border-white/5 bg-slate-900">
                            <img src={theme.img} alt={theme.name} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold tracking-widest text-white border border-white/10 uppercase">
                                {theme.badge}
                            </div>
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="font-bold text-white mb-1">{theme.name}</p>
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <div className="w-3 h-3 rounded-full bg-slate-400" />
                                    <div className="w-3 h-3 rounded-full bg-slate-800" />
                                </div>
                            </div>
                        </div>
                        {theme.badge === "DEFAULT" ? (
                            <Button variant="outline" className="w-full border-blue-500/30 text-blue-400 bg-blue-500/5 rounded-xl cursor-default hover:bg-blue-500/5" disabled>
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Active
                            </Button>
                        ) : (
                            <Button variant="ghost" className="w-full text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">
                                Apply Theme
                            </Button>
                        )}
                    </motion.div>
                ))}
            </div>

            <motion.div
                whileHover={{ y: -2 }}
                className="p-8 rounded-3xl glass-dark border border-white/5 shadow-2xl flex items-center justify-between gap-8"
            >
                <div className="flex items-center gap-6">
                    <div className="p-4 rounded-3xl bg-yellow-500/10 border border-yellow-500/20">
                        <Zap className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold">Premium Themes</h4>
                        <p className="text-slate-400 text-sm">Unlock 50+ hand-crafted designer templates with BillMensor Plus.</p>
                    </div>
                </div>
                <Button className="bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl shadow-lg shadow-yellow-600/20 px-8 font-bold">
                    View Plus Themes
                </Button>
            </motion.div>

        </motion.div>
    );
}
