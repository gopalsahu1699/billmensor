"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Label } from "@/components/ui/label";

import {
  Plus,
  Upload,
  Download,
  Eye,
  Pencil,
  Trash2,
  Search,
  ArrowDownUp,
} from "lucide-react";
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
import { Card } from "@/components/ui/card";

type Party = {
  id: string;
  name: string | null;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  party_type: "customer" | "supplier" | "retail";
  place_of_supply: string | null;
  opening_balance: number | null;
  credit_limit: number | null;
  created_at: string;
};


export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    const { data } = await supabase
      .from("parties")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setParties(data);
  };

 const searchLower = search.toLowerCase();

const filtered = parties.filter((p) =>
  (p.name || "").toLowerCase().includes(searchLower)
);
const handleDelete = async (id: string) => {
  const confirmDelete = confirm("Are you sure you want to delete this party?");
  if (!confirmDelete) return;

  const { error } = await supabase
    .from("parties")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Failed to delete party");
    console.error(error);
    return;
  }

  // Remove from UI instantly
  setParties((prev) => prev.filter((p) => p.id !== id));
};


  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Parties</h1>
        <p className="text-sm text-muted-foreground">Home / Parties</p>
      </div>

      {/* Top Actions */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Party"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <ArrowDownUp className="h-4 w-4 mr-2" />
            Sort Descending
          </Button>

          <Link href="/dashboard/parties/create-party">
  <Button className="bg-blue-600 hover:bg-blue-700">
    <Plus className="h-4 w-4 mr-2" />
    Create New Party
  </Button>
</Link>

          <Button variant="destructive">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>

          <Button variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Tabs */}
      <Card className="grid grid-cols-3 text-center">
        <div className="p-4 border-r">
          <p className="font-medium">All</p>
        </div>
        <div className="p-4 border-r">
          <p className="text-sm text-muted-foreground">To Collect</p>
          <p className="font-semibold">₹ 0</p>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">To Pay</p>
          <p className="font-semibold">₹ 0</p>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Party Type</TableHead>
              <TableHead>Place of Supply</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

        <TableBody>
  {filtered.map((party) => (
    <TableRow key={party.id}>
      <TableCell className="text-xs">
        {party.id.slice(0, 8)}
      </TableCell>

     <TableCell className="font-medium text-blue-600">
  {party.business_name || party.contact_name || party.name || "-"}
</TableCell>


      <TableCell>{party.email || "-"}</TableCell>

      <TableCell>{party.phone || "-"}</TableCell>

      <TableCell className="capitalize">
        {party.party_type}
      </TableCell>

      <TableCell>
        {party.place_of_supply || "-"}
      </TableCell>

      <TableCell>
        ₹ {party.opening_balance ?? 0}
      </TableCell>

      <TableCell>
        {new Date(party.created_at).toLocaleDateString()}
      </TableCell>

      <TableCell className="text-right space-x-2">
        <Button size="icon" variant="secondary">
          <Eye size={16} />
        </Button>

        <Link href={`/dashboard/parties/create-party?id=${party.id}`}>
          <Button size="icon" variant="outline">
            <Pencil size={16} />
          </Button>
        </Link>

        <Button
          size="icon"
          variant="destructive"
          onClick={() => handleDelete(party.id)}
        >
          <Trash2 size={16} />
        </Button>
      </TableCell>
    </TableRow>
  ))}
</TableBody>

        </Table>

        <div className="p-3 text-sm text-muted-foreground text-right">
          Total {filtered.length} records
        </div>
      </Card>
    </div>
  );
}
