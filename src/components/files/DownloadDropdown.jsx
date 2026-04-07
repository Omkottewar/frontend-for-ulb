import React, { useEffect, useRef, useState } from "react";
import { getAttachments, downloadAttachment } from "../../utils/db";

const DownloadDropdown = ({ fileNumber, onClose }) => {
  const ref = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAttachments(fileNumber)
      .then(setAttachments)
      .catch(() => setAttachments([]))
      .finally(() => setLoading(false));
  }, [fileNumber]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1.5 min-w-[220px]"
    >
      {loading ? (
        <p className="text-xs text-gray-400 px-4 py-3">Loading...</p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-gray-400 px-4 py-3">No attachments</p>
      ) : (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase px-3 pt-1 pb-1.5">
            Download Attachments
          </p>

          {attachments.map((att, i) => (
            <button
              key={i}
              onClick={() => {
                downloadAttachment(att);
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left"
            >
              <span className="text-xs text-gray-400 uppercase w-8">
                {att.name.split(".").pop()}
              </span>

              <span className="text-sm text-gray-700 truncate">
                {att.name}
              </span>
            </button>
          ))}
        </>
      )}
    </div>
  );
};

export default DownloadDropdown;