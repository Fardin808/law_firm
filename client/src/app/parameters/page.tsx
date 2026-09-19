import { Suspense } from "react";
import ParametersClient from "./ParametersClient";

export default function ParametersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-sm font-medium text-slate-500">
            Loading parameters...
          </div>
        </div>
      }
    >
      <ParametersClient />
    </Suspense>
  );
}