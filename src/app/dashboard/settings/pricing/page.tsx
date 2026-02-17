"use client";

import { motion } from "framer-motion";
import { Check, Star, Zap, Shield, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
    const plans = [
        {
            name: "Free",
            price: "₹0",
            desc: "For small hobbyists",
            features: ["50 Invoices / Month", "1 User", "Standard Templates", "Basic Support"],
            button: "Current Plan",
            color: "border-slate-800",
            active: true
        },
        {
            name: "Pro",
            price: "₹499",
            period: "/ mo",
            desc: "Perfect for growing businesses",
            features: ["Unlimited Invoices", "5 Users", "Premium Themes", "WhatsApp Bot (Basic)", "Priority Support"],
            button: "Upgrade to Pro",
            color: "border-blue-500/50 bg-blue-500/5",
            recommend: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            desc: "Advanced multi-store control",
            features: ["Unlimited Everything", "Custom Branding", "Full AI Bot Training", "Dedicated AM", "API Access"],
            button: "Contact Sales",
            color: "border-purple-500/50 bg-purple-500/5"
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12 py-10"
        >
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Simple, Transparent Pricing</h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">Choose the plan that fits your business scale. No hidden fees, cancel anytime.</p>

                <div className="flex items-center justify-center gap-4 pt-4">
                    <span className="text-sm text-slate-300 font-medium">Billed Monthly</span>
                    <div className="w-12 h-6 rounded-full bg-blue-600 p-1 cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm" />
                    </div>
                    <span className="text-sm text-slate-500">Billed Yearly (Save 20%)</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 max-w-7xl mx-auto">
                {plans.map((plan, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -10 }}
                        className={`p-8 rounded-[40px] border shadow-2xl relative flex flex-col ${plan.color} backdrop-blur-3xl`}
                    >
                        {plan.recommend && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/40 border border-blue-400/20">
                                Most Popular
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                {plan.name === "Pro" && <Zap className="w-5 h-5 text-blue-400" />}
                                {plan.name === "Enterprise" && <Crown className="w-5 h-5 text-purple-400" />}
                                {plan.name}
                            </h3>
                            <p className="text-slate-500 text-sm font-medium">{plan.desc}</p>
                        </div>

                        <div className="mb-8 flex items-baseline gap-1">
                            <span className="text-5xl font-black text-white">{plan.price}</span>
                            {plan.period && <span className="text-slate-500 font-bold">{plan.period}</span>}
                        </div>

                        <div className="space-y-4 mb-10 flex-1">
                            {plan.features.map((feat, fi) => (
                                <div key={fi} className="flex items-start gap-3">
                                    <div className="mt-1 p-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                                        <Check className="w-3 h-3 text-blue-400" />
                                    </div>
                                    <span className="text-sm text-slate-300 font-medium">{feat}</span>
                                </div>
                            ))}
                        </div>

                        <Button
                            className={`h-14 rounded-3xl font-black text-sm uppercase tracking-widest transition-all
                  ${plan.active
                                    ? "bg-slate-800 text-slate-400 cursor-default"
                                    : plan.recommend
                                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20"
                                        : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                                }
               `}
                            disabled={plan.active}
                        >
                            {plan.button}
                        </Button>
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-center pt-8">
                <div className="p-6 rounded-3xl glass-dark border border-white/5 max-w-2xl w-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center p-0.5 shadow-lg shadow-yellow-500/20">
                            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-yellow-400" />
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-white">Trust is earned</p>
                            <p className="text-xs text-slate-500">Join 5000+ businesses daily thriving on BillMensor.</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="text-blue-400 hover:text-blue-300 font-bold">Start Free Trial</Button>
                </div>
            </div>
        </motion.div>
    );
}
