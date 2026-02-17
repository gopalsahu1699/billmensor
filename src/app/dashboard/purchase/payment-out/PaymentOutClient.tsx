"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Filter, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type PaymentOut = {
    id: string;
    payment_no: string;
    payment_date: string;
    party_name: string;
    amount: number;
    payment_mode: string;
};

export default function PaymentOutClient() {
    const router = useRouter();
    const [payments, setPayments] = useState<PaymentOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("payment_out")
                .select(`
          id,
          payment_no,
          payment_date,
          amount,
          payment_mode,
          party:parties (
            name
          )
        `)
                .order("payment_date", { ascending: false });

            if (error) {
                console.warn("Error fetching payment out:", error.message);
            }

            const formatted =
                data?.map((p: any) => ({
                    id: p.id,
                    payment_no: p.payment_no,
                    payment_date: p.payment_date,
                    amount: p.amount,
                    payment_mode: p.payment_mode,
                    party_name: p.party?.name || "—",
                })) || [];

            setPayments(formatted);
            setLoading(false);
        };

        fetchPayments();
    }, []);

    const filtered = payments.filter(
        (p) =>
            p.payment_no?.toLowerCase().includes(search.toLowerCase()) ||
            p.party_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Payment Out</h1>
                <p className="text-sm text-muted-foreground">Home / Purchase / Payment Out</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search payment #, vendor..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Button
                    onClick={() => router.push("/dashboard/purchase/payment-out/create")}
                    className="ml-auto bg-sky-600 hover:bg-sky-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total  Payments</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{payments.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                        <span className="text-muted-foreground font-bold">₹</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{" "}
                            {payments
                                .reduce((sum, p) => sum + (p.amount || 0), 0)
                                .toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Date</TableHead>
                            <TableHead>Payment No</TableHead>
                            <TableHead>Vendor Name</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    Loading Payments...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No payments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium text-blue-600">{p.payment_no}</TableCell>
                                    <TableCell>{p.party_name}</TableCell>
                                    <TableCell className="capitalize">{p.payment_mode}</TableCell>
                                    <TableCell className="text-right font-medium text-red-600">
                                        ₹ {p.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">View</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
