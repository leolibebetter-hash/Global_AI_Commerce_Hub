import { useTranslation } from "react-i18next";

export function ImageFactory() {
  const { t } = useTranslation();
  return <h2 className="text-2xl font-bold">{t("nav.image_factory")}</h2>;
}
