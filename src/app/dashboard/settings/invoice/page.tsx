"use client";

import { motion } from "framer-motion";
import { Receipt, FileText, Image as ImageIcon, Ruler, Palette, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function InvoiceSettingsPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white text-gradient">Invoice Settings</h1>
                <p className="text-slate-400 mt-1 font-medium">Customize how your invoices look and feel</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    whileHover={{ y: -2 }}
                    className="p-8 rounded-3xl glass-dark border border-white/5 shadow-2xl space-y-8"
                >
                    <h2 className="text-xl font-bold flex items-center gap-2 border-b border-white/5 pb-4">
                        <Receipt className="w-5 h-5 text-blue-400" />
                        Invoice Core Settings
                    </h2>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between group">
                            <div>
                                <Label className="text-slate-200 font-bold">Tax-Inclusive Pricing</Label>
                                <p className="text-xs text-slate-500">Show prices including taxes by default</p>
                            </div>
                            <Switch />
                        </div>

                        <div className="flex items-center justify-between group">
                            <div>
                                <Label className="text-slate-200 font-bold">Automated Reminders</Label>
                                <p className="text-xs text-slate-500">Send WhatsApp reminders for unpaid bills</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between group">
                            <div>
                                <Label className="text-slate-200 font-bold">QR Code Payments</Label>
                                <p className="text-xs text-slate-500">Add payment QR code to all invoices</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between group">
                            <div>
                                <Label className="text-slate-200 font-bold">Inventory Sync</Label>
                                <p className="text-xs text-slate-500">Reduce stock automatically when invoicing</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -2 }}
                    className="p-8 rounded-3xl glass-dark border border-white/5 shadow-2xl space-y-8"
                >
                    <h2 className="text-xl font-bold flex items-center gap-2 border-b border-white/5 pb-4">
                        <FileText className="w-5 h-5 text-purple-400" />
                        Template Preferences
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { icon: <Palette className="w-4 h-4" />, label: "Accent Color", val: "Sky Blue" },
                            { icon: <Type className="w-4 h-4" />, label: "Font Style", val: "Inter Tight" },
                            { icon: <Ruler className="w-4 h-4" />, label: "Paper Size", val: "A4" },
                            { icon: <ImageIcon className="w-4 h-4" />, label: "Logo Size", val: "Large" },
                        ].map((item, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                                <div className="text-slate-400">{item.icon}</div>
                                <div>
                                    <p className="text-xs text-slate-500">{item.label}</p>
                                    <p className="text-sm font-bold text-white">{item.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4">
                        <Button className="w-full bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/20">
                            Preview Invoice Template
                        </Button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
