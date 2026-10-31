import { AuthGate } from "@/components/auth/auth-gate";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthGate>
      <RegisterForm />
    </AuthGate>
  );
}
