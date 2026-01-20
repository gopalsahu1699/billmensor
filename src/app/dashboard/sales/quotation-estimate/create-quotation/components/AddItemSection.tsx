"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Barcode, X } from "lucide-react";

type PriceType = "selling" | "mrp" | "wholesale";

interface DBItem {
  id: string;
  name: string;
  hsn_sac?: string | null;
  selling_price: number | null;
  mrp: number | null;
  wholesale_price: number | null;
  unit: string;
  stock_qty: number;
  gst_rate: number;
  image_url?: string;
}

interface InvoiceItem {
  id: string;
  item_id: string;
  name: string;
  hsn_sac?: string;
  unit: string;
  quantity: number;
  priceType: PriceType;
  prices: {
    selling: number;
    mrp: number;
    wholesale: number;
  };
  rate: number;
  total: number;
}

interface AddItemSectionProps {
  items: InvoiceItem[];
  subtotal: number;
  availableItems: DBItem[];
  searchTerm: string;
  showItemSearch: boolean;
  setSearchTerm: (v: string) => void;
  setShowItemSearch: (v: boolean) => void;
  addItem: (item: DBItem) => void;
  deleteItem: (id: string) => void;
  updateItemQuantity: (id: string, qty: number) => void;
  updateItemPriceType: (id: string, priceType: PriceType) => void;
}

export default function AddItemSection({
  items,
  subtotal,
  availableItems,
  searchTerm,
  showItemSearch,
  setSearchTerm,
  setShowItemSearch,
  addItem,
  deleteItem,
  updateItemQuantity,
  updateItemPriceType,
}: AddItemSectionProps) {
  return (
    <Card className="p-4">
      <h3 className="font-medium mb-3">Invoice Items</h3>

      <div className="flex justify-center gap-3 mb-6">
        <Button variant="outline" onClick={() => setShowItemSearch(true)}>
          Add Items
        </Button>
        <Button variant="outline" disabled>
          <Barcode className="h-4 w-4 mr-2" />
          Scan Barcode
        </Button>
      </div>

      {showItemSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between">
              <h3 className="font-medium">Select Item</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowItemSearch(false);
                  setSearchTerm("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 border-b">
              <Input
                placeholder="Search item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-2">
              {availableItems.map((item) => (
                <div
                  key={item.id}
                  className="border p-3 rounded cursor-pointer hover:bg-accent"
                  onClick={() => addItem(item)}
                >
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    HSN: {item.hsn_sac || "-"} | ₹{item.selling_price}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {items.length > 0 && (
        <table className="w-full border text-sm">
          <thead>
            <tr className="border-b">
              <th></th>
              <th>Item</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b">
                <td>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteItem(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </td>

                <td>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    HSN: {item.hsn_sac} | {item.unit}
                  </div>
                </td>

                <td className="text-right">
                  <Input
                    type="number"
                    value={item.quantity}
                    min={1}
                    onChange={(e) =>
                      updateItemQuantity(item.id, Math.max(1, +e.target.value))
                    }
                    className="w-20 text-right"
                  />
                </td>

                <td className="text-right space-y-1">
                  <select
                    value={item.priceType}
                    onChange={(e) =>
                      updateItemPriceType(item.id, e.target.value as PriceType)
                    }
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="selling">
                      Selling ₹{item.prices.selling}
                    </option>
                    <option value="mrp">MRP ₹{item.prices.mrp}</option>
                    <option value="wholesale">
                      Wholesale ₹{item.prices.wholesale}
                    </option>
                  </select>

                  <div className="font-mono">
                    ₹{item.rate.toFixed(2)}
                  </div>
                </td>

                <td className="text-right font-semibold">
                  ₹{item.total.toFixed(2)}
                </td>
              </tr>
            ))}

            <tr className="bg-muted/30 font-semibold">
              <td colSpan={4} className="text-right p-2">
                Subtotal
              </td>
              <td className="text-right p-2 text-lg">
                ₹{subtotal.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </Card>
  );
}
