import { NavLink, Outlet, useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faChartPie,
  faClock,
  faMoneyCheckDollar,
  faRightFromBracket,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import {
  clearAuthSession,
  getCurrentUser,
} from "../utils/auth";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: faChartPie,
  },
  {
    label: "Employees",
    path: "/admin/employees",
    icon: faUsers,
  },
  {
    label: "Attendance",
    path: "/admin/attendance",
    icon: faClock,
  },
  {
    label: "Leave Requests",
    path: "/admin/leaves",
    icon: faCalendarCheck,
  },
  {
    label: "Salaries",
    path: "/admin/salaries",
    icon: faMoneyCheckDollar,
  },
];

function AdminLayout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex min-h-16 items-center justify-between px-5 lg:px-8">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Human Resource Management System
            </h1>

            <p className="text-xs text-slate-500">
              Admin and HR Portal
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user?.loginId}
              </p>

              <p className="text-xs text-slate-500">
                {user?.role}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden min-h-[calc(100vh-4rem)] w-64 border-r border-slate-200 bg-white p-4 md:block">
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-sky-100 text-sky-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="w-5"
                />

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

export default AdminLayout;