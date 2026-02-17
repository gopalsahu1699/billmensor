import { Suspense } from "react";
import CreateDeliveryChallanClient from "./Client";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading form...</div>}>
            <CreateDeliveryChallanClient />
        </Suspense>
    );
}
