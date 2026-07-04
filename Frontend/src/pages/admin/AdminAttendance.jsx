import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";

import { getAllAttendance } from "../../api/adminApi";
import { getAuthToken } from "../../utils/auth";

const STANDARD_WORKING_MINUTES = 8 * 60;

function AdminAttendance() {
  const token = getAuthToken();

  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAttendance() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getAllAttendance(token);
        setAttendance(data.attendance || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadAttendance();
  }, [token]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const employeeName =
        `${record.firstName || ""} ${record.lastName || ""}`.toLowerCase();

      const matchesName = employeeName.includes(
        searchTerm.trim().toLowerCase()
      );

      const recordDate = getDateKey(record.attendanceDate);
      const matchesDate =
        !selectedDate || recordDate === selectedDate;

      return matchesName && matchesDate;
    });
  }, [attendance, searchTerm, selectedDate]);

  return (
    <main className="p-6 lg:p-8">
      <section className="mb-7">
        <p className="text-sm font-semibold text-sky-600">
          Attendance Management
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Attendance
        </h1>

        <p className="mt-2 text-slate-500">
          View employee check-in, check-out and working hours.
        </p>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 p-5">
          <div className="relative min-w-64 flex-1">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search employee by name"
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div className="relative">
            <FontAwesomeIcon
              icon={faCalendarDays}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(event.target.value)
              }
              className="rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-sky-500"
            />
          </div>

          {(searchTerm || selectedDate) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedDate("");
              }}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="p-6 text-slate-500">
            Loading attendance...
          </p>
        ) : filteredAttendance.length === 0 ? (
          <p className="p-6 text-slate-500">
            No attendance records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">
                    Employee
                  </th>
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
                    Hours
                  </th>
                  <th className="px-5 py-4 font-medium">
                    Extra Hours
                  </th>
                  <th className="px-5 py-4 font-medium">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredAttendance.map((record) => {
                  const workingMinutes =
                    Number(record.workingMinutes) || 0;

                  const extraMinutes = Math.max(
                    0,
                    workingMinutes -
                      STANDARD_WORKING_MINUTES
                  );

                  return (
                    <tr key={record.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {record.firstName} {record.lastName}
                        </p>

                        <p className="text-xs text-slate-500">
                          {record.loginId}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatDate(record.attendanceDate)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatTime(record.checkInAt)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatTime(record.checkOutAt)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                        {workingMinutes
                          ? formatMinutes(workingMinutes)
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {extraMinutes > 0
                          ? formatMinutes(extraMinutes)
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={record.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }) {
  const style =
    status === "PRESENT"
      ? "bg-emerald-50 text-emerald-700"
      : status === "ABSENT"
        ? "bg-red-50 text-red-700"
        : status === "LEAVE"
          ? "bg-sky-50 text-sky-700"
          : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}
    >
      {status}
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

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

function getDateKey(value) {
  if (!value) return "";

  const date = new Date(value);

  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export default AdminAttendance;