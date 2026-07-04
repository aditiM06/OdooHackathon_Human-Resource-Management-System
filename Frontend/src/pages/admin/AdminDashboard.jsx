import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlaneDeparture,
  faUserCheck,
  faUserClock,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import {
  getAllAttendance,
  getAllEmployees,
  getAllLeaveRequests,
} from "../../api/adminApi";

import { getAuthToken } from "../../utils/auth";

function AdminDashboard() {
  const navigate = useNavigate();
  const token = getAuthToken();

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError("");

        const [
          employeeResponse,
          attendanceResponse,
          leaveResponse,
        ] = await Promise.all([
          getAllEmployees(token),
          getAllAttendance(token),
          getAllLeaveRequests(token),
        ]);

        setEmployees(employeeResponse.employees || []);
        setAttendance(attendanceResponse.attendance || []);
        setLeaveRequests(leaveResponse.leaveRequests || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [token]);

  const employeeStatusData = useMemo(() => {
    const today = getDateKey(new Date());

    const presentIds = new Set(
      attendance
        .filter(
          (record) =>
            getDateKey(new Date(record.attendanceDate)) === today &&
            record.checkInAt
        )
        .map((record) => Number(record.employeeId))
    );

    const leaveIds = new Set(
      leaveRequests
        .filter(
          (request) =>
            request.status === "APPROVED" &&
            isTodayInsideRange(
              today,
              request.startDate,
              request.endDate
            )
        )
        .map((request) => Number(request.employeeId))
    );

    const currentHour = Number(
      new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
      }).format(new Date())
    );

    const countAbsence = currentHour >= 10;

    const absentIds = new Set(
      countAbsence
        ? employees
            .filter(
              (employee) =>
                employee.isActive &&
                employee.employmentStatus === "ACTIVE" &&
                !presentIds.has(Number(employee.id)) &&
                !leaveIds.has(Number(employee.id))
            )
            .map((employee) => Number(employee.id))
        : []
    );

    return {
      presentIds,
      leaveIds,
      absentIds,
      countAbsence,
    };
  }, [employees, attendance, leaveRequests]);

  if (isLoading) {
    return (
      <main className="p-6 lg:p-8">
        <p className="text-slate-500">
          Loading employee dashboard...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 lg:p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 lg:p-8">
      <section className="mb-8">
        <p className="text-sm font-semibold text-sky-600">
          Employees
        </p>

        <div className="mt-1 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Employee Directory
            </h1>

            <p className="mt-2 text-slate-500">
              View employees and their current attendance status.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatusCard
              icon={faUsers}
              title="Total Employees"
              value={employees.length}
              dotClass="bg-sky-500"
            />

            <StatusCard
              icon={faUserCheck}
              title="Present"
              value={employeeStatusData.presentIds.size}
              dotClass="bg-emerald-500"
            />

            <StatusCard
              icon={faUserClock}
              title={
                employeeStatusData.countAbsence
                  ? "Absent"
                  : "Not Checked In"
              }
              value={
                employeeStatusData.countAbsence
                  ? employeeStatusData.absentIds.size
                  : employees.filter(
                      (employee) =>
                        !employeeStatusData.presentIds.has(
                          Number(employee.id)
                        ) &&
                        !employeeStatusData.leaveIds.has(
                          Number(employee.id)
                        )
                    ).length
              }
              dotClass="bg-amber-400"
            />

            <StatusCard
              icon={faPlaneDeparture}
              title="On Leave"
              value={employeeStatusData.leaveIds.size}
              dotClass="bg-sky-500"
            />
          </div>
        </div>
      </section>

      {employees.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No employee records are available.
        </section>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {employees.map((employee) => {
            const status = getEmployeeStatus(
              employee.id,
              employeeStatusData
            );

            const initials =
              `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`;

            return (
              <button
                key={employee.id}
                type="button"
                onClick={() =>
                  navigate(`/admin/employees/${employee.id}`)
                }
                className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky-100 text-lg font-bold text-sky-700">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-slate-900">
                          {employee.firstName} {employee.lastName}
                        </h2>

                        <p className="mt-1 truncate text-sm text-slate-500">
                          {employee.designation}
                        </p>
                      </div>

                      <span
                        title={status.label}
                        className={`mt-1 h-3 w-3 shrink-0 rounded-full ${status.dotClass}`}
                      />
                    </div>

                    <p className="mt-3 truncate text-sm text-slate-600">
                      {employee.departmentName || "No department"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {employee.loginId}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-slate-500">
                    {status.label}
                  </span>

                  <span className="text-xs font-semibold text-sky-600">
                    View profile
                  </span>
                </div>
              </button>
            );
          })}
        </section>
      )}
    </main>
  );
}

function StatusCard({
  icon,
  title,
  value,
  dotClass,
}) {
  return (
    <article className="flex min-w-36 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="relative">
        <FontAwesomeIcon
          icon={icon}
          className="text-slate-500"
        />

        <span
          className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${dotClass}`}
        />
      </div>

      <div>
        <p className="text-lg font-bold text-slate-900">
          {value}
        </p>

        <p className="text-xs text-slate-500">
          {title}
        </p>
      </div>
    </article>
  );
}

function getEmployeeStatus(employeeId, statusData) {
  const id = Number(employeeId);

  if (statusData.presentIds.has(id)) {
    return {
      label: "Present",
      dotClass: "bg-emerald-500",
    };
  }

  if (statusData.leaveIds.has(id)) {
    return {
      label: "On leave",
      dotClass: "bg-sky-500",
    };
  }

  if (
    statusData.countAbsence &&
    statusData.absentIds.has(id)
  ) {
    return {
      label: "Absent",
      dotClass: "bg-amber-400",
    };
  }

  return {
    label: "Not checked in",
    dotClass: "bg-slate-300",
  };
}

function isTodayInsideRange(
  today,
  startDate,
  endDate
) {
  const start = getDateKey(new Date(startDate));
  const end = getDateKey(new Date(endDate));

  return today >= start && today <= end;
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

export default AdminDashboard;