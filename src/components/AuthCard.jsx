const AuthCard = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center px-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-[#1a2744] tracking-tight">ULB Audit Management</h1>
        <p className="text-sm text-gray-500 mt-1">Internal Audit &amp; Pre-Post Audit System</p>
      </div>

      <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">{title}</h2>
        <p className="text-sm text-gray-400 mb-6">{subtitle}</p>
        {children}
      </div>
    </div>
  );
};

export default AuthCard;