import { useEffect, useMemo, useState } from "react";

import {
  getAllLeaveRequests,
  updateLeaveStatus,
} from "../../api/adminApi";

import { getAuthToken } from "../../utils/auth";

function AdminLeaves() {
  const token = getAuthToken();

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  async function loadLeaveRequests() {
    try {
      setError("");

      const data = await getAllLeaveRequests(token);
      setLeaveRequests(data.leaveRequests || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  async function handleReview(
    leaveRequestId,
    status
  ) {
    const comment = window.prompt(
      `Optional comment for ${status.toLowerCase()}:`,
      status === "APPROVED"
        ? "Approved"
        : "Request rejected"
    );

    if (comment === null) return;

    try {
      setProcessingId(leaveRequestId);
      setError("");

      await updateLeaveStatus(
        leaveRequestId,
        {
          status,
          comment,
        },
        token
      );

      await loadLeaveRequests();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProcessingId(null);
    }
  }

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      const employeeName =
        `${request.firstName || ""} ${request.lastName || ""}`.toLowerCase();

      const matchesSearch = employeeName.includes(
        searchTerm.toLowerCase()
      );

      const matchesStatus =
        statusFilter === "ALL" ||
        request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leaveRequests, searchTerm, statusFilter]);

  return (
    <main className="p-6 lg:p-8">
      <section className="mb-7">
        <p className="text-sm font-semibold text-sky-600">
          Time Off Management
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Time Off
        </h1>

        <p className="mt-2 text-slate-500">
          Review paid, sick and unpaid leave requests.
        </p>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-4 border-b border-slate-200 p-5">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search employee name"
            className="min-w-64 flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-sky-500"
          />

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

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">
                  Employee
                </th>
                <th className="px-5 py-4 font-medium">
                  Start Date
                </th>
                <th className="px-5 py-4 font-medium">
                  End Date
                </th>
                <th className="px-5 py-4 font-medium">
                  Time Off Type
                </th>
                <th className="px-5 py-4 font-medium">
                  Days
                </th>
                <th className="px-5 py-4 font-medium">
                  Status
                </th>
                <th className="px-5 py-4 font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {request.firstName} {request.lastName}
                    </p>

                    <p className="text-xs text-slate-500">
                      {request.loginId}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    {formatDate(request.startDate)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    {formatDate(request.endDate)}
                  </td>

                  <td className="px-5 py-4">
                    {request.leaveTypeName}
                  </td>

                  <td className="px-5 py-4">
                    {request.totalDays}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {request.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {request.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={processingId === request.id}
                          onClick={() =>
                            handleReview(
                              request.id,
                              "APPROVED"
                            )
                          }
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={processingId === request.id}
                          onClick={() =>
                            handleReview(
                              request.id,
                              "REJECTED"
                            )
                          }
                          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">
                        Reviewed
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredRequests.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
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

export default AdminLeaves;