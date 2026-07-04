import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faIndianRupeeSign,
  faPen,
  faRotateLeft,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";

import {
  createSalaryStructure,
  getAllEmployees,
  getEmployeeSalaryHistory,
} from "../../api/adminApi";

import { getAuthToken } from "../../utils/auth";

const EMPTY_FORM = {
  basicSalary: "",
  housingAllowance: "0",
  transportAllowance: "0",
  medicalAllowance: "0",
  otherAllowance: "0",
  deductions: "0",
  effectiveFrom: "",
};

function AdminSalaries() {
  const token = getAuthToken();
  const [searchParams, setSearchParams] = useSearchParams();

  const employeeIdFromUrl =
    searchParams.get("employeeId") || "";

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState(employeeIdFromUrl);

  const [salaryHistory, setSalaryHistory] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] =
    useState(true);
  const [isLoadingSalary, setIsLoadingSalary] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedEmployee = useMemo(() => {
    return (
      employees.find(
        (employee) =>
          Number(employee.id) ===
          Number(selectedEmployeeId)
      ) || null
    );
  }, [employees, selectedEmployeeId]);

  const currentSalary = useMemo(() => {
    if (salaryHistory.length === 0) {
      return null;
    }

    return (
      salaryHistory.find((salary) => {
        const effectiveTo = getField(
          salary,
          "effectiveTo",
          "effective_to"
        );

        return effectiveTo === null || !effectiveTo;
      }) || salaryHistory[0]
    );
  }, [salaryHistory]);

  const salaryValues = useMemo(() => {
    return normalizeSalary(currentSalary);
  }, [currentSalary]);

  const monthlyGross =
    salaryValues.basicSalary +
    salaryValues.housingAllowance +
    salaryValues.transportAllowance +
    salaryValues.medicalAllowance +
    salaryValues.otherAllowance;

  const monthlyNet =
    monthlyGross - salaryValues.deductions;

  const yearlyNet = monthlyNet * 12;

  useEffect(() => {
    async function loadEmployees() {
      try {
        setIsLoadingEmployees(true);
        setError("");

        const data = await getAllEmployees(token);

        const employeeList =
          data.employees ||
          data.data ||
          data.results ||
          [];

        setEmployees(employeeList);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoadingEmployees(false);
      }
    }

    loadEmployees();
  }, [token]);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setSalaryHistory([]);
      setFormData(EMPTY_FORM);
      setIsEditing(false);
      return;
    }

    loadSalary(selectedEmployeeId);
  }, [selectedEmployeeId, token]);

  async function loadSalary(employeeId) {
    try {
      setIsLoadingSalary(true);
      setError("");
      setMessage("");

      const data = await getEmployeeSalaryHistory(
        employeeId,
        token
      );

      const history =
        data.salaryHistory ||
        data.salaries ||
        data.salaryStructures ||
        data.salary ||
        [];

      const normalizedHistory = Array.isArray(history)
        ? history
        : history
          ? [history]
          : [];

      setSalaryHistory(normalizedHistory);

      const latestSalary =
        normalizedHistory.find((salary) => {
          const effectiveTo = getField(
            salary,
            "effectiveTo",
            "effective_to"
          );

          return effectiveTo === null || !effectiveTo;
        }) || normalizedHistory[0];

      if (latestSalary) {
        const values = normalizeSalary(latestSalary);

        setFormData({
          basicSalary: String(values.basicSalary),
          housingAllowance: String(
            values.housingAllowance
          ),
          transportAllowance: String(
            values.transportAllowance
          ),
          medicalAllowance: String(
            values.medicalAllowance
          ),
          otherAllowance: String(
            values.otherAllowance
          ),
          deductions: String(values.deductions),
          effectiveFrom: getDateInputValue(
            getField(
              latestSalary,
              "effectiveFrom",
              "effective_from"
            )
          ),
        });
      } else {
        setFormData(EMPTY_FORM);
      }
    } catch (requestError) {
      setError(requestError.message);
      setSalaryHistory([]);
      setFormData(EMPTY_FORM);
    } finally {
      setIsLoadingSalary(false);
    }
  }

  function handleEmployeeChange(event) {
    const employeeId = event.target.value;

    setSelectedEmployeeId(employeeId);
    setSearchParams(
      employeeId ? { employeeId } : {}
    );

    setIsEditing(false);
    setError("");
    setMessage("");
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setError("");
    setMessage("");
  }

  function handleStartEditing() {
    if (!selectedEmployeeId) {
      setError("Select an employee first");
      return;
    }

    if (currentSalary) {
      const values = normalizeSalary(currentSalary);

      setFormData({
        basicSalary: String(values.basicSalary),
        housingAllowance: String(
          values.housingAllowance
        ),
        transportAllowance: String(
          values.transportAllowance
        ),
        medicalAllowance: String(
          values.medicalAllowance
        ),
        otherAllowance: String(
          values.otherAllowance
        ),
        deductions: String(values.deductions),
        effectiveFrom: getTodayDateInput(),
      });
    } else {
      setFormData({
        ...EMPTY_FORM,
        effectiveFrom: getTodayDateInput(),
      });
    }

    setIsEditing(true);
    setMessage("");
  }

  function handleCancelEditing() {
    setIsEditing(false);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedEmployeeId) {
      setError("Select an employee first");
      return;
    }

    if (
      formData.basicSalary === "" ||
      Number(formData.basicSalary) < 0
    ) {
      setError("Enter a valid basic salary");
      return;
    }

    if (!formData.effectiveFrom) {
      setError("Effective date is required");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setMessage("");

      await createSalaryStructure(
        selectedEmployeeId,
        {
          basicSalary: Number(formData.basicSalary),
          housingAllowance: Number(
            formData.housingAllowance || 0
          ),
          transportAllowance: Number(
            formData.transportAllowance || 0
          ),
          medicalAllowance: Number(
            formData.medicalAllowance || 0
          ),
          otherAllowance: Number(
            formData.otherAllowance || 0
          ),
          deductions: Number(
            formData.deductions || 0
          ),
          effectiveFrom: formData.effectiveFrom,
        },
        token
      );

      await loadSalary(selectedEmployeeId);

      setIsEditing(false);
      setMessage(
        currentSalary
          ? "Salary structure updated successfully"
          : "Salary structure created successfully"
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="p-6 lg:p-8">
      <section className="mb-7">
        <p className="text-sm font-semibold text-sky-600">
          Payroll Management
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Salary Information
        </h1>

        <p className="mt-2 text-slate-500">
          View current salary components and create revised
          salary structures.
        </p>
      </section>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label
          htmlFor="salaryEmployee"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Select Employee
        </label>

        <select
          id="salaryEmployee"
          value={selectedEmployeeId}
          onChange={handleEmployeeChange}
          disabled={isLoadingEmployees}
          className="w-full max-w-xl rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-sky-500 disabled:opacity-60"
        >
          <option value="">
            {isLoadingEmployees
              ? "Loading employees..."
              : "Choose an employee"}
          </option>

          {employees.map((employee) => (
            <option
              key={employee.id}
              value={employee.id}
            >
              {employee.firstName} {employee.lastName} —{" "}
              {employee.loginId}
            </option>
          ))}
        </select>
      </section>

      {!selectedEmployeeId ? (
        <EmptyState
          title="Select an employee"
          description="Choose an employee to view their current salary structure."
        />
      ) : isLoadingSalary ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
          Loading salary information...
        </section>
      ) : (
        <>
          <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm text-slate-500">
                Selected employee
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {selectedEmployee
                  ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
                  : `Employee #${selectedEmployeeId}`}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {selectedEmployee?.designation ||
                  "Employee salary record"}
              </p>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEditing}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                <FontAwesomeIcon icon={faPen} />

                {currentSalary
                  ? "Revise Salary"
                  : "Add Salary"}
              </button>
            )}
          </section>

          {currentSalary ? (
            <>
              <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  icon={faWallet}
                  label="Monthly Gross Wage"
                  value={formatCurrency(monthlyGross)}
                />

                <SummaryCard
                  icon={faIndianRupeeSign}
                  label="Monthly Net Wage"
                  value={formatCurrency(monthlyNet)}
                />

                <SummaryCard
                  icon={faIndianRupeeSign}
                  label="Yearly Net Wage"
                  value={formatCurrency(yearlyNet)}
                />

                <SummaryCard
                  icon={faCalendarDays}
                  label="Effective From"
                  value={formatDate(
                    getField(
                      currentSalary,
                      "effectiveFrom",
                      "effective_from"
                    )
                  )}
                  isCurrency={false}
                />
              </section>

              <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-sm font-semibold text-sky-600">
                    Current Structure
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Salary Breakdown
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    These are the employee’s currently stored
                    salary values.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <BreakdownCard
                    label="Basic Salary"
                    value={salaryValues.basicSalary}
                  />

                  <BreakdownCard
                    label="House Rent Allowance"
                    value={
                      salaryValues.housingAllowance
                    }
                  />

                  <BreakdownCard
                    label="Transport Allowance"
                    value={
                      salaryValues.transportAllowance
                    }
                  />

                  <BreakdownCard
                    label="Medical Allowance"
                    value={
                      salaryValues.medicalAllowance
                    }
                  />

                  <BreakdownCard
                    label="Other Allowance"
                    value={salaryValues.otherAllowance}
                  />

                  <BreakdownCard
                    label="Deductions"
                    value={salaryValues.deductions}
                    isDeduction
                  />
                </div>

                <div className="mt-5 flex flex-wrap justify-between gap-4 rounded-xl bg-slate-900 p-5 text-white">
                  <div>
                    <p className="text-sm text-slate-300">
                      Total Allowances
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {formatCurrency(
                        salaryValues.housingAllowance +
                          salaryValues.transportAllowance +
                          salaryValues.medicalAllowance +
                          salaryValues.otherAllowance
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-300">
                      Net Monthly Wage
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {formatCurrency(monthlyNet)}
                    </p>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <EmptyState
              title="No salary structure found"
              description="This employee does not have a salary structure yet. Click Add Salary to create one."
            />
          )}

          {isEditing && (
            <section className="mb-6 rounded-2xl border border-sky-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-sky-600">
                    Salary Revision
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {currentSalary
                      ? "Create Revised Salary Structure"
                      : "Create Salary Structure"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    The existing record remains in salary
                    history.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCancelEditing}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <FontAwesomeIcon icon={faRotateLeft} />
                  Cancel
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
              >
                <SalaryInput
                  label="Basic Salary"
                  name="basicSalary"
                  value={formData.basicSalary}
                  onChange={handleInputChange}
                  required
                />

                <SalaryInput
                  label="House Rent Allowance"
                  name="housingAllowance"
                  value={formData.housingAllowance}
                  onChange={handleInputChange}
                />

                <SalaryInput
                  label="Transport Allowance"
                  name="transportAllowance"
                  value={formData.transportAllowance}
                  onChange={handleInputChange}
                />

                <SalaryInput
                  label="Medical Allowance"
                  name="medicalAllowance"
                  value={formData.medicalAllowance}
                  onChange={handleInputChange}
                />

                <SalaryInput
                  label="Other Allowance"
                  name="otherAllowance"
                  value={formData.otherAllowance}
                  onChange={handleInputChange}
                />

                <SalaryInput
                  label="Deductions"
                  name="deductions"
                  value={formData.deductions}
                  onChange={handleInputChange}
                />

                <div>
                  <label
                    htmlFor="effectiveFrom"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Effective From
                  </label>

                  <input
                    id="effectiveFrom"
                    name="effectiveFrom"
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-end md:col-span-2 xl:col-span-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving
                      ? "Saving Salary..."
                      : "Save Salary Structure"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {salaryHistory.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Salary History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Previous and current salary structures.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">
                        Effective From
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Effective To
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Basic Salary
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Allowances
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Deductions
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Net Monthly
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {salaryHistory.map(
                      (salary, index) => {
                        const values =
                          normalizeSalary(salary);

                        const gross =
                          values.basicSalary +
                          values.housingAllowance +
                          values.transportAllowance +
                          values.medicalAllowance +
                          values.otherAllowance;

                        const net =
                          gross - values.deductions;

                        const effectiveTo = getField(
                          salary,
                          "effectiveTo",
                          "effective_to"
                        );

                        const salaryId =
                          salary.id ||
                          `${getField(
                            salary,
                            "effectiveFrom",
                            "effective_from"
                          )}-${index}`;

                        return (
                          <tr key={salaryId}>
                            <td className="whitespace-nowrap px-5 py-4">
                              {formatDate(
                                getField(
                                  salary,
                                  "effectiveFrom",
                                  "effective_from"
                                )
                              )}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              {effectiveTo
                                ? formatDate(effectiveTo)
                                : "—"}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                              {formatCurrency(
                                values.basicSalary
                              )}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              {formatCurrency(
                                values.housingAllowance +
                                  values.transportAllowance +
                                  values.medicalAllowance +
                                  values.otherAllowance
                              )}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              {formatCurrency(
                                values.deductions
                              )}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                              {formatCurrency(net)}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  !effectiveTo
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {!effectiveTo
                                  ? "Current"
                                  : "Previous"}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <FontAwesomeIcon icon={icon} />
        </div>

        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-xl font-bold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </article>
  );
}

function BreakdownCard({
  label,
  value,
  isDeduction = false,
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-lg font-bold ${
          isDeduction
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {isDeduction && Number(value) > 0
          ? `- ${formatCurrency(value)}`
          : formatCurrency(value)}
      </p>
    </article>
  );
}

function SalaryInput({
  label,
  name,
  value,
  onChange,
  required = false,
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
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-500"
      />
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-2 text-slate-500">
        {description}
      </p>
    </section>
  );
}

function normalizeSalary(salary) {
  if (!salary) {
    return {
      basicSalary: 0,
      housingAllowance: 0,
      transportAllowance: 0,
      medicalAllowance: 0,
      otherAllowance: 0,
      deductions: 0,
    };
  }

  return {
    basicSalary: toNumber(
      getField(
        salary,
        "basicSalary",
        "basic_salary"
      )
    ),

    housingAllowance: toNumber(
      getField(
        salary,
        "housingAllowance",
        "housing_allowance"
      )
    ),

    transportAllowance: toNumber(
      getField(
        salary,
        "transportAllowance",
        "transport_allowance"
      )
    ),

    medicalAllowance: toNumber(
      getField(
        salary,
        "medicalAllowance",
        "medical_allowance"
      )
    ),

    otherAllowance: toNumber(
      getField(
        salary,
        "otherAllowance",
        "other_allowance"
      )
    ),

    deductions: toNumber(
      getField(
        salary,
        "deductions",
        "deductions"
      )
    ),
  };
}

function getField(object, camelCaseKey, snakeCaseKey) {
  if (!object) {
    return null;
  }

  return (
    object[camelCaseKey] ??
    object[snakeCaseKey] ??
    null
  );
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function getDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function getTodayDateInput() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [
      part.type,
      part.value,
    ])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export default AdminSalaries;