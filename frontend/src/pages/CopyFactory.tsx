import { useTranslation } from "react-i18next";

export function CopyFactory() {
  const { t } = useTranslation();
  return <h2 className="text-2xl font-bold">{t("nav.copy_factory")}</h2>;
}
