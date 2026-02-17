"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, ChevronsUpDown, ArrowLeft, Plus, Trash, Search } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

/* ================= Types ================= */
type Party = {
    id: string;
    name: string;
};

type Item = {
    id: string;
    name: string;
    stock_qty: number;
    unit: string;
};

type ChallanItem = {
    id: string; // local UI id
    item_id: string;
    item_name: string;
    quantity: number;
    unit: string;
    description: string;
};

export default function CreateDeliveryChallanClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Data State
    const [parties, setParties] = useState<Party[]>([]);
    const [items, setItems] = useState<Item[]>([]);

    // Form State
    const [date, setDate] = useState<Date>(new Date());
    const [selectedPartyId, setSelectedPartyId] = useState("");
    const [challanNo, setChallanNo] = useState("");
    const [remarks, setRemarks] = useState("");

    // Items State
    const [challanItems, setChallanItems] = useState<ChallanItem[]>([]);
    const [itemSearch, setItemSearch] = useState("");
    const [isItemSearchOpen, setIsItemSearchOpen] = useState(false);

    // Party Search State
    const [openParty, setOpenParty] = useState(false);

    /* ================= Fetch Data ================= */
    useEffect(() => {
        const init = async () => {
            // 1. Fetch Parties
            const { data: partyData } = await supabase
                .from("parties")
                .select("id, name")
                .order("name");
            if (partyData) setParties(partyData);

            // 2. Fetch Items
            const { data: itemData } = await supabase
                .from("items")
                .select("id, name, stock_qty, unit")
                .order("name");
            if (itemData) setItems(itemData);

            // 3. Generate Challan No
            const { count } = await supabase.from("delivery_challans").select("*", { count: 'exact', head: true });
            const nextNo = (count || 0) + 1;
            setChallanNo(`DC-${String(nextNo).padStart(4, '0')}`);
        };

        init();
    }, []);

    /* ================= Item Handlers ================= */
    const addItem = (item: Item) => {
        const newItem: ChallanItem = {
            id: crypto.randomUUID(),
            item_id: item.id,
            item_name: item.name,
            quantity: 1,
            unit: item.unit || "PCS",
            description: "",
        };
        setChallanItems([...challanItems, newItem]);
        setIsItemSearchOpen(false);
        setItemSearch("");
    };

    const updateItem = (id: string, field: keyof ChallanItem, value: any) => {
        setChallanItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const removeItem = (id: string) => {
        setChallanItems(prev => prev.filter(item => item.id !== id));
    };

    /* ================= Submit ================= */
    const handleSubmit = async () => {
        if (!selectedPartyId) {
            toast.error("Please select a party");
            return;
        }
        if (challanItems.length === 0) {
            toast.error("Please add at least one item");
            return;
        }

        setLoading(true);

        try {
            // 1. Create Challan
            const { data: challan, error: challanError } = await supabase
                .from("delivery_challans")
                .insert({
                    challan_date: format(date, "yyyy-MM-dd"),
                    party_id: selectedPartyId,
                    challan_no: challanNo,
                    remarks: remarks,
                    status: 'Pending'
                })
                .select()
                .single();

            if (challanError) throw challanError;

            // 2. Create Challan Items
            const itemsToInsert = challanItems.map(item => ({
                delivery_challan_id: challan.id,
                item_id: item.item_id,
                item_name: item.item_name,
                quantity: item.quantity,
                unit: item.unit,
                description: item.description
            }));

            const { error: itemsError } = await supabase
                .from("delivery_challan_items")
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            toast.success("Delivery Challan created successfully");
            router.push("/dashboard/sales/delivery-challan");
        } catch (err: any) {
            console.error("Error creating DC:", err);
            toast.error(err.message || "Failed to create Delivery Challan");
        } finally {
            setLoading(false);
        }
    };

    // Filter items for search
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Create Delivery Challan</h1>
                    <p className="text-sm text-muted-foreground">
                        Create a new delivery note for goods
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Party & Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Party Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 flex flex-col">
                                <Label>Party Name</Label>
                                <Popover open={openParty} onOpenChange={setOpenParty}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openParty}
                                            className="w-full justify-between"
                                        >
                                            {selectedPartyId
                                                ? parties.find((party) => party.id === selectedPartyId)?.name
                                                : "Select party..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search party..." />
                                            <CommandList>
                                                <CommandEmpty>No party found.</CommandEmpty>
                                                <CommandGroup>
                                                    {parties.map((party) => (
                                                        <CommandItem
                                                            key={party.id}
                                                            value={party.name}
                                                            onSelect={() => {
                                                                setSelectedPartyId(party.id);
                                                                setOpenParty(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedPartyId === party.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {party.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Items</CardTitle>
                            <Popover open={isItemSearchOpen} onOpenChange={setIsItemSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Item
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="end">
                                    <Command>
                                        <CommandInput placeholder="Search items..." value={itemSearch} onValueChange={setItemSearch} />
                                        <CommandList>
                                            <CommandEmpty>No item found.</CommandEmpty>
                                            <CommandGroup>
                                                {filteredItems.slice(0, 10).map((item) => (
                                                    <CommandItem
                                                        key={item.id}
                                                        value={item.name}
                                                        onSelect={() => addItem(item)}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span>{item.name}</span>
                                                            <span className="text-xs text-muted-foreground">Qty: {item.stock_qty} {item.unit}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40%]">Item</TableHead>
                                        <TableHead className="w-[20%]">Qty</TableHead>
                                        <TableHead className="w-[30%]">Description</TableHead>
                                        <TableHead className="w-[10%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {challanItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                No items added. Add items to create challan.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        challanItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    {item.item_name}
                                                    <div className="text-xs text-muted-foreground">{item.unit}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                                        className="h-8 w-20"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={item.description}
                                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                        placeholder="Optional notes"
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeItem(item.id)}
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Meta Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Challan Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Date */}
                            <div className="space-y-2">
                                <Label>Challan Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <CalendarComponent
                                            mode="single"
                                            selected={date}
                                            onSelect={(d) => d && setDate(d)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Challan No */}
                            <div className="space-y-2">
                                <Label>Challan No</Label>
                                <Input
                                    value={challanNo}
                                    onChange={(e) => setChallanNo(e.target.value)}
                                />
                            </div>

                            {/* Remarks */}
                            <div className="space-y-2">
                                <Label>Remarks</Label>
                                <Textarea
                                    placeholder="Additional notes..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="min-h-[100px]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
                        {loading ? "Creating..." : "Create Challan"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
