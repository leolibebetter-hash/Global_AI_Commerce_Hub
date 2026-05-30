import { useTranslation } from "react-i18next";

function App() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("app.title")}
        </h1>
        <p className="mt-4 text-gray-600">{t("app.welcome")}</p>
        <button
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() =>
            i18n.changeLanguage(i18n.language === "zh" ? "en" : "zh")
          }
        >
          {t("app.switch_lang")}
        </button>
      </div>
    </div>
  );
}

export default App;
