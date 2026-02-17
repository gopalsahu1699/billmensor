import { Suspense } from "react";
import PurchaseBillsClient from "./PurchaseBillsClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading Purchase Bills...</div>}>
            <PurchaseBillsClient />
        </Suspense>
    );
}
