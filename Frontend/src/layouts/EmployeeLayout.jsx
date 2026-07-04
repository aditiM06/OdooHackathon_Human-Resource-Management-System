import { NavLink, Outlet, useNavigate } from "react-router";

import {
  clearAuthSession,
  getCurrentUser,
} from "../utils/auth";

function EmployeeLayout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  const navigationItems = [
  {
    label: "Dashboard",
    path: "/employee/dashboard",
  },
  {
    label: "Attendance",
    path: "/employee/attendance",
  },
];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="flex min-h-16 items-center justify-between px-5 lg:px-8">
          <div>
            <p className="text-lg font-bold">
              Human Resource Management System
            </p>

            <p className="text-xs text-slate-400">
              Employee Portal
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {user?.loginId}
              </p>

              <p className="text-xs text-slate-400">
                {user?.role}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium transition hover:border-red-400 hover:text-red-300"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden min-h-[calc(100vh-4rem)] w-60 border-r border-slate-800 bg-slate-900 p-4 md:block">
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-fuchsia-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default EmployeeLayout;