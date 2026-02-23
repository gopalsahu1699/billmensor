"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Zap, Heart, Users, Target } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 font-sans">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-blue-500 group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold tracking-tight">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-2 text-blue-500">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">B</div>
                        <span className="text-xl font-bold tracking-tight">Billmensor</span>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20">
                {/* Hero Section */}
                <section className="relative px-4 mb-32 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px]" />
                    </div>

                    <div className="max-w-4xl mx-auto text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-linear-to-b from-white to-slate-400"
                        >
                            Our Mission: Empowering <br /> <span className="text-blue-500 italic">Indian Entrepreneurs</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-slate-400 leading-relaxed"
                        >
                            We believe that powerful business tools shouldn&apos;t be a luxury.
                            Billmensor was built with a simple goal: to provide high-quality,
                            GST-ready billing and inventory management to every small business owner in India, for free.
                        </motion.p>
                    </div>
                </section>

                {/* The "Free" Philosophy */}
                <section className="px-4 mb-32">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="space-y-8"
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
                                    Our Philosophy
                                </div>
                                <h2 className="text-4xl font-bold tracking-tight">Free Billing, <br />Pay for Backup</h2>
                                <p className="text-slate-400 text-lg leading-relaxed">
                                    Most software companies charge heavy monthly subscriptions for features you use every day. We do things differently.
                                </p>
                                <div className="space-y-4">
                                    {[
                                        "All essential billing features are free forever.",
                                        "Unlimited invoices, customers, and products.",
                                        "GST compliance and detailed financial reports.",
                                        "Only pay if you want premium cloud backup and multi-device sync."
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <CheckCircle2 className="text-blue-500 w-5 h-5 shrink-0" />
                                            <span className="text-slate-200">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="relative"
                            >
                                <div className="aspect-square rounded-[40px] bg-linear-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-12 shadow-2xl shadow-blue-500/20 overflow-hidden group">
                                    <Zap className="w-full h-full text-white/20 absolute -right-20 -bottom-20 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                                    <div className="relative text-center">
                                        <div className="text-6xl font-black italic mb-2">₹0</div>
                                        <div className="text-blue-200 font-bold uppercase tracking-widest text-sm">Monthly Subscription</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Why Billmensor? */}
                <section className="px-4 mb-32 bg-slate-950/30 py-32 border-y border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl font-bold mb-4 tracking-tight">Why Choose Billmensor?</h2>
                            <p className="text-slate-400">Designed for speed, reliability, and ease of use.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: <Heart className="text-rose-500" />,
                                    title: "User Centric",
                                    desc: "Every button and field is placed with purpose to make your workflow faster."
                                },
                                {
                                    icon: <Users className="text-blue-500" />,
                                    title: "Shared Community",
                                    desc: "Listen to the feedback of thousands of users to constantly improve the platform."
                                },
                                {
                                    icon: <Target className="text-emerald-500" />,
                                    title: "GST Ready",
                                    desc: "Stay compliant with Indian tax laws without needing a degree in accounting."
                                }
                            ].map((item, i) => (
                                <div key={i} className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="mb-6 p-4 w-fit rounded-2xl bg-white/5">{item.icon}</div>
                                    <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team/Developer */}
                <section className="px-4 text-center">
                    <div className="max-w-2xl mx-auto space-y-8">
                        <h2 className="text-4xl font-bold tracking-tight">Built with Love</h2>
                        <p className="text-slate-400 text-lg">
                            Billmensor is a labor of love by software engineers dedicated to helping the Indian business ecosystem thrive.
                        </p>
                        <div className="p-1 w-fit mx-auto rounded-full bg-linear-to-r from-blue-600 to-purple-600">
                            <div className="px-8 py-3 rounded-full bg-slate-950 flex items-center gap-4">
                                <span className="text-white font-bold">Gopal Krishn Sahu</span>
                                <div className="w-px h-4 bg-white/20" />
                                <span className="text-slate-400 text-sm">Lead Developer</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 bg-slate-950/50">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-slate-500 text-sm mb-4 italic">© 2024 Billmensor. All rights reserved.</p>
                    <div className="flex justify-center gap-8 text-sm text-slate-400">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <Link href="/login" className="hover:text-white transition-colors">Login</Link>
                        <Link href="/register" className="hover:text-white transition-colors">Register</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
