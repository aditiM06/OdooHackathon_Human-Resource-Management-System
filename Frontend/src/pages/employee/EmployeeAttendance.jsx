import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faArrowRightToBracket,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

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
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAttendance = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getEmployeeAttendance(token);
      setAttendance(data.attendance || []);
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
          getDateKey(record.attendanceDate) === todayKey
      ) || null
    );
  }, [attendance]);

  async function handleCheckIn() {
    try {
      setIsSubmitting(true);
      setError("");
      setMessage("");

      const data = await checkInEmployee(token);
      setMessage(data.message || "Checked in successfully");

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
      setMessage(
        data.message || "Checked out successfully"
      );

      await loadAttendance();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasCheckedIn = Boolean(todayRecord?.checkInAt);
  const hasCheckedOut = Boolean(todayRecord?.checkOutAt);

  if (isLoading) {
    return (
      <main className="p-6 lg:p-8">
        <p className="text-slate-500">
          Loading attendance...
        </p>
      </main>
    );
  }

  return (
    <main className="p-6 lg:p-8">
      <section className="mb-8">
        <p className="text-sm font-semibold text-sky-600">
          Attendance
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          My Attendance
        </h1>

        <p className="mt-2 text-slate-500">
          Record your daily check-in and check-out and
          review previous entries.
        </p>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.7fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <FontAwesomeIcon icon={faClock} />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Today
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
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
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon
                icon={faArrowRightToBracket}
              />

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
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon
                icon={faArrowRightFromBracket}
              />

              {hasCheckedOut
                ? "Checked out"
                : isSubmitting
                  ? "Processing..."
                  : "Check out"}
            </button>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Attendance History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your recorded attendance entries.
            </p>
          </div>

          {attendance.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No attendance records available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">
                      Date
                    </th>
                    <th className="px-5 py-4 font-medium">
                      Check In
                    </th>
                    <th className="px-5 py-4 font-medium">
                      Check Out
                    </th>
                    <th className="px-5 py-4 font-medium">
                      Status
                    </th>
                    <th className="px-5 py-4 font-medium">
                      Working Time
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {attendance.map((record) => (
                    <tr key={record.id}>
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                        {formatDate(
                          record.attendanceDate
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatTime(record.checkInAt)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatTime(record.checkOutAt)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={record.status}
                        />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
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
    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PRESENT: "bg-emerald-50 text-emerald-700",
    ABSENT: "bg-red-50 text-red-700",
    HALF_DAY: "bg-amber-50 text-amber-700",
    LEAVE: "bg-sky-50 text-sky-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ||
        "bg-slate-100 text-slate-700"
      }`}
    >
      {status || "UNKNOWN"}
    </span>
  );
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

export default EmployeeAttendance;