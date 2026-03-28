import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import ContractorDashboard from "./pages/ContractorDashboard";
import AgencyDashboard from "./pages/AgencyDashboard";
import UmbrellaDashboard from "./pages/UmbrellaDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterAgency from "./pages/RegisterAgency";
import RegisterUmbrella from "./pages/RegisterUmbrella";
import RegisterContractor from "./pages/RegisterContractor";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/contractor"
          element={
            <ProtectedRoute roles={["CONTRACTOR"]}>
              <ContractorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agency"
          element={
            <ProtectedRoute roles={["ADMIN", "CONSULTANT"]}>
              <AgencyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/umbrella"
          element={
            <ProtectedRoute roles={["ADMIN", "PAYROLL_OPERATOR"]}>
              <UmbrellaDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/register/agency" element={<RegisterAgency />} />
        <Route path="/register/umbrella" element={<RegisterUmbrella />} />
        <Route path="/register/contractor" element={<RegisterContractor />} />
      </Routes>
    </AuthProvider>
  );
}
