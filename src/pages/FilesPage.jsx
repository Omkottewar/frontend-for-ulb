import { useState, useMemo, useEffect } from "react";
import { getFiles } from "../services/filesService";

import NewFilePage from "./NewFilePage";
import MasterDataPage from "./MasterDataPage";
import FileDetailPage from "./FileDetailPage";
import FilesTable from "../components/files/FilesTable";
import FilesFilters from "../components/files/FilesFilters";

import { getSession } from "../utils/auth";
import { canAccessFile } from "../utils/accessControl";

const FilesPage = () => {

  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true); // add this

  const [mode, setMode] = useState("list");
  const [pendingFile, setPendingFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [finalizedFiles, setFinalizedFiles] = useState(new Set());

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    risk: "",
    ulb: "",
  });

  /* ───────────── Fetch Files ───────────── */

  useEffect(() => {

    const loadFiles = async () => {
      try {
        setFilesLoading(true); // add this
        const data = await getFiles();
        console.log("Fetched files:", data);
        setFiles(data.data);
      } catch (err) {
        console.error("Failed to load files", err);
      } finally {
        setFilesLoading(false); // add this
      }
    };

    loadFiles();

  }, []);

  /* ───────────── Accessible Files ───────────── */

  const accessibleFiles = useMemo(
    () => files.filter(canAccessFile),
    [files]
  );

  const allULBs = useMemo(
    () => [...new Set(accessibleFiles.map((f) => f.ulb).filter(Boolean))],
    [accessibleFiles]
  );

  /* ───────────── Filtering ───────────── */

  const filteredFiles = useMemo(() => {
    
    const q = filters.search.toLowerCase();

    return accessibleFiles.filter((f) => {

      const matchSearch =
        !q ||
        f.fileNumber?.toLowerCase().includes(q) ||
        f.fileTitle?.toLowerCase().includes(q) ||
        f.ulb?.toLowerCase().includes(q);

      return (
        matchSearch &&
        (!filters.status || f.status === filters.status) &&
        (!filters.risk || f.riskFlag === filters.risk) &&
        (!filters.ulb || f.ulb === filters.ulb)
      );

    });

  }, [accessibleFiles, filters]);

  /* ───────────── File Creation ───────────── */

  const handleCreateFile = (record) => {

    setFiles((prev) => [record, ...prev]);

    setPendingFile(record);
    setMode("masterData");

  };

  /* ───────────── Checklist Builder ───────────── */

  const buildPhase1Checklist = () => {

    const session = getSession();

    return {
      id: "CHK-001",
      phase: 1,
      checkerName: session?.name || "",
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toLocaleDateString("en-IN"),
      createdBy: session?.name || "",
      versionHistory: [],
    };

  };

  const finalizePendingFile = (updated) => {

    setFiles((prev) =>
      prev.map((f) =>
        f.fileNumber === updated.fileNumber ? updated : f
      )
    );

    setPendingFile(null);
    setSelectedFile(updated);
    setMode("detail");

  };

  /* ───────────── Page Modes ───────────── */

  if (mode === "new") {
    return (
      <NewFilePage
        onBack={() => setMode("list")}
        onSubmit={handleCreateFile}
      />
    );
  }

  if (mode === "masterData" && pendingFile) {
    return (
      <MasterDataPage
        file={pendingFile}
        onBack={() =>
          finalizePendingFile({
            ...pendingFile,
            checklists: [buildPhase1Checklist()],
          })
        }
        onContinue={(masterData) =>
          finalizePendingFile({
            ...pendingFile,
            masterData,
            checklists: [buildPhase1Checklist()],
          })
        }
      />
    );
  }

  if (mode === "detail" && selectedFile) {
    return (
      <FileDetailPage
        file={selectedFile}
        onBack={() => setMode("list")}
        onFileUpdated={() => {}}
        onFileFinalized={(fileNumber) =>
          setFinalizedFiles((prev) => new Set([...prev, fileNumber]))
        }
      />
    );
  }

  /* ───────────── File Index Page ───────────── */

  return (
    <div className="flex flex-col h-full">

      <div className="flex items-start justify-between mb-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            File Index
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            All audit files across ULBs
          </p>
        </div>

        <button
          onClick={() => setMode("new")}
          className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-medium px-4 py-2.5 rounded-lg"
        >
          <span className="text-lg">+</span>
          New File
        </button>
        
      </div>

      <FilesFilters
        filters={filters}
        setFilters={setFilters}
        allULBs={allULBs}
      />

      <FilesTable
        files={filteredFiles}
        filesLoading={filesLoading} // add this
        finalizedFiles={finalizedFiles}
        onOpenFile={(file) => {
          setSelectedFile(file);
          setMode("detail");
        }}
      />
      
    </div>
  );
};

export default FilesPage;