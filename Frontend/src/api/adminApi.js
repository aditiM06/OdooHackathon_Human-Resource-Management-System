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

  const data = await response.json();

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

export function getAllAttendance(token) {
  return adminRequest("/api/admin/attendance", token);
}

export function getAllLeaveRequests(token) {
  return adminRequest("/api/admin/leaves", token);
}