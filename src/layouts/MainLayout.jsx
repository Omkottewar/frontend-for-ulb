// MainLayout.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FilesPage from "../pages/FilesPage";
import AttendancePage from "../pages/AttendancePage";
import ExpensesPage from "../pages/ExpensesPage";
import WorkLogPage from "../pages/WorkLogPage";
import TasksPage from "../pages/TasksPage";
import FieldExecDashboardPage from "../pages/FieldExecDashboardPage";
import QueriesPage from "../pages/QueriesPage";
import PreAuditPage from "../pages/PreAuditPage";
import ResourceAllocationPage from "../pages/ResourceAllocationPage";
import AccessControlPage from "../pages/AccessControlPage";
import PayrollPage from "../pages/PayrollPage";
import ExpenseApprovalPage from "../pages/ExpenseApprovalPage";
import MasterCreationPage from "../pages/MasterCreationPage";
import { getSession, clearSession } from "../utils/auth";
import { FilesProvider } from "../context/FilesContext";

const ACTIVITY_LOG_CHILDREN = ["Attendance", "Work Log", "Expenses", "Tasks"];
const ADMIN_CHILDREN = ["Resource Allocation", "Access Control", "Payroll", "Expense Approvals", "Master Creation"];
const OVERVIEW_CHILDREN = ["Queries"];

const MainLayout = () => {
  const [active, setActive] = useState("Dashboard");
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const navigate = useNavigate();
  const session = getSession();
  const isFieldOpsStaff    = session?.role === "Non-ULB Field Executive" || session?.role === "ULB Field Executive";
  const isCA               = session?.role === "Chartered Accountant";
  const isStateController  = session?.role === "State Controller";

  const handleSignOut = () => {
    clearSession();
    navigate("/login");
  };

  const handleNavClick = (item) => {
    setActive(item);
    if (!ACTIVITY_LOG_CHILDREN.includes(item)) setActivityLogOpen(false);
    if (!ADMIN_CHILDREN.includes(item)) setAdminOpen(false);
    if (!OVERVIEW_CHILDREN.includes(item)) setOverviewOpen(false);
  };

  const handleActivityLogToggle = () => {
    setActivityLogOpen((prev) => !prev);
  };

  const handleAdminToggle = () => {
    setAdminOpen((prev) => !prev);
  };

  const handleOverviewToggle = () => {
    setOverviewOpen((prev) => !prev);
  };

  const initials = session?.name
    ? session.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";
 
  const renderContent = () => {
    if (active === "Files") return <FilesPage />;
    if (active === "Queries") return <QueriesPage />;
    if (active === "Pre-Audit") return <PreAuditPage />;
    if (active === "Attendance") return <AttendancePage />;
    if (active === "Expenses") return <ExpensesPage />;
    if (active === "Work Log") return <WorkLogPage />;
    if (active === "Tasks") return <TasksPage />;
    if (active === "Resource Allocation") return <ResourceAllocationPage />;
    if (active === "Access Control") return <AccessControlPage />;
    if (active === "Payroll") return <PayrollPage />;
    if (active === "Expense Approvals") return <ExpenseApprovalPage />;
    if (active === "Master Creation") return <MasterCreationPage />;
    if (active === "Dashboard" && isFieldOpsStaff) return <FieldExecDashboardPage onNavigate={setActive} />;
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-4xl font-bold text-gray-300 tracking-tight">{active}</h1>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a2744] flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-amber-400 flex items-center justify-center">
              <span className="text-[#1a2744] font-bold text-xs">U</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">ULB Audit System</p>
              <p className="text-white/50 text-xs">BNM Chhattisgarh</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {["Dashboard", "Files", "Pre-Audit", "Post-Audit"].map((item) => (
            <button
              key={item}
              onClick={() => handleNavClick(item)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                active === item
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}

          {/* Overview */}
          <div>
            <button
              onClick={handleOverviewToggle}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                overviewOpen || OVERVIEW_CHILDREN.includes(active)
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>Overview</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-3.5 h-3.5 transition-transform duration-200 ${overviewOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {overviewOpen && (
              <div className="mt-1 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                {OVERVIEW_CHILDREN.map((child) => (
                  <button
                    key={child}
                    onClick={() => handleNavClick(child)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                      active === child
                        ? "bg-white/15 text-white font-medium"
                        : "text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {child}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Admin — State Controller only */}
          {isStateController && (
            <div>
              <button
                onClick={handleAdminToggle}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                  adminOpen || ADMIN_CHILDREN.includes(active)
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>Admin</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${adminOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {adminOpen && (
                <div className="mt-1 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                  {ADMIN_CHILDREN.map((child) => (
                    <button
                      key={child}
                      onClick={() => handleNavClick(child)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                        active === child
                          ? "bg-white/15 text-white font-medium"
                          : "text-white/50 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {child}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity Log — Field Operations Staff only */}
          {isFieldOpsStaff && (
            <div>
              <button
                onClick={handleActivityLogToggle}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                  activityLogOpen || ACTIVITY_LOG_CHILDREN.includes(active)
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>Activity Log</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${activityLogOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {activityLogOpen && (
                <div className="mt-1 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                  {ACTIVITY_LOG_CHILDREN.map((child) => (
                    <button
                      key={child}
                      onClick={() => handleNavClick(child)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                        active === child
                          ? "bg-white/15 text-white font-medium"
                          : "text-white/50 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {child}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-[#1a2744] font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium leading-tight truncate">{session?.name || "User"}</p>
              <p className="text-white/50 text-xs truncate">{session?.role || ""}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-white/40 hover:text-white text-xs transition-colors ml-2 shrink-0"
            title="Sign out"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Right side */}
      <FilesProvider>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            Raipur
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </main>
      </div>
      </FilesProvider>
    </div>
  );
};

export default MainLayout;
