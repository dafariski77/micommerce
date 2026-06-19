import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuthStore } from "../store/authStore";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@micommerce/shared-ui/react/Button";
import { Card } from "@micommerce/shared-ui/react/Card";
import { Input } from "@micommerce/shared-ui/react/Input";

const API_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : "http://localhost:8080";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to login");
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      if (data.user.role === "merchant") {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/" });
      }
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <Card className="max-w-md mx-auto mt-12">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
        Login to MiCommerce
      </h2>
      {loginMutation.error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm">
          {loginMutation.error.message}
        </div>
      )}
      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-primary-600 font-medium hover:underline"
        >
          Register here
        </Link>
      </p>
    </Card>
  );
}
