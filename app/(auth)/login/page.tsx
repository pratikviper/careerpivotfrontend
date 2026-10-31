import { Suspense } from "react";

import { AuthGate } from "@/components/auth/auth-gate";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthGate>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthGate>
  );
}
