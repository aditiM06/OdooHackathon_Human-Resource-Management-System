const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function employeeRequest(
  path,
  token,
  options = {}
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to process employee request"
    );
  }

  return data;
}

export function getEmployeeProfile(token) {
  return employeeRequest("/api/employee/profile", token);
}

export function getEmployeeAttendance(token) {
  return employeeRequest("/api/employee/attendance", token);
}

export function checkInEmployee(token) {
  return employeeRequest(
    "/api/employee/attendance/check-in",
    token,
    {
      method: "POST",
    }
  );
}

export function checkOutEmployee(token) {
  return employeeRequest(
    "/api/employee/attendance/check-out",
    token,
    {
      method: "POST",
    }
  );
}

export function getEmployeeLeaves(token) {
  return employeeRequest("/api/employee/leaves", token);
}

export function getEmployeeSalary(token) {
  return employeeRequest("/api/employee/salary", token);
}