import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import { App as Layout } from "./components/layout/App";
import { LoginPage } from "./pages/LoginPage";
import { PolicyCreatePage } from "./pages/PolicyCreatePage";
import { PolicyDetailPage } from "./pages/PolicyDetailPage";
import { PolicyEditPage } from "./pages/PolicyEditPage";
import { PolicyListPage } from "./pages/PolicyListPage";
import { PolicyTypesPage } from "./pages/PolicyTypesPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Navigate to="/policies" replace />} />
          <Route path="/policies" element={<PolicyListPage />} />
          <Route path="/policies/new" element={<PolicyCreatePage />} />
          <Route path="/policies/:id" element={<PolicyDetailPage />} />
          <Route path="/policies/:id/edit" element={<PolicyEditPage />} />
          <Route path="/policy-types" element={<PolicyTypesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/policies" replace />} />
      </Routes>
    </AuthProvider>
  );
}
