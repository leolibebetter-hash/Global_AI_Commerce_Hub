import { useTranslation } from "react-i18next";

export function Publish() {
  const { t } = useTranslation();
  return <h2 className="text-2xl font-bold">{t("nav.publish")}</h2>;
}
