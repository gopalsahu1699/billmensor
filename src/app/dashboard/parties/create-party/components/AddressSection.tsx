"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type AddressSectionProps = {
  title: string;
  address: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  onChange: (
    key: "address" | "city" | "state" | "pincode",
    value: string
  ) => void;
};

export default function AddressSection({
  title,
  address,
  onChange,
}: AddressSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">{title} Address</h3>

      <div>
        <Label>Address</Label>
        <Textarea
          rows={4}
          placeholder="House / Street / Area"
          value={address.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>City</Label>
          <Input
            value={address.city}
            onChange={(e) => onChange("city", e.target.value)}
          />
        </div>

        <div>
          <Label>State</Label>
          <Input
            value={address.state}
            onChange={(e) => onChange("state", e.target.value)}
          />
        </div>

        <div>
          <Label>Pincode</Label>
          <Input
            value={address.pincode}
            onChange={(e) => onChange("pincode", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
