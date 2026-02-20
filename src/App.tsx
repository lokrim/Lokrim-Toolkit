import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import Home from "@/pages/Home";
import { toolsConfig } from "@/toolsConfig";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          {/* Default to Home Dashboard */}
          <Route index element={<Home />} />

          {/* Dynamically generate routes for each tool */}
          {toolsConfig.map((tool) => {
            const Component = tool.component;
            return (
              <Route key={tool.id} path={tool.path.replace(/^\//, "")} element={<Component />} />
            );
          })}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
