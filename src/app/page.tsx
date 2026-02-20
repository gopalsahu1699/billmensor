"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart3, Users, Star } from "lucide-react";

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-500">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-600/20 text-white">B</div>
            <span className="text-2xl font-bold tracking-tight">Billmensor</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a>
            <a href="#about" className="hover:text-blue-400 transition-colors">About</a>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 px-6">
                  Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 px-6">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-400 text-sm font-medium mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Next-Gen Billing System
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400"
          >
            Manage Your Billing <br /> With Precision
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-xl text-slate-400 mb-10"
          >
            The all-in-one platform for invoices, inventory, and expense tracking. Designed for modern businesses that demand speed and reliability.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-500 rounded-2xl group shadow-2xl shadow-blue-500/20">
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-500 rounded-2xl group shadow-2xl shadow-blue-500/20">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-2xl border-white/10 hover:bg-white/5 hover:text-white">
                    View Live Demo
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 relative px-4 sm:px-0"
          >
            <div className="relative p-2 rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-3xl overflow-hidden shadow-2xl skew-y-[-1deg] transition-transform hover:skew-y-0 duration-700">
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
                alt="Dashboard"
                className="rounded-2xl opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-slate-950/30">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Active Businesses", value: "10k+" },
            { label: "Invoices Generated", value: "1M+" },
            { label: "Customer Rating", value: "4.9/5" },
            { label: "Uptime Guarantee", value: "99.9%" }
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-slate-500 text-sm uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Powerful tools to help you manage your business like a pro. Smooth, fast, and secure.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6 text-yellow-400" />,
                title: "Instant Invoicing",
                desc: "Generate professional GST-ready invoices in seconds with our smart editor."
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-green-400" />,
                title: "Real-time Reports",
                desc: "Deep insights into your sales, expenses, and profits with beautiful charts."
              },
              {
                icon: <Shield className="w-6 h-6 text-blue-400" />,
                title: "Bank-grade Security",
                desc: "Your data is encrypted and backed up daily. Privacy is our top priority."
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl border border-white/5 bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
              >
                <div className="mb-6 p-3 w-fit rounded-2xl bg-slate-950 border border-white/5">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-8 text-blue-500">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">B</div>
            <span className="text-xl font-bold">Billmensor</span>
          </div>
          <p className="text-slate-500 text-sm mb-8 italic">Crafted with precision for modern Indian entrepreneurs.</p>
          <div className="flex justify-center gap-8 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

