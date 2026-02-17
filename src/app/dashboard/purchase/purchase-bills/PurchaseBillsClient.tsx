"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Filter, FileText } from "lucide-react";
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

/* ================= Types ================= */
type PurchaseBill = {
    id: string;
    bill_no: string;
    bill_date: string;
    vendor_name: string;
    total_amount: number;
    status: string;
};

export default function PurchaseBillsClient() {
    const router = useRouter();
    const [bills, setBills] = useState<PurchaseBill[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    /* ================= Fetch Data ================= */
    useEffect(() => {
        const fetchBills = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("purchase_bills")
                .select(`
          id,
          bill_no,
          bill_date,
          total_amount,
          status,
          vendor:parties (
            name
          )
        `)
                .order("bill_date", { ascending: false });

            if (error) {
                console.warn("Error fetching purchase bills:", error.message);
            }

            const formatted =
                data?.map((b: any) => ({
                    id: b.id,
                    bill_no: b.bill_no,
                    bill_date: b.bill_date,
                    total_amount: b.total_amount,
                    status: b.status,
                    vendor_name: b.vendor?.name || "—",
                })) || [];

            setBills(formatted);
            setLoading(false);
        };

        fetchBills();
    }, []);

    /* ================= Search ================= */
    const filtered = bills.filter(
        (b) =>
            b.bill_no?.toLowerCase().includes(search.toLowerCase()) ||
            b.vendor_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Purchase Bills</h1>
                <p className="text-sm text-muted-foreground">
                    Home / Purchase / Purchase Bills
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search bill #, vendor..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Button
                    onClick={() => router.push("/dashboard/purchase/purchase-bills/create")}
                    className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Purchase Bill
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Bills
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bills.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Purchase Value</CardTitle>
                        <span className="text-muted-foreground font-bold">₹</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{" "}
                            {bills
                                .reduce((sum, b) => sum + (b.total_amount || 0), 0)
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
                            <TableHead>Bill No</TableHead>
                            <TableHead>Vendor Name</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Loading Purchase Bills...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No purchase bills found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((b) => (
                                <TableRow key={b.id}>
                                    <TableCell>
                                        {new Date(b.bill_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="font-medium text-blue-600">
                                        {b.bill_no}
                                    </TableCell>
                                    <TableCell>{b.vendor_name}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        ₹ {b.total_amount.toFixed(2)}
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
