import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faClock,
  faPlaneDeparture,
} from "@fortawesome/free-solid-svg-icons";

import { getEmployeeLeaves } from "../../api/employeeApi";
import { getAuthToken } from "../../utils/auth";

function EmployeeLeaves() {
  const token = getAuthToken();

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLeaves() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getEmployeeLeaves(token);
        setLeaveRequests(data.leaveRequests || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadLeaves();
  }, [token]);

  const filteredRequests = useMemo(() => {
    if (statusFilter === "ALL") {
      return leaveRequests;
    }

    return leaveRequests.filter(
      (request) => request.status === statusFilter
    );
  }, [leaveRequests, statusFilter]);

  const pendingCount = leaveRequests.filter(
    (request) => request.status === "PENDING"
  ).length;

  const approvedCount = leaveRequests.filter(
    (request) => request.status === "APPROVED"
  ).length;

  const rejectedCount = leaveRequests.filter(
    (request) => request.status === "REJECTED"
  ).length;

  return (
    <main className="p-6 lg:p-8">
      <section className="mb-8">
        <p className="text-sm font-semibold text-sky-600">
          Time Off
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          My Time Off
        </h1>

        <p className="mt-2 text-slate-500">
          Review your submitted leave requests and their
          current status.
        </p>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={faClock}
          label="Pending"
          value={pendingCount}
        />

        <SummaryCard
          icon={faCalendarCheck}
          label="Approved"
          value={approvedCount}
        />

        <SummaryCard
          icon={faPlaneDeparture}
          label="Rejected"
          value={rejectedCount}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Leave Requests
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredRequests.length} request(s)
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {isLoading ? (
          <p className="p-6 text-slate-500">
            Loading time-off requests...
          </p>
        ) : filteredRequests.length === 0 ? (
          <p className="p-6 text-slate-500">
            No leave requests found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">
                    Time Off Type
                  </th>
                  <th className="px-5 py-4 font-medium">
                    Start Date
                  </th>
                  <th className="px-5 py-4 font-medium">
                    End Date
                  </th>
                  <th className="px-5 py-4 font-medium">
                    Days
                  </th>
                  <th className="px-5 py-4 font-medium">
                    Reason
                  </th>
                  <th className="px-5 py-4 font-medium">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {request.leaveTypeName ||
                        "Time Off"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {formatDate(request.startDate)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {formatDate(request.endDate)}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {request.totalDays ?? "—"}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-slate-700">
                      {request.reason || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        status={request.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <FontAwesomeIcon icon={icon} />
        </div>

        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const styles = {
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

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export default EmployeeLeaves;