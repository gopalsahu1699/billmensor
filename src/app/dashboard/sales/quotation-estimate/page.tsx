"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Pencil, Printer, Trash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams  } from "next/navigation";

/* ================= Types ================= */
type Quotation = {
  id: string;
  quotation_no: string;
  party_name: string;
  total_amount: number;
  quotation_date: string;
};

/* ================= Page ================= */
export default function QuotationEstimatePage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);


  const router = useRouter();
  const searchParams = useSearchParams();
const id = searchParams.get("id"); // will be null if creating

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

  const { error } = await supabase
    .from("quotations")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete quotation:", error.message);
    alert("Failed to delete quotation");
    return;
  }

  // Remove from local state
  setQuotations((prev) => prev.filter((q) => q.id !== id));
};

  /* ================= UI ================= */
  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Quotation</h1>
        <p className="text-sm text-gray-500">
          <span className="text-blue-600">Home</span> / Quotation
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search quotation"
            className="w-full border rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={() =>
            router.push(
              "/dashboard/sales/quotation-estimate/create-quotation"
            )
          }
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create New Quotation
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 border-b">Date</th>
              <th className="text-left px-4 py-3 border-b">Quotation No</th>
              <th className="text-left px-4 py-3 border-b">Party Name</th>
              <th className="text-right px-4 py-3 border-b">Amount</th>
              <th className="text-center px-4 py-3 border-b">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  Loading quotations...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              filtered.map((q) => (
                <tr key={q.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {new Date(q.quotation_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-blue-600 font-medium">
                    {q.quotation_no}
                  </td>
                  <td className="px-4 py-3">{q.party_name}</td>
                  <td className="px-4 py-3 text-right">
                    ₹ {q.total_amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      {/* View */}
                 <button
  onClick={() =>
    router.push(`/dashboard/sales/quotation-estimate/create-quotation?id=${q.id}`)
  }
  className="p-2 rounded-md border hover:bg-gray-100"
  title="Edit Quotation"
>
  <Pencil className="h-4 w-4" />
</button>


                      {/* Print */}
                      <button
                        onClick={() =>
                          window.open(
                            `/dashboard/sales/quotation-estimate/${q.id}/print`,
                            "_blank"
                          )
                        }
                        className="p-2 rounded-md border hover:bg-gray-100"
                        title="Print Quotation"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
  <button
  onClick={() => handleDelete(q.id)}
  className="p-2 rounded-md border hover:bg-gray-100"
  title="Delete Quotation"
>
  <Trash className="h-4 w-4" />
</button>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-end text-sm font-medium">
        Total {filtered.length} records
      </div>
    </div>
  );
}
