"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, ArrowDownUp } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

type Category = {
  id: string;
  name: string;
  show_in_pos: boolean;
  show_in_store: boolean;
  created_at: string;
};

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCategories(data);
  };

  const filtered = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-muted-foreground">Home / Categories</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-between gap-2">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Category"
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

          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead>Show in POS Page</TableHead>
              <TableHead>Show in Store Page</TableHead>
              <TableHead>Added At</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-10"
                >
                  No data available in table
                </TableCell>
              </TableRow>
            )}

            {filtered.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">
                  {cat.name}
                </TableCell>
                <TableCell>
                  <Switch checked={cat.show_in_pos} />
                </TableCell>
                <TableCell>
                  <Switch checked={cat.show_in_store} />
                </TableCell>
                <TableCell>
                  {new Date(cat.created_at).toLocaleString()}
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
