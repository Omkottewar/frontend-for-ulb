import { useState } from "react";

export default function OtpModal({ onConfirm, onCancel }) {
  const [observations, setObservations] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  function handleConfirm() {
    // TODO: replace with real OTP API call
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit code.");
      return;
    }
    onConfirm(observations.trim());
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">Finalize File</h2>
            <p className="text-sm text-gray-400 mt-1">
              This action is irreversible. All tabs will become read-only.
            </p>
          </div>
        </div>

        {/* CA Observations */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            CA Observations
            <span className="ml-1.5 font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Add your audit observations, remarks, or findings before finalizing this file..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744] resize-none transition-colors placeholder-gray-300"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-300 font-medium">CONFIRM WITH OTP</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* OTP */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 text-center">
            Enter 6-digit OTP to confirm
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={e => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
            placeholder="• • • • • •"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#1a2744] transition-colors"
          />
          {error && (
            <p className="text-xs text-red-500 text-center mt-1.5">{error}</p>
          )}
        </div>

        <button
          onClick={handleConfirm}
          className="w-full bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-semibold py-3 rounded-xl transition-colors"
        >
          Confirm Finalization
        </button>

        <button
          onClick={onCancel}
          className="text-sm text-gray-400 hover:text-gray-600 underline transition-colors text-center -mt-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
