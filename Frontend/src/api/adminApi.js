const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function adminRequest(path, token, options = {}) {
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
      data.message || "Unable to process admin request"
    );
  }

  return data;
}

export function getAllEmployees(token) {
  return adminRequest("/api/admin/employees", token);
}

export function getEmployeeById(employeeId, token) {
  return adminRequest(
    `/api/admin/employees/${employeeId}`,
    token
  );
}

export function createEmployee(employeeData, token) {
  return adminRequest("/api/employees", token, {
    method: "POST",
    body: JSON.stringify(employeeData),
  });
}

export function getAllAttendance(token) {
  return adminRequest("/api/admin/attendance", token);
}

export function getAllLeaveRequests(token) {
  return adminRequest("/api/admin/leaves", token);
}

export function updateLeaveStatus(
  leaveRequestId,
  reviewData,
  token
) {
  return adminRequest(
    `/api/admin/leaves/${leaveRequestId}/status`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(reviewData),
    }
  );
}

export function getEmployeeSalaryHistory(employeeId, token) {
  return adminRequest(
    `/api/admin/salaries/${employeeId}`,
    token
  );
}

export function createSalaryStructure(
  employeeId,
  salaryData,
  token
) {
  return adminRequest(
    `/api/admin/salaries/${employeeId}`,
    token,
    {
      method: "POST",
      body: JSON.stringify(salaryData),
    }
  );
}