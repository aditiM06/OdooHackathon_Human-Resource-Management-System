import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faClock,
  faIdBadge,
  faIndianRupeeSign,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import {
  getEmployeeAttendance,
  getEmployeeLeaves,
  getEmployeeProfile,
  getEmployeeSalary,
} from "../../api/employeeApi";

import { getAuthToken } from "../../utils/auth";

function EmployeeDashboard() {
  const navigate = useNavigate();
  const token = getAuthToken();

  const [dashboardData, setDashboardData] = useState({
    profile: null,
    attendance: [],
    leaveRequests: [],
    currentSalary: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError("");

        const [
          profileResponse,
          attendanceResponse,
          leaveResponse,
          salaryResponse,
        ] = await Promise.all([
          getEmployeeProfile(token),
          getEmployeeAttendance(token),
          getEmployeeLeaves(token),
          getEmployeeSalary(token),
        ]);

        setDashboardData({
          profile: profileResponse.employee || null,
          attendance: attendanceResponse.attendance || [],
          leaveRequests: leaveResponse.leaveRequests || [],
          currentSalary:
            salaryResponse.currentSalary || null,
        });
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [token]);

  const {
    profile,
    attendance,
    leaveRequests,
    currentSalary,
  } = dashboardData;

  const todayAttendance = useMemo(() => {
    const todayKey = getDateKey(new Date());

    return (
      attendance.find(
        (record) =>
          getDateKey(record.attendanceDate) === todayKey
      ) || null
    );
  }, [attendance]);

  const pendingLeaveCount = leaveRequests.filter(
    (request) => request.status === "PENDING"
  ).length;

  const approvedLeaveCount = leaveRequests.filter(
    (request) => request.status === "APPROVED"
  ).length;

  const salary = normalizeSalary(currentSalary);

  const monthlyGross =
    salary.basicSalary +
    salary.housingAllowance +
    salary.transportAllowance +
    salary.medicalAllowance +
    salary.otherAllowance;

  const monthlyNet = monthlyGross - salary.deductions;

  if (isLoading) {
    return (
      <main className="p-6 lg:p-8">
        <p className="text-slate-500">
          Loading your dashboard...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 lg:p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 lg:p-8">
      <section className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sky-600">
            Employee Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Welcome, {profile?.firstName}{" "}
            {profile?.lastName}
          </h1>

          <p className="mt-2 text-slate-500">
            {profile?.designation || "Employee"}
            {profile?.departmentName
              ? ` · ${profile.departmentName}`
              : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/employee/profile")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700"
        >
          <FontAwesomeIcon icon={faUser} />
          View Profile
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={faIdBadge}
          label="Employee ID"
          value={profile?.loginId || "Not available"}
          description={
            profile?.employmentStatus || "Employee"
          }
        />

        <SummaryCard
          icon={faClock}
          label="Today's Attendance"
          value={
            todayAttendance?.status || "Not checked in"
          }
          description={
            todayAttendance?.checkInAt
              ? `Check-in: ${formatTime(
                  todayAttendance.checkInAt
                )}`
              : "No attendance recorded"
          }
        />

        <SummaryCard
          icon={faCalendarCheck}
          label="Time Off"
          value={`${pendingLeaveCount} pending`}
          description={`${approvedLeaveCount} approved`}
        />

        <SummaryCard
          icon={faIndianRupeeSign}
          label="Monthly Net Salary"
          value={
            currentSalary
              ? formatCurrency(monthlyNet)
              : "Not assigned"
          }
          description="Current salary structure"
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Attendance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest attendance records.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/employee/attendance")
              }
              className="text-sm font-semibold text-sky-600 hover:text-sky-800"
            >
              View all
            </button>
          </div>

          {attendance.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No attendance records available.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {attendance.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {formatDate(record.attendanceDate)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {record.workingMinutes
                        ? formatWorkingTime(
                            record.workingMinutes
                          )
                        : "Working time unavailable"}
                    </p>
                  </div>

                  <StatusBadge status={record.status} />
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Time Off
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest leave requests.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/employee/leaves")
              }
              className="text-sm font-semibold text-sky-600 hover:text-sky-800"
            >
              View all
            </button>
          </div>

          {leaveRequests.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No leave requests available.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {leaveRequests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900">
                      {request.leaveTypeName}
                    </p>

                    <StatusBadge status={request.status} />
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {formatDate(request.startDate)} to{" "}
                    {formatDate(request.endDate)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
        <FontAwesomeIcon icon={icon} />
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>

      {description && (
        <p className="mt-2 text-xs text-slate-500">
          {description}
        </p>
      )}
    </article>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PRESENT: "bg-emerald-50 text-emerald-700",
    ABSENT: "bg-red-50 text-red-700",
    HALF_DAY: "bg-amber-50 text-amber-700",
    LEAVE: "bg-sky-50 text-sky-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-red-700",
    PENDING: "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ||
        "bg-slate-100 text-slate-700"
      }`}
    >
      {status || "UNKNOWN"}
    </span>
  );
}

function normalizeSalary(salary) {
  if (!salary) {
    return {
      basicSalary: 0,
      housingAllowance: 0,
      transportAllowance: 0,
      medicalAllowance: 0,
      otherAllowance: 0,
      deductions: 0,
    };
  }

  return {
    basicSalary: Number(
      salary.basicSalary ?? salary.basic_salary ?? 0
    ),
    housingAllowance: Number(
      salary.housingAllowance ??
        salary.housing_allowance ??
        0
    ),
    transportAllowance: Number(
      salary.transportAllowance ??
        salary.transport_allowance ??
        0
    ),
    medicalAllowance: Number(
      salary.medicalAllowance ??
        salary.medical_allowance ??
        0
    ),
    otherAllowance: Number(
      salary.otherAllowance ??
        salary.other_allowance ??
        0
    ),
    deductions: Number(salary.deductions ?? 0),
  };
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatWorkingTime(totalMinutes) {
  const minutes = Number(totalMinutes) || 0;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getDateKey(value) {
  if (!value) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).formatToParts(new Date(value));

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export default EmployeeDashboard;