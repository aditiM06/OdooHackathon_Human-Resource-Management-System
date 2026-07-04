import { Navigate, Outlet } from "react-router";

import {
  getAuthToken,
  getCurrentUser,
} from "../utils/auth";

function ProtectedRoute({ allowedRoles }) {
  const token = getAuthToken();
  const user = getCurrentUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (
    user.mustChangePassword &&
    window.location.pathname !== "/change-password"
  ) {
    return <Navigate to="/change-password" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    const correctDashboard =
      user.role === "ADMIN" || user.role === "HR"
        ? "/admin/dashboard"
        : "/employee/dashboard";

    return <Navigate to={correctDashboard} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;