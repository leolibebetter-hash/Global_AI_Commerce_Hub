import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { ImageFactory } from "./pages/ImageFactory";
import { CopyFactory } from "./pages/CopyFactory";
import { Publish } from "./pages/Publish";
import { MarketResearch } from "./pages/MarketResearch";
import { MarketingHub } from "./pages/MarketingHub";
import { ProductPlanner } from "./pages/ProductPlanner";
import { Settings } from "./pages/Settings";
import { LoginPage } from "./pages/LoginPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="image-factory" element={<ImageFactory />} />
          <Route path="copy-factory" element={<CopyFactory />} />
          <Route path="publish" element={<Publish />} />
          <Route path="market-research" element={<MarketResearch />} />
          <Route path="marketing" element={<MarketingHub />} />
          <Route path="product-planner" element={<ProductPlanner />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
