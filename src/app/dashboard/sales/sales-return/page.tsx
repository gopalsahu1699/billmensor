import { Suspense } from "react";
import SalesReturnClient from "./SalesReturnClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading Sales Return...</div>}>
            <SalesReturnClient />
        </Suspense>
    );
}
