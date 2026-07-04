import { useEffect, useState } from "react";

import {
  getEmployeeAttendance,
  getEmployeeLeaves,
  getEmployeeProfile,
  getEmployeeSalary,
} from "../../api/employeeApi";

import { getAuthToken } from "../../utils/auth";

function EmployeeDashboard() {
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
          profile: profileResponse.employee,
          attendance: attendanceResponse.attendance,
          leaveRequests: leaveResponse.leaveRequests,
          currentSalary: salaryResponse.currentSalary,
        });
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [token]);

  if (isLoading) {
    return (
      <main className="p-6 lg:p-8">
        <p className="text-slate-400">
          Loading your dashboard...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 lg:p-8">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
          {error}
        </div>
      </main>
    );
  }

  const {
    profile,
    attendance,
    leaveRequests,
    currentSalary,
  } = dashboardData;

  const todayKey = getDateKey(new Date());

const todayAttendance =
  attendance.find(
    (record) =>
      getDateKey(new Date(record.attendanceDate)) ===
      todayKey
  ) || null;

  const pendingLeaveCount = leaveRequests.filter(
    (request) => request.status === "PENDING"
  ).length;

  const approvedLeaveCount = leaveRequests.filter(
    (request) => request.status === "APPROVED"
  ).length;

  const grossSalary = currentSalary
    ? Number(currentSalary.basicSalary) +
      Number(currentSalary.housingAllowance) +
      Number(currentSalary.transportAllowance) +
      Number(currentSalary.medicalAllowance) +
      Number(currentSalary.otherAllowance)
    : null;

  return (
    <main className="p-6 lg:p-8">
      <section className="mb-8">
        <p className="text-sm font-medium text-fuchsia-400">
          Employee Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Welcome, {profile?.firstName} {profile?.lastName}
        </h1>

        <p className="mt-2 text-slate-400">
          {profile?.designation}
          {profile?.departmentName
            ? ` · ${profile.departmentName}`
            : ""}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Employee ID"
          value={profile?.loginId || "Not available"}
          description={profile?.employmentStatus}
        />

        <DashboardCard
          title="Today's Attendance"
          value={
            todayAttendance?.status || "Not checked in"
          }
          description={
            todayAttendance?.checkInAt
              ? `Check-in recorded`
              : "No attendance record today"
          }
        />

        <DashboardCard
          title="Pending Leaves"
          value={pendingLeaveCount}
          description={`${approvedLeaveCount} approved request(s)`}
        />

        <DashboardCard
          title="Gross Salary"
          value={
            grossSalary === null
              ? "Not assigned"
              : `₹${grossSalary.toLocaleString("en-IN")}`
          }
          description="Current salary structure"
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">
            Recent attendance
          </h2>

          {attendance.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              No attendance records available.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {attendance.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg bg-slate-950 p-4"
                >
                  <div>
                    <p className="font-medium">
                      {formatDate(record.attendanceDate)}
                    </p>

                    <p className="text-xs text-slate-400">
                      {record.workingMinutes
                        ? `${record.workingMinutes} working minutes`
                        : "Working time not completed"}
                    </p>
                  </div>

                  <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold text-fuchsia-300">
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">
            Recent leave requests
          </h2>

          {leaveRequests.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              No leave requests available.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {leaveRequests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg bg-slate-950 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">
                      {request.leaveTypeName}
                    </p>

                    <span className="text-xs font-semibold text-fuchsia-300">
                      {request.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-400">
                    {formatDate(request.startDate)} to{" "}
                    {formatDate(request.endDate)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function DashboardCard({ title, value, description }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-3 break-words text-2xl font-bold">
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

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(dateValue));
}


function getDateKey(dateValue) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).formatToParts(dateValue);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export default EmployeeDashboard;