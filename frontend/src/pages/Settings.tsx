import { useState, useEffect } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

export function Settings() {
  const [balance, setBalance] = useState<any>(null);
  const [profile, setProfile] = useState({ phone: "", role: "", created_at: "" });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const phone = localStorage.getItem("user_phone") || "";

    fetch("/api/usage/balance", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setBalance(d))
      .catch(() => {});

    fetch("/api/usage/summary", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setProfile({ phone, role: "seller", created_at: d.total_text > 0 ? "Active" : "New" }))
      .catch(() => {});
  }, []);

  const moduleLinks = [
    { name: "Dashboard", path: "/" },
    { name: "Market Research", path: "/market-research" },
    { name: "Product Planner", path: "/product-planner" },
    { name: "Copy Factory", path: "/copy-factory" },
    { name: "Image Factory", path: "/image-factory" },
    { name: "Marketing Hub", path: "/marketing" },
    { name: "Multi-Platform Publish", path: "/publish" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Settings</h1>
        <p className="text-sm text-content/50 mt-1">Account & system settings</p>
      </div>

      {/* Profile */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3">Account Profile</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-content/50">Phone:</span> <span className="font-medium">{profile.phone || "—"}</span></div>
          <div><span className="text-content/50">Role:</span> <span className="font-medium">{profile.role}</span></div>
          <div><span className="text-content/50">Status:</span> <span className="font-medium text-green-600">Active</span></div>
          <div><span className="text-content/50">Joined:</span> <span className="font-medium">{profile.created_at}</span></div>
        </div>
      </Card>

      {/* Credits */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3">AI Credits & Usage</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-purple-50 rounded-xl">
            <p className="text-sm text-content/60">Image Credits</p>
            <p className="text-3xl font-bold text-purple-600">{balance?.image_credits ?? 0}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-sm text-content/60">Text Credits</p>
            <p className="text-3xl font-bold text-green-600">{balance?.text_credits ?? 0}</p>
          </div>
        </div>
      </Card>

      {/* Quick Navigation */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3">Module Navigation</h3>
        <div className="grid grid-cols-2 gap-2">
          {moduleLinks.map((m) => (
            <a key={m.path} href={m.path}
              className="px-3 py-2 rounded-lg border border-edge hover:border-primary/50 hover:bg-primary-light/20 text-sm transition-colors">
              {m.name}
            </a>
          ))}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-5 border-red-200">
        <h3 className="font-semibold text-red-600 mb-3">Danger Zone</h3>
        <p className="text-sm text-content/60 mb-3">Logout will clear your session. All your data is preserved.</p>
        <Button variant="primary" onClick={() => {
          localStorage.clear();
          window.location.href = "/login";
        }}>
          Logout
        </Button>
      </Card>
    </div>
  );
}
