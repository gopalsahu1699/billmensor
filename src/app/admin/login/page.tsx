"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MdPerson, MdLock, MdArrowForward } from "react-icons/md";

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/admin/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (data.valid) {
                sessionStorage.setItem("admin_auth", "true");
                sessionStorage.setItem("admin_user", username);
                sessionStorage.setItem("admin_pass", password);
                toast.success("Welcome, Admin!");
                router.replace("/admin/dashboard");
            } else {
                toast.error("Invalid credentials");
            }
        } catch {
            toast.error("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-slate-800 bg-slate-950">
                <CardHeader className="text-center space-y-3 pt-8">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-blue-600/20 flex items-center justify-center">
                        <MdPerson className="w-10 h-10 text-blue-400" />
                    </div>
                    <CardTitle className="text-white text-2xl font-bold">Billmensor Admin</CardTitle>
                    <CardDescription className="text-slate-400">
                        Enter admin credentials to access the panel
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Username
                            </label>
                            <div className="relative">
                                <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <Input
                                    type="text"
                                    placeholder="Enter admin username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 pl-10"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <Input
                                    type="password"
                                    placeholder="Enter admin password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 pl-10"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-11"
                        >
                            {loading ? "Verifying..." : (
                                <>
                                    Login
                                    <MdArrowForward className="ml-2 w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
