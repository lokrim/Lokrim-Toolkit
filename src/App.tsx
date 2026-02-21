import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import Home from "@/pages/Home";
import { toolsConfig } from "@/toolsConfig";

/**
 * Main Application Router
 * 
 * Notice that we don't manually define routes for every single tool here.
 * Instead, we map over `toolsConfig.ts`, automatically creating a route for
 * any tool added to that array. This maximizes scalability.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          {/* Default to Home Dashboard */}
          <Route index element={<Home />} />

          {/* Dynamically generate routes for mapping over toolsConfig */}
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
