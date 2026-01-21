"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

import Link from "next/link";

export type Party = {
  id: string;
  name: string;
  business_name?: string;
  phone?: string;
  gstin?: string;
  party_type?: "customer" | "supplier" | "retail";
};

export default function PartyDetails({
  selectedParty,
  setSelectedParty,
  showPartyModal,
  setShowPartyModal,
  partySearch,
  setPartySearch,
  availableParties,
}: {
  selectedParty: Party | null;
  setSelectedParty: (p: Party | null) => void;
  showPartyModal: boolean;
  setShowPartyModal: (v: boolean) => void;
  partySearch: string;
  setPartySearch: (v: string) => void;
  availableParties: Party[];
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);


  /* ---------------- CREATE PARTY ---------------- */

  /* ---------------- UI ---------------- */
  return (
    <>
      {/* PARTY CARD */}
      <Card
        onClick={() => setShowPartyModal(true)}
        className="p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 transition"
      >
        {!selectedParty ? (
          <>
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-green-600 font-medium">Choose Party</p>
          </>
        ) : (
          <div className="w-full text-left space-y-2">
            <div className="font-semibold">{selectedParty.name}</div>

            {selectedParty.phone && (
              <div className="text-sm">{selectedParty.phone}</div>
            )}

            {selectedParty.gstin && (
              <div className="text-xs bg-blue-50 px-2 py-1 rounded">
                GST: {selectedParty.gstin}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedParty(null);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Change Party
            </Button>
          </div>
        )}
      </Card>

      {/* PARTY MODAL */}
      {showPartyModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPartyModal(false)}
        >
          <Card
            className="w-full max-w-md max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-semibold">Choose Party</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPartyModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

           {/* Inline create party form disabled – redirecting to Parties page */}
{!showCreateForm && (
  <>
    <div className="p-4">
      <Input
        placeholder="Search by name, phone, GSTIN..."
        value={partySearch}
        onChange={(e) => setPartySearch(e.target.value)}
        autoFocus
      />
    </div>

    <div className="flex-1 overflow-auto p-4 space-y-2">
      {availableParties.map((party) => (
        <Button
          key={party.id}
          variant="ghost"
          className="justify-start h-auto py-3 text-left w-full"
          onClick={() => {
            setSelectedParty(party);
            setShowPartyModal(false);
            setPartySearch("");
          }}
        >
          <div className="space-y-1">
            <div className="font-medium">{party.name}</div>
            <div className="text-xs text-muted-foreground">
              {party.phone}
              {party.gstin && ` | GST: ${party.gstin}`}
            </div>
          </div>
        </Button>
      ))}
    </div>

    <div className="p-4 border-t">
      <Link
        href="/dashboard/parties/create-party"
        className="w-full"
        onClick={() => {
          setShowPartyModal(false);
          setPartySearch("");
        }}
      >
        <Button variant="outline" className="w-full">
          + Create New Party
        </Button>
      </Link>
    </div>
  </>
)}

          </Card>
        </div>
      )}
    </>
  );
}
