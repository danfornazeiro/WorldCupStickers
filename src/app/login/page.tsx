import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center py-8">
      <AuthForm mode="login" />
    </div>
  );
}
