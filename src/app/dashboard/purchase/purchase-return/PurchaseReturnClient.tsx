"use client";

import { useEffect, useState } from "react";
import { Search, Plus, RotateCcw } from "lucide-react";
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

type PurchaseReturn = {
    id: string;
    return_no: string;
    return_date: string;
    vendor_name: string;
    total_amount: number;
};

export default function PurchaseReturnClient() {
    const router = useRouter();
    const [returns, setReturns] = useState<PurchaseReturn[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchReturns = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("purchase_returns")
                .select(`
          id,
          return_no,
          return_date,
          total_amount,
          vendor:parties (
            name
          )
        `)
                .order("return_date", { ascending: false });

            if (error) {
                console.warn("Error fetching purchase returns:", error.message);
            }

            const formatted =
                data?.map((r: any) => ({
                    id: r.id,
                    return_no: r.return_no,
                    return_date: r.return_date,
                    total_amount: r.total_amount,
                    vendor_name: r.vendor?.name || "—",
                })) || [];

            setReturns(formatted);
            setLoading(false);
        };

        fetchReturns();
    }, []);

    const filtered = returns.filter(
        (r) =>
            r.return_no?.toLowerCase().includes(search.toLowerCase()) ||
            r.vendor_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Purchase Return</h1>
                <p className="text-sm text-muted-foreground">Home / Purchase / Purchase Return</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search return #, vendor..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Button
                    onClick={() => router.push("/dashboard/purchase/purchase-return/create")}
                    className="ml-auto bg-red-600 hover:bg-red-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Return
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{returns.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
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

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Date</TableHead>
                            <TableHead>Return No</TableHead>
                            <TableHead>Vendor Name</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Loading Returns...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No purchase returns found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell>{new Date(r.return_date).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium text-blue-600">{r.return_no}</TableCell>
                                    <TableCell>{r.vendor_name}</TableCell>
                                    <TableCell className="text-right font-medium">₹ {r.total_amount.toFixed(2)}</TableCell>
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
