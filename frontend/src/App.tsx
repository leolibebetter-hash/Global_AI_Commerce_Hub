import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ImageFactory } from "./pages/ImageFactory";
import { CopyFactory } from "./pages/CopyFactory";
import { Publish } from "./pages/Publish";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="image-factory" element={<ImageFactory />} />
          <Route path="copy-factory" element={<CopyFactory />} />
          <Route path="publish" element={<Publish />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
