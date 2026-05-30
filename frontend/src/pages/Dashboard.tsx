import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../components/Card";

interface Balance {
  image_credits: number;
  text_credits: number;
}

export function Dashboard() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<Balance | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetch("/api/usage/balance", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then(setBalance)
        .catch(() => {});
    }
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("nav.dashboard")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="font-semibold text-lg mb-2">{t("nav.image_factory")}</h3>
          <p className="text-3xl font-bold text-primary">
            {balance?.image_credits ?? "-"}
          </p>
          <p className="text-sm text-gray-500 mt-1">remaining generations</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-lg mb-2">{t("nav.copy_factory")}</h3>
          <p className="text-3xl font-bold text-primary">
            {balance?.text_credits ?? "-"}
          </p>
          <p className="text-sm text-gray-500 mt-1">remaining generations</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-lg mb-2">{t("nav.publish")}</h3>
          <p className="text-3xl font-bold text-primary">0</p>
          <p className="text-sm text-gray-500 mt-1">published</p>
        </Card>
      </div>
    </div>
  );
}
