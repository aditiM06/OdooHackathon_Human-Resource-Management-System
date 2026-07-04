import { useState } from "react";
import { Navigate, useNavigate } from "react-router";

import { changeUserPassword } from "../api/authApi";
import {
  getAuthToken,
  getCurrentUser,
  saveAuthSession,
} from "../utils/auth";

function ChangePassword() {
  const navigate = useNavigate();

  const token = getAuthToken();
  const user = getCurrentUser();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !formData.currentPassword ||
      !formData.newPassword ||
      !formData.confirmPassword
    ) {
      setError("Complete all password fields");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await changeUserPassword(
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        token
      );

      const updatedUser = {
        ...user,
        mustChangePassword: false,
      };

      saveAuthSession(token, updatedUser);

      navigate(
        user.role === "ADMIN" || user.role === "HR"
          ? "/admin/dashboard"
          : "/employee/dashboard",
        { replace: true }
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-2xl font-bold text-white">
          Change temporary password
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Create a new password before continuing.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {[
            ["currentPassword", "Current password"],
            ["newPassword", "New password"],
            ["confirmPassword", "Confirm new password"],
          ].map(([name, label]) => (
            <div key={name}>
              <label
                htmlFor={name}
                className="mb-2 block text-sm text-slate-200"
              >
                {label}
              </label>

              <input
                id={name}
                name={name}
                type="password"
                value={formData[name]}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-500"
              />
            </div>
          ))}

          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-fuchsia-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting
              ? "Updating password..."
              : "Change password"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ChangePassword;