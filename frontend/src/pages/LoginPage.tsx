import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

type Mode = "login" | "register";

export function LoginPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (mode === "register" && password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      setLoading(true);

      try {
        const endpoint =
          mode === "login" ? "/api/auth/login" : "/api/auth/register";
        const body: Record<string, string> = { email, password };
        if (mode === "register") body.name = name;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `${mode === "login" ? "Login" : "Registration"} failed (${res.status})`);
        }

        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        localStorage.setItem("user_email", email);
        navigate("/", { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed");
      } finally {
        setLoading(false);
      }
    },
    [mode, email, password, confirmPassword, name, navigate],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-light px-4">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-1">
            Global AI Commerce Hub
          </h1>
          <p className="text-sm text-content/60">
            AI-Powered Cross-Border E-Commerce Platform
          </p>
        </div>

        <Card className="animate-slide-up">
          {/* Tabs */}
          <div className="flex border-b border-edge mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                mode === "login"
                  ? "border-primary text-primary"
                  : "border-transparent text-content/50 hover:text-content/70"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                mode === "register"
                  ? "border-primary text-primary"
                  : "border-transparent text-content/50 hover:text-content/70"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field (register only) */}
            {mode === "register" && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-content">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-edge bg-white px-4 py-2.5 text-sm text-content placeholder:text-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-content">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-edge bg-white px-4 py-2.5 text-sm text-content placeholder:text-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-content">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••"
                className="w-full rounded-lg border border-edge bg-white px-4 py-2.5 text-sm text-content placeholder:text-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Confirm password (register only) */}
            {mode === "register" && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-content">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••"
                  className="w-full rounded-lg border border-edge bg-white px-4 py-2.5 text-sm text-content placeholder:text-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading || !email || !password}
              type="submit"
              className="w-full"
            >
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {/* Language switcher */}
          <div className="mt-6 pt-4 border-t border-edge text-center">
            <button
              type="button"
              onClick={() =>
                i18n.changeLanguage(i18n.language === "zh" ? "en" : "zh")
              }
              className="text-xs text-content/50 hover:text-content/70 transition-colors"
            >
              {i18n.language === "zh" ? "Switch to English" : "切换到中文"}
            </button>
          </div>
        </Card>

        <p className="text-center text-xs text-content/40 mt-6">
          Global AI Commerce Hub v0.2.0
        </p>
      </div>
    </div>
  );
}
