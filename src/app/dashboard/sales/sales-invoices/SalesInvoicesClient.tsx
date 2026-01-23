"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { Search, Filter, ArrowDownUp, Plus, Pencil, Printer, Trash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Invoice = {
  id: string;
  invoice_no: string;
  invoice_date: string;
  total_amount: number;
  status: string;
  payment_status: string;
  party: {
    name: string;
  } | null;
};

export default function SalesInvoicesClient() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data, error } = await supabase
        .from("sales_invoices")
        .select(`
          id,
          invoice_no,
          invoice_date,
          total_amount,
          status,
          payment_status,
          party:parties (
            name
          )
        `)
        .order("invoice_date", { ascending: false });

      if (error) {
        console.error("Error fetching invoices:", error);
        setLoading(false);
        return;
      }

      // Normalize: party comes as an object (or null)
      const normalized =
        data?.map((row: any) => ({
          ...row,
          party: row.party ?? null,
        })) || [];

      setInvoices(normalized);
      setLoading(false);
    };

    fetchInvoices();
  }, []);

  // ================= Summary Calculations =================
  const totalSales = invoices.reduce(
    (sum, i) => sum + Number(i.total_amount || 0),
    0
  );

  const unpaidSales = invoices
    .filter((i) => i.payment_status !== "paid")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  const paidSales = invoices
    .filter((i) => i.payment_status === "paid")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);


const handleDelete = async (invoiceId: string) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this invoice?");
  if (!confirmDelete) return;

  try {
    const { error } = await supabase
      .from("sales_invoices")
      .delete()
      .eq("id", invoiceId);

    if (error) throw error;

    // Remove deleted invoice from state
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    alert("Invoice deleted successfully");
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Failed to delete invoice");
  }
};

  return (
    <div className="space-y-6">
      {/* ================= Header ================= */}
      <div>
        <h1 className="text-2xl font-semibold">Sales Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Home / Sales / Invoices
        </p>
      </div>

      {/* ================= Top Actions ================= */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoice no, party name..."
            className="pl-9"
          />
        </div>

        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filter
        </Button>

        <Button variant="outline">
          <ArrowDownUp className="h-4 w-4 mr-2" />
          Date (Newest)
        </Button>

        <Button
          className="ml-auto bg-blue-600 hover:bg-blue-700"
          onClick={() =>
            router.push("/dashboard/sales/sales-invoices/create-invoices")
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* ================= Summary ================= */}
      <Card className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Total Sales</p>
          <p className="text-xl font-semibold">₹ {totalSales.toFixed(2)}</p>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Unpaid</p>
          <p className="text-xl font-semibold text-red-600">
            ₹ {unpaidSales.toFixed(2)}
          </p>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-xl font-semibold text-green-600">
            ₹ {paidSales.toFixed(2)}
          </p>
        </div>
      </Card>

      {/* ================= Table ================= */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Invoice No</th>
              <th className="text-left px-4 py-3">Party Name</th>
              <th className="text-right px-4 py-3">Amount</th>
              <th className="text-right px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>

         <tbody>
  {loading ? (
    <tr>
      <td colSpan={6} className="text-center py-10 text-muted-foreground">
        Loading...
      </td>
    </tr>
  ) : invoices.length === 0 ? (
    <tr>
      <td colSpan={6} className="text-center py-10 text-muted-foreground">
        No invoices found
      </td>
    </tr>
  ) : (
    invoices.map((invoice) => (
      <tr key={invoice.id} className="border-t">
        <td className="px-4 py-3">{invoice.invoice_date}</td>
        <td className="px-4 py-3 font-medium">{invoice.invoice_no}</td>
        <td className="px-4 py-3">{invoice.party?.name || "-"}</td>
        <td className="px-4 py-3 text-right">
          ₹ {Number(invoice.total_amount).toFixed(2)}
        </td>
        <td className="px-4 py-3 text-right capitalize">{invoice.status}</td>
        <td className="px-4 py-3 text-right flex gap-2 justify-end">
          <button
            onClick={() =>
              router.push(`/dashboard/sales/sales-invoices/create-invoices?invoiceId=${invoice.id}`)
            }
             className="p-2 rounded-md border hover:bg-gray-100"
          >
           <Pencil className="h-4 w-4" />
          </button>
         <button
                        onClick={() =>
                          window.open(
                            `/dashboard/sales/sales-invoices/${invoice.id}/print`,
                            "_blank"
                          )
                        }
                        className="p-2 rounded-md border hover:bg-gray-100"
                        title="Print Quotation"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
          <button
            onClick={() => handleDelete(invoice.id)}
            className="p-2 rounded-md border hover:bg-gray-100"
          >
           <Trash className="h-4 w-4" />
          </button>
        </td>
      </tr>
    ))
  )}
</tbody>

        </table>
      </Card>

      {/* ================= Footer ================= */}
      <div className="text-sm text-muted-foreground text-right">
        Total {invoices.length} records
      </div>
    </div>
  );
}
