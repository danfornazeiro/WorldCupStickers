import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center py-8">
      <AuthForm mode="register" />
    </div>
  );
}
