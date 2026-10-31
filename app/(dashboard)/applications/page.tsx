import { Suspense } from "react";

import { ApplicationsView } from "@/components/applications/applications-view";
import { PageSkeleton } from "@/components/shared/states";

export const metadata = { title: "Application Tracker" };

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ApplicationsView />
    </Suspense>
  );
}
