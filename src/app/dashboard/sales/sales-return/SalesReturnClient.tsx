"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Filter, Database } from "lucide-react";
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
type SalesReturn = {
    id: string;
    return_no: string;
    return_date: string;
    party_name: string;
    total_amount: number;
    reason?: string;
};

/* ================= Component ================= */
export default function SalesReturnClient() {
    const router = useRouter();
    const [returns, setReturns] = useState<SalesReturn[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    /* ================= Fetch Data ================= */
    useEffect(() => {
        const fetchReturns = async () => {
            setLoading(true);
            // Assuming table name is 'sales_returns'. If not, this will error but UI will handle it gracefully.
            const { data, error } = await supabase
                .from("sales_returns")
                .select(`
          id,
          return_no,
          return_date,
          total_amount,
          party:parties (
            name
          )
        `)
                .order("created_at", { ascending: false });

            if (error) {
                console.warn("Error fetching sales returns (table might not exist yet):", error.message);
                // Don't show error toast on load if it's just missing table, 
                // effectively showing empty state is better for now unless user is debugging.
                // toast.error("Could not load sales returns"); 
            }

            const formatted =
                data?.map((r: any) => ({
                    id: r.id,
                    return_no: r.return_no,
                    return_date: r.return_date,
                    total_amount: r.total_amount,
                    party_name: r.party?.name || "—",
                })) || [];

            setReturns(formatted);
            setLoading(false);
        };

        fetchReturns();
    }, []);

    /* ================= Search ================= */
    const filtered = returns.filter(
        (r) =>
            r.return_no?.toLowerCase().includes(search.toLowerCase()) ||
            r.party_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Sales Return</h1>
                <p className="text-sm text-muted-foreground">
                    Home / Sales / Sales Return
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search return #, party..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Button
                    onClick={() => router.push("/dashboard/sales/sales-return/create")}
                    className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Sales Return
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Returns
                        </CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{returns.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Refund Value</CardTitle>
                        <span className="text-muted-foreground font-bold">₹</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{" "}
                            {returns
                                .reduce((sum, r) => sum + (r.total_amount || 0), 0)
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
                            <TableHead>Return No</TableHead>
                            <TableHead>Party Name</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Loading Sales Returns...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No sales returns found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell>
                                        {new Date(r.return_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="font-medium text-blue-600">
                                        {r.return_no}
                                    </TableCell>
                                    <TableCell>{r.party_name}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        ₹ {r.total_amount.toFixed(2)}
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
