import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faBuilding,
  faCalendarDays,
  faEnvelope,
  faIdBadge,
  faLocationDot,
  faPhone,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import { getEmployeeProfile } from "../../api/employeeApi";
import { getAuthToken } from "../../utils/auth";

function EmployeeProfile() {
  const token = getAuthToken();

  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getEmployeeProfile(token);
        setEmployee(data.employee || null);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [token]);

  if (isLoading) {
    return (
      <main className="p-6 lg:p-8">
        <p className="text-slate-500">
          Loading profile...
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

  if (!employee) {
    return (
      <main className="p-6 lg:p-8">
        <p className="text-slate-500">
          Profile record not found.
        </p>
      </main>
    );
  }

  const initials =
    `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`;

  return (
    <main className="p-6 lg:p-8">
      <section className="mb-8">
        <p className="text-sm font-semibold text-sky-600">
          Personal Information
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          My Profile
        </h1>

        <p className="mt-2 text-slate-500">
          View your personal and employment information.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-sky-700">
            {initials}
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {employee.firstName} {employee.lastName}
            </h2>

            <p className="mt-1 text-slate-500">
              {employee.designation || "Employee"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {employee.role || "EMPLOYEE"}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {employee.employmentStatus || "ACTIVE"}
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
            value={
              employee.departmentName || "Not assigned"
            }
          />

          <InfoCard
            icon={faBriefcase}
            label="Employment Type"
            value={
              employee.employmentType || "Not available"
            }
          />

          <InfoCard
            icon={faCalendarDays}
            label="Joining Date"
            value={formatDate(employee.joiningDate)}
          />

          <InfoCard
            icon={faLocationDot}
            label="Address"
            value={employee.address || "Not provided"}
          />

          <InfoCard
            icon={faUser}
            label="Date of Birth"
            value={formatDate(employee.dateOfBirth)}
          />
        </div>
      </section>
    </main>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <FontAwesomeIcon
          icon={icon}
          className="mt-1 text-sky-600"
        />

        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-900">
            {value || "Not available"}
          </p>
        </div>
      </div>
    </article>
  );
}

function formatDate(value) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export default EmployeeProfile;