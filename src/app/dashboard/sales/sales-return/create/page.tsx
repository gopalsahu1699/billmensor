import { Suspense } from "react";
import CreateSalesReturnClient from "./CreateSalesReturnClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading form...</div>}>
            <CreateSalesReturnClient />
        </Suspense>
    );
}
