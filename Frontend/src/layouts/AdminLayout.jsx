import { NavLink, Outlet, useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
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
    label: "Employees",
    path: "/admin/dashboard",
    icon: faUsers,
  },
  {
    label: "Attendance",
    path: "/admin/attendance",
    icon: faClock,
  },
  {
    label: "Time Off",
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
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-16 items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-8">
            <NavLink
              to="/admin/dashboard"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 font-bold text-white">
                OI
              </div>

              <div className="hidden lg:block">
                <p className="font-bold text-slate-900">
                  HRMS
                </p>

                <p className="text-xs text-slate-500">
                  Admin Portal
                </p>
              </div>
            </NavLink>

            <nav className="hidden items-center gap-1 md:flex">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-sky-50 text-sky-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <FontAwesomeIcon icon={item.icon} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user?.loginId}
              </p>

              <p className="text-xs text-slate-500">
                {user?.role}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
              RS
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}

export default AdminLayout;