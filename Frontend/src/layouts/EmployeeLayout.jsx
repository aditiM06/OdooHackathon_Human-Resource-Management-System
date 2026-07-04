import { NavLink, Outlet, useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faClock,
  faHouse,
  faMoneyCheckDollar,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import {
  clearAuthSession,
  getCurrentUser,
} from "../utils/auth";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/employee/dashboard",
    icon: faHouse,
  },
  {
    label: "Attendance",
    path: "/employee/attendance",
    icon: faClock,
  },
  {
    label: "Time Off",
    path: "/employee/leaves",
    icon: faCalendarCheck,
  },
  {
    label: "Salary",
    path: "/employee/salary",
    icon: faMoneyCheckDollar,
  },
  {
    label: "Profile",
    path: "/employee/profile",
    icon: faUser,
  },
];

function EmployeeLayout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  const initials = user?.loginId
    ? user.loginId.slice(2, 4).toUpperCase()
    : "EM";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-16 items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-8">
            <NavLink
              to="/employee/dashboard"
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
                  Employee Portal
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
                Employee
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
              {initials}
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

        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-600"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Outlet />
    </div>
  );
}

export default EmployeeLayout;