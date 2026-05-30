import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const navItems = [
  { to: "/", label: "nav.dashboard", icon: "Home" },
  { to: "/image-factory", label: "nav.image_factory", icon: "Image" },
  { to: "/copy-factory", label: "nav.copy_factory", icon: "FileText" },
  { to: "/publish", label: "nav.publish", icon: "Send" },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-60 bg-white border-r border-edge
          transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 flex flex-col`}
      >
        <div className="p-6 border-b border-edge">
          <h1 className="text-lg font-bold text-primary">{t("app.title")}</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200
                ${isActive
                  ? "bg-primary text-primary-fg"
                  : "text-content hover:bg-primary-light"
                }`
              }
            >
              {item.icon === "Home" && <span>&#x1F3E0;</span>}
              {item.icon === "Image" && <span>&#x1F5BC;</span>}
              {item.icon === "FileText" && <span>&#x1F4C4;</span>}
              {item.icon === "Send" && <span>&#x1F4E4;</span>}
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-edge flex items-center justify-between px-6">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-primary-light"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <button
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-edge hover:bg-primary-light transition-colors"
              onClick={() => i18n.changeLanguage(i18n.language === "zh" ? "en" : "zh")}
            >
              {i18n.language === "zh" ? "EN" : "中文"}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
