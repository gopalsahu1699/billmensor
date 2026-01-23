import { Suspense } from "react";
import QuotationEstimateClient from "./QuotationEstimateClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading quotations...</div>}>
      <QuotationEstimateClient />
    </Suspense>
  );
}
