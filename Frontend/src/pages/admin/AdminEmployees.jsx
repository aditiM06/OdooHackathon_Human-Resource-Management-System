import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSearch,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import {
  createEmployee,
  getAllEmployees,
} from "../../api/adminApi";

import { getAuthToken } from "../../utils/auth";

function AdminEmployees() {
  const navigate = useNavigate();
  const token = getAuthToken();

  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [createdCredentials, setCreatedCredentials] =
    useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    joiningDate: "",
    designation: "",
    departmentId: "",
    role: "EMPLOYEE",
    employmentType: "FULL_TIME",
  });

  async function loadEmployees() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getAllEmployees(token);
      setEmployees(data.employees || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setError("");
    setMessage("");
  }

  async function handleCreateEmployee(event) {
    event.preventDefault();

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.joiningDate ||
      !formData.designation.trim()
    ) {
      setError(
        "First name, last name, email, joining date and designation are required"
      );
      return;
    }

    try {
      setIsCreating(true);
      setError("");
      setMessage("");
      setCreatedCredentials(null);

      const data = await createEmployee(
        {
          ...formData,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          designation: formData.designation.trim(),
          departmentId: formData.departmentId
            ? Number(formData.departmentId)
            : null,
        },
        token
      );

      setCreatedCredentials(data.employee);
      setMessage("Employee created successfully");

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        joiningDate: "",
        designation: "",
        departmentId: "",
        role: "EMPLOYEE",
        employmentType: "FULL_TIME",
      });

      await loadEmployees();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsCreating(false);
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    const searchableText = [
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.loginId,
      employee.designation,
      employee.departmentName,
      employee.role,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchTerm.toLowerCase());
  });

  return (
    <main className="p-6 lg:p-8">
      <section className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sky-600">
            Employee Management
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Employees
          </h1>

          <p className="mt-2 text-slate-500">
            View employee records and create new employee accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowCreateForm((currentValue) => !currentValue)
          }
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          <FontAwesomeIcon
            icon={showCreateForm ? faXmark : faPlus}
          />

          {showCreateForm ? "Close Form" : "Add Employee"}
        </button>
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

      {createdCredentials && (
        <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            Temporary employee credentials
          </h2>

          <p className="mt-2 text-sm text-amber-800">
            Save these credentials now. The temporary password is shown only
            in this response.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <CredentialItem
              label="Login ID"
              value={createdCredentials.loginId}
            />

            <CredentialItem
              label="Email"
              value={createdCredentials.email}
            />

            <CredentialItem
              label="Temporary Password"
              value={createdCredentials.temporaryPassword}
            />
          </div>
        </section>
      )}

      {showCreateForm && (
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Create Employee
          </h2>

          <form
            className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            onSubmit={handleCreateEmployee}
          >
            <FormInput
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
            />

            <FormInput
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
            />

            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />

            <FormInput
              label="Joining Date"
              name="joiningDate"
              type="date"
              value={formData.joiningDate}
              onChange={handleChange}
            />

            <FormInput
              label="Designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Department
              </label>

              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-sky-500"
              >
                <option value="">No department</option>
                <option value="1">Human Resources</option>
                <option value="2">Engineering</option>
                <option value="3">Finance</option>
                <option value="4">Operations</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Role
              </label>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-sky-500"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="HR">HR</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Employment Type
              </label>

              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-sky-500"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isCreating}
                className="w-full rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating
                  ? "Creating Employee..."
                  : "Create Employee"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="font-bold text-slate-900">
              Employee Directory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredEmployees.length} employee record(s)
            </p>
          </div>

          <div className="relative w-full max-w-sm">
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
              placeholder="Search employees"
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="p-6 text-slate-500">
            Loading employees...
          </p>
        ) : filteredEmployees.length === 0 ? (
          <p className="p-6 text-slate-500">
            No matching employee records found.
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
                    Employee ID
                  </th>
                  <th className="px-5 py-4 font-medium">
                    Department
                  </th>
                  <th className="px-5 py-4 font-medium">
                    Role
                  </th>
                  <th className="px-5 py-4 font-medium">
                    Status
                  </th>
                  <th className="px-5 py-4 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredEmployees.map((employee) => {
                  const initials =
                    `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`;

                  return (
                    <tr key={employee.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 font-semibold text-sky-700">
                            {initials || (
                              <FontAwesomeIcon icon={faUser} />
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {employee.firstName}{" "}
                              {employee.lastName}
                            </p>

                            <p className="text-xs text-slate-500">
                              {employee.designation}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {employee.loginId}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {employee.departmentName ||
                          "Not assigned"}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {employee.role}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            employee.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {employee.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/admin/employees/${employee.id}`
                            )
                          }
                          className="font-semibold text-sky-600 hover:text-sky-800"
                        >
                          View Details
                        </button>
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

function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-500"
      />
    </div>
  );
}

function CredentialItem({ label, value }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-white p-3">
      <p className="text-xs font-medium text-amber-700">
        {label}
      </p>

      <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default AdminEmployees;