import { Suspense } from "react";
import DeliveryChallanClient from "./DeliveryChallanClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading Delivery Challan...</div>}>
            <DeliveryChallanClient />
        </Suspense>
    );
}
