import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { toolsConfig } from "@/toolsConfig";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          {/* Default redirect to the first tool */}
          <Route index element={<Navigate to={toolsConfig[0].path} replace />} />

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
