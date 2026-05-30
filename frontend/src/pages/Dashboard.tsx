import { useTranslation } from "react-i18next";
import { Card } from "../components/Card";

export function Dashboard() {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("nav.dashboard")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="font-semibold text-lg mb-2">{t("nav.image_factory")}</h3>
          <p className="text-sm text-gray-500">0 images generated</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-lg mb-2">{t("nav.copy_factory")}</h3>
          <p className="text-sm text-gray-500">0 listings created</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-lg mb-2">{t("nav.publish")}</h3>
          <p className="text-sm text-gray-500">0 published</p>
        </Card>
      </div>
    </div>
  );
}
