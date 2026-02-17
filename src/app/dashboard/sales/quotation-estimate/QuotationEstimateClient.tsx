"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Pencil, Printer, Trash, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

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
type Quotation = {
  id: string;
  quotation_no: string;
  party_name: string;
  total_amount: number;
  quotation_date: string;
};

/* ================= Page ================= */
export default function QuotationEstimateClient() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  /* ================= Fetch Quotations ================= */
  const fetchQuotations = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("quotations")
      .select(`
        id,
        quotation_no,
        quotation_date,
        total_amount,
        parties (
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error.message);
      toast.error("Failed to load quotations");
      setLoading(false);
      return;
    }

    const formatted: Quotation[] =
      data?.map((q: any) => ({
        id: q.id,
        quotation_no: q.quotation_no,
        quotation_date: q.quotation_date,
        total_amount: q.total_amount,
        party_name: q.parties?.name || "—",
      })) || [];

    setQuotations(formatted);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  /* ================= Search ================= */
  const filtered = quotations.filter(
    (q) =>
      q.quotation_no?.toLowerCase().includes(search.toLowerCase()) ||
      q.party_name?.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= Delete Quotation ================= */
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;

    const { error } = await supabase.from("quotations").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete quotation:", error.message);
      toast.error("Failed to delete quotation");
      return;
    }

    // Remove from local state
    setQuotations((prev) => prev.filter((q) => q.id !== id));
    toast.success("Quotation deleted successfully");
  };

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quotations</h1>
        <p className="text-sm text-muted-foreground">
          Home / Sales / Quotations
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotation..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button
          onClick={() =>
            router.push("/dashboard/sales/quotation-estimate/create-quotation")
          }
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Quotation
        </Button>
      </div>

      {/* Summary Cards (Optional - calculated from client state) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Quotations
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotations.length}</div>
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
              {quotations
                .reduce((sum, q) => sum + (q.total_amount || 0), 0)
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
              <TableHead>Quotation No</TableHead>
              <TableHead>Party Name</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  Loading quotations...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No quotations found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    {new Date(q.quotation_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium text-blue-600">
                    {q.quotation_no}
                  </TableCell>
                  <TableCell>{q.party_name}</TableCell>
                  <TableCell className="text-right font-medium">
                    ₹ {q.total_amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(
                            `/dashboard/sales/quotation-estimate/create-quotation?id=${q.id}`
                          )
                        }
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          window.open(
                            `/dashboard/sales/quotation-estimate/${q.id}/print`,
                            "_blank"
                          )
                        }
                        title="Print"
                      >
                        <Printer className="h-4 w-4 text-muted-foreground" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/dashboard/sales/sales-invoices/create-invoices?quotation_id=${q.id}`
                          )
                        }
                        title="Convert to Invoice"
                        className="hidden md:inline-flex text-xs h-8"
                      >
                        Convert to Invoice
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(q.id)}
                        title="Delete"
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer */}
        <div className="bg-muted/20 p-4 border-t text-xs text-muted-foreground text-right">
          Showing {filtered.length} records
        </div>
      </Card>
    </div>
  );
}
