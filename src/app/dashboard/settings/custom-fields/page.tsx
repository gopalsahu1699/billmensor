"use client";

import { motion } from "framer-motion";
import { Plus, ListTree, Database, Tag, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function CustomFieldsPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white text-gradient">Custom Fields</h1>
                    <p className="text-slate-400 mt-1 font-medium">Add personalized fields to your invoices and items</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 px-6">
                    <Plus className="w-4 h-4 mr-2" /> Add New Field
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    { icon: <Database className="w-5 h-5 text-sky-400" />, title: "Item Fields", desc: "Additional details for your products like HSN code, batch, etc." },
                    { icon: <ListTree className="w-5 h-5 text-purple-400" />, title: "Invoice Fields", desc: "Custom notes, transport details, or unique identifiers on bills." },
                ].map((section, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="p-8 rounded-3xl glass-dark shadow-xl border border-white/5 space-y-4"
                    >
                        <div className="p-3 w-fit rounded-2xl bg-white/5 border border-white/10">{section.icon}</div>
                        <h3 className="text-xl font-bold text-white">{section.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{section.desc}</p>
                        <div className="pt-4 flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-white/5">
                            <span className="text-xs text-slate-500 italic">No custom fields added yet.</span>
                            <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">Manage</Button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                whileHover={{ y: -2 }}
                className="p-8 rounded-3xl glass-dark border border-white/5 shadow-2xl space-y-6"
            >
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-yellow-500" />
                    Field Settings
                </h3>
                <div className="space-y-4">
                    {[
                        { label: "Show HSN on Invoices", checked: true },
                        { label: "Enable Batch Tracking", checked: false },
                        { label: "Show Vehicle No. on Delivery Challan", checked: true }
                    ].map((pref, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                            <Label className="text-slate-300">{pref.label}</Label>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${pref.checked ? 'bg-blue-600' : 'bg-slate-800'}`}>
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${pref.checked ? 'left-6' : 'left-1'}`} />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
