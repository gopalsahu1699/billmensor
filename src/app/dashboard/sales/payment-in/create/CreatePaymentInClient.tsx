"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, ChevronsUpDown, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

/* ================= Types ================= */
type Party = {
    id: string;
    name: string;
};

export default function CreatePaymentInClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [parties, setParties] = useState<Party[]>([]);

    // Form State
    const [date, setDate] = useState<Date>(new Date());
    const [selectedPartyId, setSelectedPartyId] = useState("");
    const [receiptNo, setReceiptNo] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [referenceNo, setReferenceNo] = useState("");
    const [remarks, setRemarks] = useState("");

    // Party Search State
    const [openParty, setOpenParty] = useState(false);

    /* ================= Fetch Parties & Receipt No ================= */
    useEffect(() => {
        const init = async () => {
            // 1. Fetch Parties
            const { data: partyData } = await supabase
                .from("parties")
                .select("id, name")
                .order("name");

            if (partyData) setParties(partyData);

            // 2. Generate Receipt No (Simple auto-increment logic or random for now)
            // In a real app, you might query the last receipt no and increment.
            // For now, let's use a timestamp-based fallback or simplified logic.
            const { count } = await supabase.from("payment_in").select("*", { count: 'exact', head: true });
            const nextNo = (count || 0) + 1;
            setReceiptNo(`REC-${String(nextNo).padStart(4, '0')}`);
        };

        init();
    }, []);

    /* ================= Handle Submit ================= */
    const handleSubmit = async () => {
        if (!selectedPartyId) {
            toast.error("Please select a party");
            return;
        }
        if (!amount || Number(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                payment_date: format(date, "yyyy-MM-dd"),
                party_id: selectedPartyId,
                receipt_no: receiptNo,
                amount: Number(amount),
                payment_mode: paymentMode,
                reference_no: referenceNo, // Optional
                remarks: remarks,         // Optional
            };

            const { error } = await supabase
                .from("payment_in")
                .insert(payload);

            if (error) throw error;

            toast.success("Payment saved successfully");
            router.push("/dashboard/sales/payment-in");
        } catch (err: any) {
            console.error("Error saving payment:", err);
            toast.error(err.message || "Failed to save payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
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
                    <h1 className="text-2xl font-semibold tracking-tight">Create Payment In</h1>
                    <p className="text-sm text-muted-foreground">
                        Record a payment received from a party
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Main Details */}
                <Card>
                    <CardContent className="p-6 space-y-4">

                        {/* Date */}
                        <div className="space-y-2">
                            <Label>Payment Date</Label>
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

                        {/* Receipt No */}
                        <div className="space-y-2">
                            <Label>Receipt No</Label>
                            <Input
                                value={receiptNo}
                                onChange={(e) => setReceiptNo(e.target.value)}
                                placeholder="REC-0001"
                            />
                        </div>

                        {/* Party Selection */}
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
                                <PopoverContent className="w-[300px] p-0">
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

                {/* Right Column: Payment Details */}
                <Card>
                    <CardContent className="p-6 space-y-4">
                        {/* Amount */}
                        <div className="space-y-2">
                            <Label>Received Amount (₹)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="text-lg font-semibold"
                            />
                        </div>

                        {/* Payment Mode */}
                        <div className="space-y-2">
                            <Label>Payment Mode</Label>
                            <Select value={paymentMode} onValueChange={setPaymentMode}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="Cheque">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reference No (Conditional based on mode usually, but kept simple) */}
                        {paymentMode !== "Cash" && (
                            <div className="space-y-2">
                                <Label>Reference No / Trans ID</Label>
                                <Input
                                    value={referenceNo}
                                    onChange={(e) => setReferenceNo(e.target.value)}
                                    placeholder="e.g. UPI Ref, Cheque No"
                                />
                            </div>
                        )}

                        {/* Remarks */}
                        <div className="space-y-2">
                            <Label>Remarks</Label>
                            <Textarea
                                placeholder="Any notes..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>

                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading} className="min-w-[120px]">
                    {loading ? "Saving..." : "Save Payment"}
                </Button>
            </div>
        </div>
    );
}
