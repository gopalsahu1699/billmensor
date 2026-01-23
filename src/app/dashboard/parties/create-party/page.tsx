import { Suspense } from "react";
import CreatePartyClient from "./CreatePartyClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading party...</div>}>
      <CreatePartyClient />
    </Suspense>
  );
}
