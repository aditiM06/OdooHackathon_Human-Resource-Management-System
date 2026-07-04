import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import ProtectedRoute from "./components/ProtectedRoute";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import ChangePassword from "./pages/ChangePassword";
import Login from "./pages/Login";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance";

// Lyouts
import EmployeeLayout from "./layouts/EmployeeLayout";

//Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./layouts/AdminLayout";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminLeaves from "./pages/admin/AdminLeaves";
import AdminSalaries from "./pages/admin/AdminSalaries";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/change-password"
          element={<ChangePassword />}
        />
      </Route>

      <Route
  element={
    <ProtectedRoute allowedRoles={["ADMIN", "HR"]} />
  }
>
  <Route element={<AdminLayout />}>
    <Route
      path="/admin/dashboard"
      element={<AdminDashboard />}
    />

    <Route
      path="/admin/employees"
      element={<AdminEmployees />}
    />

    <Route
      path="/admin/attendance"
      element={<AdminAttendance />}
    />

    <Route
      path="/admin/leaves"
      element={<AdminLeaves />}
    />

    <Route
      path="/admin/salaries"
      element={<AdminSalaries />}
    />
  </Route>
</Route>

      <Route
  element={
    <ProtectedRoute allowedRoles={["EMPLOYEE"]} />
  }
>
  <Route element={<EmployeeLayout />}>
    <Route
      path="/employee/dashboard"
      element={<EmployeeDashboard />}
    />
    <Route
  path="/employee/attendance"
  element={<EmployeeAttendance />}
/>
  </Route>
</Route>

      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;