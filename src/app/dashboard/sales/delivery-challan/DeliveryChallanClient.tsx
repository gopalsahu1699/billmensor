"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Filter, Truck } from "lucide-react";
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
type DeliveryChallan = {
  id: string;
  challan_no: string;
  challan_date: string;
  party_name: string;
  total_amount?: number; // Optional as DC sometimes doesn't have amount
  status?: string;
};

/* ================= Component ================= */
export default function DeliveryChallanClient() {
  const router = useRouter();
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* ================= Fetch Data ================= */
  useEffect(() => {
    const fetchChallans = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("delivery_challans")
        .select(`
          id,
          challan_no,
          challan_date,
          status,
          party:parties (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Error fetching delivery challans:", error.message);
        // data might be null if table missing
      }

      const formatted =
        data?.map((d: any) => ({
          id: d.id,
          challan_no: d.challan_no,
          challan_date: d.challan_date,
          status: d.status,
          party_name: d.party?.name || "—",
        })) || [];

      setChallans(formatted);
      setLoading(false);
    };

    fetchChallans();
  }, []);

  /* ================= Search ================= */
  const filtered = challans.filter(
    (c) =>
      c.challan_no?.toLowerCase().includes(search.toLowerCase()) ||
      c.party_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Delivery Challan</h1>
        <p className="text-sm text-muted-foreground">
          Home / Sales / Delivery Challan
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search challan #, party..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button
          onClick={() => router.push("/dashboard/sales/delivery-challan/create")}
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Delivery Challan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Challans
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{challans.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Challan No</TableHead>
              <TableHead>Party Name</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Loading Delivery Challans...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No delivery challans found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {new Date(c.challan_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium text-blue-600">
                    {c.challan_no}
                  </TableCell>
                  <TableCell>{c.party_name}</TableCell>
                  <TableCell className="text-right capitalize">
                    {c.status || "-"}
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
