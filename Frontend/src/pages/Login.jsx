import { useState } from "react";
import { Navigate, useNavigate } from "react-router";

import { loginUser } from "../api/authApi";
import {
  getCurrentUser,
  saveAuthSession,
} from "../utils/auth";

function Login() {
  const navigate = useNavigate();

  const existingUser = getCurrentUser();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (existingUser) {
    if (existingUser.mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }

    return (
      <Navigate
        to={
          existingUser.role === "ADMIN" ||
          existingUser.role === "HR"
            ? "/admin/dashboard"
            : "/employee/dashboard"
        }
        replace
      />
    );
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

    if (!formData.identifier.trim() || !formData.password) {
      setError("Login ID/email and password are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const data = await loginUser({
        identifier: formData.identifier.trim(),
        password: formData.password,
      });

      saveAuthSession(data.token, data.user);

      if (data.user.mustChangePassword) {
        navigate("/change-password", { replace: true });
        return;
      }

      if (
        data.user.role === "ADMIN" ||
        data.user.role === "HR"
      ) {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      navigate("/employee/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-400">
            HRMS
          </p>

          <h1 className="text-3xl font-bold text-white">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Sign in using your employee ID or email.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-200"
              htmlFor="identifier"
            >
              Login ID or email
            </label>

            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              value={formData.identifier}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20"
              placeholder="OIJODO20260001"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-200"
              htmlFor="password"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-fuchsia-600 px-4 py-3 font-semibold text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New account registration will be added later.
        </p>
      </section>
    </main>
  );
}

export default Login;