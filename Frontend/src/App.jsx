import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import ProtectedRoute from "./components/ProtectedRoute";

// Authentication
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminEmployeeDetails from "./pages/admin/AdminEmployeeDetails";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminLeaves from "./pages/admin/AdminLeaves";
import AdminSalaries from "./pages/admin/AdminSalaries";

// Employee pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance";
import EmployeeLeaves from "./pages/employee/EmployeeLeaves";
import EmployeeSalary from "./pages/employee/EmployeeSalary";
import EmployeeProfile from "./pages/employee/EmployeeProfile";

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
            path="/admin/employees/:employeeId"
            element={<AdminEmployeeDetails />}
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

          <Route
            path="/employee/leaves"
            element={<EmployeeLeaves />}
          />

          <Route
            path="/employee/salary"
            element={<EmployeeSalary />}
          />

          <Route
            path="/employee/profile"
            element={<EmployeeProfile />}
          />
        </Route>
      </Route>

      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;