import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBuilding,
  faBriefcase,
  faEnvelope,
  faIdBadge,
  faPhone,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import { getEmployeeById } from "../../api/adminApi";
import { getAuthToken } from "../../utils/auth";

function AdminEmployeeDetails() {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const token = getAuthToken();

  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEmployee() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getEmployeeById(
          employeeId,
          token
        );

        setEmployee(data.employee);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadEmployee();
  }, [employeeId, token]);

  if (isLoading) {
    return (
      <main className="p-6 lg:p-8">
        <p className="text-slate-500">
          Loading employee details...
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

  const initials =
    `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`;

  return (
    <main className="p-6 lg:p-8">
      <button
        type="button"
        onClick={() => navigate("/admin/dashboard")}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-700"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        Back to employees
      </button>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-sky-700">
            {initials}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {employee.firstName} {employee.lastName}
            </h1>

            <p className="mt-1 text-slate-500">
              {employee.designation}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {employee.role}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {employee.employmentStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoCard
            icon={faIdBadge}
            label="Employee ID"
            value={employee.loginId}
          />

          <InfoCard
            icon={faEnvelope}
            label="Email"
            value={employee.email}
          />

          <InfoCard
            icon={faPhone}
            label="Phone"
            value={employee.phone || "Not provided"}
          />

          <InfoCard
            icon={faBuilding}
            label="Department"
            value={employee.departmentName || "Not assigned"}
          />

          <InfoCard
            icon={faBriefcase}
            label="Employment Type"
            value={employee.employmentType}
          />

          <InfoCard
            icon={faUser}
            label="Joining Date"
            value={formatDate(employee.joiningDate)}
          />
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <PageLinkCard
          title="Attendance"
          description="View this employee's attendance history."
          onClick={() =>
            navigate(`/admin/attendance?employeeId=${employee.id}`)
          }
        />

        <PageLinkCard
          title="Leave Requests"
          description="View leave requests submitted by this employee."
          onClick={() =>
            navigate(`/admin/leaves?employeeId=${employee.id}`)
          }
        />

        <PageLinkCard
          title="Salary"
          description="View and manage salary structure."
          onClick={() =>
            navigate(`/admin/salaries?employeeId=${employee.id}`)
          }
        />
      </section>
    </main>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <FontAwesomeIcon
          icon={icon}
          className="text-sky-600"
        />

        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function PageLinkCard({ title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow-md"
    >
      <h2 className="font-semibold text-slate-900">
        {title}
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>
    </button>
  );
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(dateValue));
}

export default AdminEmployeeDetails;