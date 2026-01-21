"use client";

import { useRouter } from "next/navigation";
import { Search, Filter, ArrowDownUp, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SalesInvoicesPage() {
  const router = useRouter();

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
          <p className="text-xl font-semibold">₹ 0.00</p>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Unpaid</p>
          <p className="text-xl font-semibold text-red-600">₹ 0.00</p>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-xl font-semibold text-green-600">₹ 0.00</p>
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
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                colSpan={5}
                className="text-center py-10 text-muted-foreground"
              >
                No invoices found
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      {/* ================= Footer ================= */}
      <div className="text-sm text-muted-foreground text-right">
        Total 0 records
      </div>
    </div>
  );
}
