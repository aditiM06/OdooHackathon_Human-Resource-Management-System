import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faIndianRupeeSign,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";

import { getEmployeeSalary } from "../../api/employeeApi";
import { getAuthToken } from "../../utils/auth";

function EmployeeSalary() {
  const token = getAuthToken();

  const [currentSalary, setCurrentSalary] =
    useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSalary() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getEmployeeSalary(token);

        setCurrentSalary(data.currentSalary || null);

        setSalaryHistory(
          data.salaryHistory ||
            data.history ||
            (data.currentSalary
              ? [data.currentSalary]
              : [])
        );
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadSalary();
  }, [token]);

  const salary = useMemo(
    () => normalizeSalary(currentSalary),
    [currentSalary]
  );

  const totalAllowances =
    salary.housingAllowance +
    salary.transportAllowance +
    salary.medicalAllowance +
    salary.otherAllowance;

  const monthlyGross =
    salary.basicSalary + totalAllowances;

  const monthlyNet =
    monthlyGross - salary.deductions;

  const yearlyNet = monthlyNet * 12;

  if (isLoading) {
    return (
      <main className="p-6 lg:p-8">
        <p className="text-slate-500">
          Loading salary information...
        </p>
      </main>
    );
  }

  return (
    <main className="p-6 lg:p-8">
      <section className="mb-8">
        <p className="text-sm font-semibold text-sky-600">
          Compensation
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          My Salary
        </h1>

        <p className="mt-2 text-slate-500">
          View your current salary structure and allowance
          breakdown.
        </p>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!currentSalary ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Salary not assigned
          </h2>

          <p className="mt-2 text-slate-500">
            Your salary structure has not been added yet.
          </p>
        </section>
      ) : (
        <>
          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={faWallet}
              label="Monthly Gross"
              value={formatCurrency(monthlyGross)}
            />

            <SummaryCard
              icon={faIndianRupeeSign}
              label="Monthly Net"
              value={formatCurrency(monthlyNet)}
            />

            <SummaryCard
              icon={faIndianRupeeSign}
              label="Yearly Net"
              value={formatCurrency(yearlyNet)}
            />

            <SummaryCard
              icon={faWallet}
              label="Total Allowances"
              value={formatCurrency(totalAllowances)}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-sm font-semibold text-sky-600">
                Current Structure
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Salary Breakdown
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <BreakdownCard
                label="Basic Salary"
                value={salary.basicSalary}
              />

              <BreakdownCard
                label="House Rent Allowance"
                value={salary.housingAllowance}
              />

              <BreakdownCard
                label="Transport Allowance"
                value={salary.transportAllowance}
              />

              <BreakdownCard
                label="Medical Allowance"
                value={salary.medicalAllowance}
              />

              <BreakdownCard
                label="Other Allowance"
                value={salary.otherAllowance}
              />

              <BreakdownCard
                label="Deductions"
                value={salary.deductions}
                isDeduction
              />
            </div>

            <div className="mt-5 flex flex-wrap justify-between gap-4 rounded-xl bg-sky-600 p-5 text-white">
              <div>
                <p className="text-sm text-sky-100">
                  Effective From
                </p>

                <p className="mt-1 text-lg font-bold">
                  {formatDate(
                    currentSalary.effectiveFrom ??
                      currentSalary.effective_from
                  )}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-sky-100">
                  Net Monthly Salary
                </p>

                <p className="mt-1 text-xl font-bold">
                  {formatCurrency(monthlyNet)}
                </p>
              </div>
            </div>
          </section>

          {salaryHistory.length > 1 && (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Salary History
                </h2>
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
                        Net Monthly
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {salaryHistory.map(
                      (record, index) => {
                        const values =
                          normalizeSalary(record);

                        const net =
                          values.basicSalary +
                          values.housingAllowance +
                          values.transportAllowance +
                          values.medicalAllowance +
                          values.otherAllowance -
                          values.deductions;

                        return (
                          <tr
                            key={
                              record.id ||
                              `${record.effectiveFrom}-${index}`
                            }
                          >
                            <td className="px-5 py-4">
                              {formatDate(
                                record.effectiveFrom ??
                                  record.effective_from
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {formatDate(
                                record.effectiveTo ??
                                  record.effective_to
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {formatCurrency(
                                values.basicSalary
                              )}
                            </td>

                            <td className="px-5 py-4 font-semibold text-slate-900">
                              {formatCurrency(net)}
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

function SummaryCard({ icon, label, value }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
        <FontAwesomeIcon icon={icon} />
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
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
    basicSalary: Number(
      salary.basicSalary ?? salary.basic_salary ?? 0
    ),
    housingAllowance: Number(
      salary.housingAllowance ??
        salary.housing_allowance ??
        0
    ),
    transportAllowance: Number(
      salary.transportAllowance ??
        salary.transport_allowance ??
        0
    ),
    medicalAllowance: Number(
      salary.medicalAllowance ??
        salary.medical_allowance ??
        0
    ),
    otherAllowance: Number(
      salary.otherAllowance ??
        salary.other_allowance ??
        0
    ),
    deductions: Number(salary.deductions ?? 0),
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
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

export default EmployeeSalary;