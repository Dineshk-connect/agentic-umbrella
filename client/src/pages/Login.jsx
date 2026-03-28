import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (preset) => {
    setEmail(preset.email);
    setPassword(preset.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Agentic Umbrella</h1>
          <p className="text-gray-500 text-sm mt-1">
            Contractor Payroll Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Quick login buttons for demo/portfolio */}
        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-gray-500 text-center mb-3">
            Quick login for demo
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: "Agency",
                email: "alice@agency.com",
                password: "password123",
                color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
              },
              {
                label: "Contractor",
                email: "charlie@contractor.com",
                password: "password123",
                color: "bg-teal-50 text-teal-700 hover:bg-teal-100",
              },
              {
                label: "Umbrella",
                email: "bob@umbrella.com",
                password: "password123",
                color: "bg-purple-50 text-purple-700 hover:bg-purple-100",
              },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => quickLogin(p)}
                className={`text-xs font-medium py-2 rounded-lg transition ${p.color}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {/* Register section */}
        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-gray-500 text-center mb-3">
            New to the platform?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: "Agency",
                path: "/register/agency",
                color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
              },
              {
                label: "Contractor",
                path: "/register/contractor",
                color: "bg-teal-50 text-teal-700 hover:bg-teal-100",
              },
              {
                label: "Umbrella",
                path: "/register/umbrella",
                color: "bg-purple-50 text-purple-700 hover:bg-purple-100",
              },
            ].map((r) => (
              <Link
                key={r.label}
                to={r.path}
                className={`text-xs font-medium py-2 rounded-lg transition text-center ${r.color}`}
              >
                Join as {r.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
