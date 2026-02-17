"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Filter, Wallet } from "lucide-react";
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
import { toast } from "sonner";

/* ================= Types ================= */
type PaymentIn = {
    id: string;
    receipt_no: string;
    payment_date: string;
    party_name: string;
    amount: number;
    payment_mode: string;
    reference_no?: string;
};

/* ================= Component ================= */
export default function PaymentInClient() {
    const router = useRouter();
    const [payments, setPayments] = useState<PaymentIn[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    /* ================= Fetch Data ================= */
    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true);

            // Attempt to fetch from 'payment_in' table
            const { data, error } = await supabase
                .from("payment_in")
                .select(`
          id,
          receipt_no,
          payment_date,
          amount,
          payment_mode,
          reference_no,
          party:parties (
            name
          )
        `)
                .order("payment_date", { ascending: false });

            if (error) {
                console.warn("Error fetching payments (table might be missing):", error.message);
            }

            const formatted =
                data?.map((p: any) => ({
                    id: p.id,
                    receipt_no: p.receipt_no,
                    payment_date: p.payment_date,
                    amount: p.amount,
                    payment_mode: p.payment_mode,
                    reference_no: p.reference_no,
                    party_name: p.party?.name || "—",
                })) || [];

            setPayments(formatted);
            setLoading(false);
        };

        fetchPayments();
    }, []);

    /* ================= Search ================= */
    const filtered = payments.filter(
        (p) =>
            p.receipt_no?.toLowerCase().includes(search.toLowerCase()) ||
            p.party_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Payment In</h1>
                <p className="text-sm text-muted-foreground">
                    Home / Sales / Payment In
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search receipt #, party..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Button
                    onClick={() => router.push("/dashboard/sales/payment-in/create")}
                    className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Payment In
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Receipts
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{payments.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Received</CardTitle>
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

            {/* Table */}
            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Date</TableHead>
                            <TableHead>Receipt No</TableHead>
                            <TableHead>Party Name</TableHead>
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
                                    <TableCell>
                                        {new Date(p.payment_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="font-medium text-blue-600">
                                        {p.receipt_no}
                                    </TableCell>
                                    <TableCell>{p.party_name}</TableCell>
                                    <TableCell className="capitalize">{p.payment_mode}</TableCell>
                                    <TableCell className="text-right font-medium text-green-600">
                                        ₹ {p.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <div className="bg-muted/20 p-4 border-t text-xs text-muted-foreground text-right">
                    Showing {filtered.length} records
                </div>
            </Card>
        </div>
    );
}
