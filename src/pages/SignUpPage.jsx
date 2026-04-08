import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { registerUser, setSession } from "../utils/auth";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", role: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return setError("Full name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (!form.role) return setError("Please select a role.");

    try {
      await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        roleId: form.role
      });

      // Clear everything
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to login
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition";

  return (
    <AuthCard title="Create Account" subtitle="Register to access the audit system">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@test.com" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="••••••••" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
            <option value="" disabled>Select your role</option>

            <option value="11111111-1111-1111-1111-000000000002">
              State Controller
            </option>

            <option value="11111111-1111-1111-1111-000000000003">
              Team Lead
            </option>

            <option value="11111111-1111-1111-1111-000000000004">
              Chartered Accountant
            </option>

            <option value="11111111-1111-1111-1111-000000000006">
              ULB Executive
            </option>

            <option value="11111111-1111-1111-1111-000000000005">
              Non ULB Executive
            </option>

          </select>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-[#1a2744] hover:bg-[#243460] text-white font-medium py-2.5 rounded-lg text-sm transition-colors duration-200"
        >
          Create Account
        </button>

        <p className="text-center text-sm text-gray-500 pt-1">
          Already have an account?{" "}
          <Link to="/login" className="text-[#1a2744] font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </AuthCard>
  );
};

export default SignUpPage;