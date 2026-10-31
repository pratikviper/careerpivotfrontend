import { DashboardShell } from "@/components/layout/dashboard-shell";

// Every page in this group sits behind a client-side sign-in (the token lives in localStorage), so Next cannot render
// them into a static shell and its "instant navigation" dev check cannot see them. Opt the whole group out of that
// development-only validation. It does not change what users see. See the `instant` route segment config in the Next docs.
export const instant = false;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
