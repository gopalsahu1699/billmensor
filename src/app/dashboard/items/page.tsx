"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

import {
  Plus,
  Upload,
  Download,
  Printer,
  Eye,
  Pencil,
  Trash2,
  Filter,
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

type Item = {
  id: string;
  name: string;
  item_type: "product" | "service";

  hsn_sac?: string;
  barcode?: string;

  unit: string;
  gst_rate: number;

  stock_qty: number;
  sold_qty: number;

  purchase_price: number;
  selling_price: number;
  mrp: number;
  wholesale_price: number;

  image_url?: string;
};



export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchItems();
  }, []);

const fetchItems = async () => {
  const { data, error } = await supabase
    .from("items")
    .select(`
      id,
      name,
      item_type,
      hsn_sac,
      barcode,
      unit,
      gst_rate,
      stock_qty,
      sold_qty,
      purchase_price,
      selling_price,
      mrp,
      wholesale_price,
      image_url
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch error:", error);
    return;
  }

  setItems(data || []);
};


  const handleSort = () => {
    console.log("TODO: Sorting");
  };

  const handleCreate = () => {
    router.push("/dashboard/items/create");
  };

  const handleBulkUpload = () => {
    console.log("TODO: Bulk Upload");
  };

  const handleExport = () => {
    console.log("TODO: Export Items");
  };

  const handlePrint = () => {
    console.log("TODO: Print Barcode");
  };

  const handleView = (id: string) => {
    console.log("View item:", id);
  };

  const handleEdit = (id: string) => {
  router.push(`/dashboard/items/create?id=${id}`);
};


  const handleFilter = (id: string) => {
    console.log("Filter for item:", id);
  };

 const handleDelete = async (id: string) => {
  if (!confirm("Are you sure you want to delete this item?")) return;

  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  setItems((prev) => prev.filter((item) => item.id !== id));
};


  const filtered = items.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Items</h1>
        <p className="text-sm text-muted-foreground">Home / Items</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search item"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSort}>
            <ArrowDownUp className="h-4 w-4 mr-2" />
            Sort Descending
          </Button>

          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Item
          </Button>

          <Button variant="destructive" onClick={handleBulkUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>

          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Barcode
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-500 p-4 text-center">
          <p className="font-medium">Low Stock Items</p>
          <p className="text-sm">0 Items</p>
        </Card>

        <Card className="border-green-500 p-4 text-center">
          <p className="font-medium">Out-of-Stock Items</p>
          <p className="text-sm">0 Items</p>
        </Card>

        <Card className="border-blue-500 p-4 text-center">
          <p className="font-medium">Stock Sale Valuation</p>
          <p className="text-sm">₹ 10000</p>
        </Card>

        <Card className="border-cyan-500 p-4 text-center">
          <p className="font-medium">Stock Purchase Valuation</p>
          <p className="text-sm">₹ 8000</p>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
        <TableHeader>
  <TableRow>
    <TableHead>Image</TableHead>
    <TableHead>Name</TableHead>
    <TableHead>Type</TableHead>
    <TableHead>HSN / SAC</TableHead>
    <TableHead>Barcode</TableHead>
    <TableHead>Stock</TableHead>
    <TableHead>Stock Value</TableHead>
    <TableHead>Selling Price</TableHead>
    <TableHead>Purchase Price</TableHead>
    <TableHead>MRP / Wholesale</TableHead>
    <TableHead>Sold Qty</TableHead>
    <TableHead className="text-right">Action</TableHead>
  </TableRow>
</TableHeader>


          <TableBody>
            {filtered.map((item) => (
         <TableRow key={item.id}>
  <TableCell>
    {item.image_url ? (
      <img
        src={item.image_url}
        alt={item.name}
        className="h-12 w-12 rounded object-cover border"
      />
    ) : (
      <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-xs">
        No Image
      </div>
    )}
  </TableCell>

  <TableCell className="font-medium text-blue-600">
    {item.name}
  </TableCell>

  <TableCell className="capitalize">
    {item.item_type}
  </TableCell>

  <TableCell>{item.hsn_sac || "-"}</TableCell>
  <TableCell>{item.barcode || "-"}</TableCell>

  <TableCell>
    {item.stock_qty} {item.unit}
  </TableCell>

  <TableCell>
    ₹ {item.stock_qty * item.purchase_price}
  </TableCell>

  <TableCell>₹ {item.selling_price}</TableCell>
  <TableCell>₹ {item.purchase_price}</TableCell>

  <TableCell>
    ₹ {item.mrp} / ₹ {item.wholesale_price}
  </TableCell>

  <TableCell>{item.sold_qty}</TableCell>

  <TableCell className="text-right space-x-2">
    <Button size="icon" variant="secondary" onClick={() => handleView(item.id)}>
      <Eye size={16} />
    </Button>

    <Button size="icon" variant="outline" onClick={() => handleEdit(item.id)}>
      <Pencil size={16} />
    </Button>

    <Button size="icon" variant="outline">
      <Filter size={16} />
    </Button>

    <Button
      size="icon"
      variant="destructive"
      onClick={() => handleDelete(item.id)}
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
