import { Suspense } from "react";
import DeliveryChallanClient from "./DeliveryChallanClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading delivery challan...</div>}>
      <DeliveryChallanClient />
    </Suspense>
  );
}
