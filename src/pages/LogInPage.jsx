import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { loginUser, setSession } from "../utils/auth";

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await loginUser(form);

    setSession(res.token, res.user);

    navigate("/dashboard");

  } catch (err) {
    setError(err.message);
  }
};

  return (
    <AuthCard title="Sign In" subtitle="Enter your credentials to access the system">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email" name="email" value={form.email} onChange={handleChange}
            placeholder="email@test.com"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password" name="password" value={form.password} onChange={handleChange}
            placeholder="••••••••"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-[#1a2744] hover:bg-[#243460] text-white font-medium py-2.5 rounded-lg text-sm transition-colors duration-200"
        >
          Sign In
        </button>

        <p className="text-center text-sm text-gray-500 pt-1">
          Don't have an account?{" "}
          <Link to="/signup" className="text-[#1a2744] font-medium hover:underline">Sign Up</Link>
        </p>
      </div>
    </AuthCard>
  );
};

export default LoginPage;