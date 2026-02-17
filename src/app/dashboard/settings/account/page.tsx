"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Shield, Smartphone, Globe, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AccountSettingsPage() {
    const [profile, setProfile] = useState({
        fullName: "John Doe",
        username: "johndoe_01",
        phone: "+91 99999 99999",
        language: "English (US)"
    });

    const handleUpdate = () => {
        toast.success("Profile updated successfully!");
    };

    const handleDelete = () => {
        toast.error("Account deletion requested.");
    };

    const handleUpload = () => {
        toast.info("Opening file uploader...");
    };

    const handleConnect = (service: string) => {
        toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Connecting to ${service}...`,
            success: `${service} connected!`,
            error: `Failed to connect to ${service}`
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
                <p className="text-muted-foreground mt-1 font-medium">Manage your personal profile and account security</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Profile Info */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="p-8 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                            <User className="w-5 h-5 text-blue-500" />
                            Profile Information
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground ml-1">Full Name</Label>
                                    <Input
                                        value={profile.fullName}
                                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                        placeholder="John Doe"
                                        className="h-12 bg-background border-border rounded-xl text-foreground focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground ml-1">Username</Label>
                                    <Input
                                        value={profile.username}
                                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                        placeholder="johndoe_01"
                                        className="h-12 bg-background border-border rounded-xl text-foreground focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-muted-foreground ml-1">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input readOnly value="demo@billmensor.com" className="pl-10 h-12 bg-muted/50 border-border rounded-xl text-muted-foreground cursor-not-allowed" />
                                </div>
                                <p className="text-xs text-muted-foreground/60 ml-1">Email cannot be changed after verification.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground ml-1">Phone Number</Label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            value={profile.phone}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            placeholder="+91 99999 99999"
                                            className="pl-10 h-12 bg-background border-border rounded-xl text-foreground focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground ml-1">Language</Label>
                                    <Input
                                        value={profile.language}
                                        onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                                        placeholder="English (US)"
                                        className="h-12 bg-background border-border rounded-xl text-foreground focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-10 h-12 shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                                Update Profile
                            </Button>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -2 }}
                        className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10 shadow-xl"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-500">
                            <Shield className="w-5 h-5" />
                            Danger Zone
                        </h2>
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/10 flex items-center justify-between gap-4">
                            <div>
                                <p className="font-semibold text-red-600 dark:text-red-400">Deactivate Account</p>
                                <p className="text-sm text-red-600/60 dark:text-red-400/50">This action is irreversible and will delete all your data.</p>
                            </div>
                            <Button onClick={handleDelete} variant="destructive" className="rounded-xl px-6">
                                Delete Account
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* Right: Profile Picture */}
                <div className="space-y-6">
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="p-8 rounded-3xl bg-card border border-border shadow-2xl flex flex-col items-center text-center"
                    >
                        <div className="relative group cursor-pointer mb-6" onClick={handleUpload}>
                            <div className="w-32 h-32 rounded-full p-1 bg-linear-to-br from-blue-500 to-purple-500">
                                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-card">
                                    <User className="w-16 h-16 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Your Profile Picture</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-6">Recommended size: 400x400px</p>
                        <Button variant="outline" onClick={handleUpload} className="w-full border-border bg-background hover:bg-muted text-foreground rounded-xl h-11">
                            Upload New Photo
                        </Button>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -2 }}
                        className="p-6 rounded-3xl bg-card border border-border shadow-2xl"
                    >
                        <h4 className="font-bold mb-4 flex items-center gap-2 text-foreground">
                            <Globe className="w-4 h-4 text-sky-500" />
                            Connected Socials
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                                <span className="text-sm font-medium text-foreground">Google</span>
                                <span className="text-xs text-green-600 dark:text-green-400 font-semibold px-2 py-1 rounded-lg bg-green-500/10">Linked</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                                <span className="text-sm font-medium text-foreground">WhatsApp</span>
                                <Button onClick={() => handleConnect("WhatsApp")} size="sm" variant="ghost" className="h-7 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">Connect</Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
