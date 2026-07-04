import { useCallback, useEffect, useMemo, useState } from "react";

import {
  checkInEmployee,
  checkOutEmployee,
  getEmployeeAttendance,
} from "../../api/employeeApi";

import { getAuthToken } from "../../utils/auth";

function EmployeeAttendance() {
  const token = getAuthToken();

  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAttendance = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getEmployeeAttendance(token);
      setAttendance(data.attendance);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const todayRecord = useMemo(() => {
    const todayKey = getDateKey(new Date());

    return (
      attendance.find(
        (record) =>
          getDateKey(new Date(record.attendanceDate)) ===
          todayKey
      ) || null
    );
  }, [attendance]);

  async function handleCheckIn() {
    try {
      setIsSubmitting(true);
      setError("");
      setMessage("");

      const data = await checkInEmployee(token);

      setMessage(data.message);
      await loadAttendance();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCheckOut() {
    try {
      setIsSubmitting(true);
      setError("");
      setMessage("");

      const data = await checkOutEmployee(token);

      setMessage(data.message);
      await loadAttendance();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="p-6 lg:p-8">
        <p className="text-slate-400">
          Loading attendance...
        </p>
      </main>
    );
  }

  const hasCheckedIn = Boolean(todayRecord?.checkInAt);
  const hasCheckedOut = Boolean(todayRecord?.checkOutAt);

  return (
    <main className="p-6 lg:p-8">
      <section className="mb-8">
        <p className="text-sm font-medium text-fuchsia-400">
          Attendance
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          My Attendance
        </h1>

        <p className="mt-2 text-slate-400">
          Record your daily check-in and check-out.
        </p>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Today
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {formatDate(new Date())}
          </h2>

          <div className="mt-6 space-y-4">
            <AttendanceDetail
              label="Status"
              value={
                todayRecord?.status || "Not checked in"
              }
            />

            <AttendanceDetail
              label="Check-in"
              value={formatTime(todayRecord?.checkInAt)}
            />

            <AttendanceDetail
              label="Check-out"
              value={formatTime(todayRecord?.checkOutAt)}
            />

            <AttendanceDetail
              label="Working time"
              value={
                todayRecord?.workingMinutes !== null &&
                todayRecord?.workingMinutes !== undefined
                  ? formatWorkingTime(
                      todayRecord.workingMinutes
                    )
                  : "Not completed"
              }
            />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={isSubmitting || hasCheckedIn}
              className="rounded-lg bg-fuchsia-600 px-4 py-3 font-semibold text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {hasCheckedIn
                ? "Checked in"
                : isSubmitting
                  ? "Processing..."
                  : "Check in"}
            </button>

            <button
              type="button"
              onClick={handleCheckOut}
              disabled={
                isSubmitting ||
                !hasCheckedIn ||
                hasCheckedOut
              }
              className="rounded-lg border border-slate-700 px-4 py-3 font-semibold text-white transition hover:border-fuchsia-500 hover:text-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {hasCheckedOut
                ? "Checked out"
                : isSubmitting
                  ? "Processing..."
                  : "Check out"}
            </button>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-lg font-semibold">
              Attendance history
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Your recorded attendance entries.
            </p>
          </div>

          {attendance.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">
              No attendance records available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">
                      Date
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Check-in
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Check-out
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Working time
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {attendance.map((record) => (
                    <tr
                      key={record.id}
                      className="text-slate-200"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        {formatDate(record.attendanceDate)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {formatTime(record.checkInAt)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {formatTime(record.checkOutAt)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={record.status} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {record.workingMinutes !== null &&
                        record.workingMinutes !== undefined
                          ? formatWorkingTime(
                              record.workingMinutes
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

function AttendanceDetail({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="text-sm font-semibold text-white">
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PRESENT:
      "bg-emerald-500/10 text-emerald-300",
    ABSENT:
      "bg-red-500/10 text-red-300",
    HALF_DAY:
      "bg-amber-500/10 text-amber-300",
    LEAVE:
      "bg-blue-500/10 text-blue-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ||
        "bg-slate-700 text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(dateValue));
}

function formatTime(dateValue) {
  if (!dateValue) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(dateValue));
}

function formatWorkingTime(totalMinutes) {
  const minutes = Number(totalMinutes);

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
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

export default EmployeeAttendance;