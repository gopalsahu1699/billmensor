import { Suspense } from "react";
import CreateQuotationClient from "./CreateQuotationClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading quotation...</div>}>
      <CreateQuotationClient />
    </Suspense>
  );
}
