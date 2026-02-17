"use client";

import { motion } from "framer-motion";
import { Printer, Tablet, CheckCircle2, AlertCircle, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ThermalPrintPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
        >
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white text-gradient">Thermal Print Settings</h1>
                <p className="text-slate-400 mt-1 font-medium">Configure your 2-inch and 3-inch POS printers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                    whileHover={{ y: -5 }}
                    className="p-8 rounded-3xl glass-dark border border-white/5 shadow-2xl flex flex-col items-center text-center space-y-4"
                >
                    <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <Tablet className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold">2-Inch Printer</h3>
                    <p className="text-sm text-slate-400 italic">Best for small receipts and fast checkout.</p>
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Ready to Print
                    </div>
                    <Button variant="outline" className="w-full rounded-xl border-white/10 hover:bg-white/5">
                        Test Print (2-inch)
                    </Button>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="p-8 rounded-3xl glass-dark border border-white/5 shadow-2xl flex flex-col items-center text-center space-y-4"
                >
                    <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20">
                        <Printer className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold">3-Inch Printer</h3>
                    <p className="text-sm text-slate-400 italic">Recommended for detailed itemized receipts.</p>
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                        <AlertCircle className="w-4 h-4 text-yellow-500" /> Not Connected
                    </div>
                    <Button variant="outline" className="w-full rounded-xl border-white/10 hover:bg-white/5">
                        Connect Printer
                    </Button>
                </motion.div>
            </div>

            <motion.div
                whileHover={{ y: -2 }}
                className="p-8 rounded-3xl glass-dark border border-white/5 shadow-2xl"
            >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-blue-500" />
                    Advanced Printer Configuration
                </h2>
                <div className="space-y-4">
                    {[
                        { label: "Auto-print after save", val: "OFF" },
                        { label: "Printer DPI", val: "203 DPI" },
                        { label: "Connection Mode", val: "Bluetooth" }
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-slate-300 font-medium">{item.label}</span>
                            <span className="text-blue-400 font-bold">{item.val}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
