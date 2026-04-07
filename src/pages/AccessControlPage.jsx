import { useState } from "react";
import {
  DUMMY_ALLOCATION_USERS,
  DUMMY_TEAMS,
  DUMMY_ULB_ASSIGNMENTS,
  DUMMY_ULBS,
} from "../utils/dummyData";
import { useFiles } from "../context/FilesContext";
import {
  getUlbIdByName,
  getUserAssignedUlbIds,
  getUserTeamIds,
} from "../utils/accessControl";

// ── Constants ──────────────────────────────────────────────────────
const ROLE_COLORS = {
  "Team Lead":               "bg-blue-100 text-blue-700",
  "Chartered Accountant":    "bg-purple-100 text-purple-700",
  "ULB Field Executive":     "bg-green-100 text-green-700",
  "Non-ULB Field Executive": "bg-orange-100 text-orange-600",
};

const SHORT_ROLE = {
  "Team Lead":               "TL",
  "Chartered Accountant":    "CA",
  "ULB Field Executive":     "FE",
  "Non-ULB Field Executive": "NFE",
};

const CONTRACT_STYLES = {
  Works:       "bg-blue-50 text-blue-600",
  Supply:      "bg-cyan-50 text-cyan-600",
  Service:     "bg-violet-50 text-violet-600",
  Consultancy: "bg-amber-50 text-amber-600",
};

// ── Small helpers ──────────────────────────────────────────────────
function ini(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAssignedUlbNames(userId) {
  const ulbIds = getUserAssignedUlbIds(userId);
  return ulbIds.map((id) => DUMMY_ULBS.find((u) => u.id === id)?.name).filter(Boolean);
}

function getTeamAssignedUlbNames(teamId) {
  const ulbIds = Object.entries(DUMMY_ULB_ASSIGNMENTS)
    .filter(([, a]) => a.teams.includes(teamId))
    .map(([id]) => id);
  return ulbIds.map((id) => DUMMY_ULBS.find((u) => u.id === id)?.name).filter(Boolean);
}

// Files accessible to a user (by ULB assignment — ignoring deny list for display purposes)
function getFilesForUser(userId, files) {
  const ulbIds = getUserAssignedUlbIds(userId);
  return files.filter((f) => {
    const ulbId = getUlbIdByName(f.ulb);
    return ulbId && ulbIds.includes(ulbId);
  });
}

// Files accessible to a team (by ULB assignment)
function getFilesForTeam(teamId, files) {
  const ulbIds = Object.entries(DUMMY_ULB_ASSIGNMENTS)
    .filter(([, a]) => a.teams.includes(teamId))
    .map(([id]) => id);
  return files.filter((f) => {
    const ulbId = getUlbIdByName(f.ulb);
    return ulbId && ulbIds.includes(ulbId);
  });
}

// Users assigned to a given ULB
function getUsersForUlb(ulbId) {
  const assignment = DUMMY_ULB_ASSIGNMENTS[ulbId];
  if (!assignment) return [];
  const userSet = new Map();
  // From teams
  assignment.teams.forEach((tid) => {
    const team = DUMMY_TEAMS.find((t) => t.id === tid);
    team?.members.forEach((m) => userSet.set(m.id, m));
  });
  // From individuals
  assignment.individuals.forEach((ind) => userSet.set(ind.id, ind));
  return Array.from(userSet.values());
}

// ── Reusable UI ────────────────────────────────────────────────────
function Avatar({ name, size = "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${sz} rounded-full bg-[#1a2744]/10 text-[#1a2744] font-bold flex items-center justify-center shrink-0`}>
      {ini(name)}
    </div>
  );
}

function RolePill({ role }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[role] || "bg-gray-100 text-gray-500"}`}>
      {SHORT_ROLE[role] || role}
    </span>
  );
}

function AccessBadge({ revoked }) {
  return revoked ? (
    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-600">Revoked</span>
  ) : (
    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-600">Access</span>
  );
}

function FileBadge({ revoked }) {
  return revoked ? (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-500">Restricted</span>
  ) : (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">Full Access</span>
  );
}

// ── By Person Tab ──────────────────────────────────────────────────
function ByPersonTab({ files, revokeAccess, restoreAccess }) {
  const [mode, setMode] = useState("users"); // "users" | "teams"
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const roles = [...new Set(DUMMY_ALLOCATION_USERS.map((u) => u.role))];

  const filteredUsers = DUMMY_ALLOCATION_USERS.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const filteredTeams = DUMMY_TEAMS.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = mode === "users"
    ? DUMMY_ALLOCATION_USERS.find((u) => u.id === selectedId)
    : null;
  const selectedTeam = mode === "teams"
    ? DUMMY_TEAMS.find((t) => t.id === selectedId)
    : null;

  // Compute user's file list with denied status
  const userFiles = selectedUser
    ? getFilesForUser(selectedUser.id, files).map((f) => ({
        ...f,
        isRevoked: f.deniedAccess?.userIds?.includes(selectedUser.id) ?? false,
        isTeamRevoked: getUserTeamIds(selectedUser.id).some((tid) =>
          f.deniedAccess?.teamIds?.includes(tid)
        ),
      }))
    : [];

  // Compute team's file list with denied status
  const teamFiles = selectedTeam
    ? getFilesForTeam(selectedTeam.id, files).map((f) => ({
        ...f,
        isRevoked: f.deniedAccess?.teamIds?.includes(selectedTeam.id) ?? false,
      }))
    : [];

  // Badge for user card: does this user have any denials?
  function userHasRestrictions(user) {
    return files.some((f) => f.deniedAccess?.userIds?.includes(user.id));
  }

  function teamHasRestrictions(team) {
    return files.some((f) => f.deniedAccess?.teamIds?.includes(team.id));
  }

  return (
    <div className="flex h-full gap-4">
      {/* Left panel */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        {/* Mode toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {["users", "teams"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setSelectedId(null); setSearch(""); setRoleFilter(""); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === m ? "bg-white text-[#1a2744] shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {m === "users" ? "Users" : "Teams"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white">
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder={mode === "users" ? "Search users..." : "Search teams..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm text-gray-700 outline-none w-full placeholder-gray-400"
          />
        </div>

        {/* Role filter — users only */}
        {mode === "users" && (
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setSelectedId(null); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white"
          >
            <option value="">All Roles</option>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {mode === "users" ? (
            filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No users found</p>
            ) : filteredUsers.map((u) => {
              const hasRestrictions = userHasRestrictions(u);
              const isSelected = selectedId === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors ${
                    isSelected
                      ? "bg-[#1a2744] border-[#1a2744]"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Avatar name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-gray-800"}`}>{u.name}</p>
                    <p className={`text-xs truncate ${isSelected ? "text-white/60" : "text-gray-400"}`}>{u.role}</p>
                  </div>
                  {hasRestrictions && !isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Has restrictions" />
                  )}
                </button>
              );
            })
          ) : (
            filteredTeams.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No teams found</p>
            ) : filteredTeams.map((t) => {
              const hasRestrictions = teamHasRestrictions(t);
              const isSelected = selectedId === t.id;
              const ulbNames = getTeamAssignedUlbNames(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors ${
                    isSelected
                      ? "bg-[#1a2744] border-[#1a2744]"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isSelected ? "bg-white/20 text-white" : "bg-[#1a2744]/10 text-[#1a2744]"
                  }`}>
                    {t.name.split(" ")[1]?.[0] || t.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-gray-800"}`}>{t.name}</p>
                    <p className={`text-xs truncate ${isSelected ? "text-white/60" : "text-gray-400"}`}>
                      {ulbNames[0] || "No ULB assigned"}
                    </p>
                  </div>
                  {hasRestrictions && !isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Has restrictions" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        {!selectedId ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-gray-400 p-8">
            <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-sm">Select a {mode === "users" ? "user" : "team"} to manage their file access</p>
          </div>
        ) : mode === "users" && selectedUser ? (
          <>
            {/* Sticky user header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <Avatar name={selectedUser.name} />
              <div>
                <p className="font-semibold text-gray-800">{selectedUser.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <RolePill role={selectedUser.role} />
                  {getAssignedUlbNames(selectedUser.id).map((n) => (
                    <span key={n} className="text-xs text-gray-400">{n}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable file list */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {userFiles.length === 0 ? (
                <p className="text-sm text-gray-400">This user is not assigned to any ULB, so they have no file access to manage.</p>
              ) : (
                <>
                  {/* Accessible files */}
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Files with Access
                      <span className="ml-1.5 text-gray-300 font-normal normal-case">
                        ({userFiles.filter((f) => !f.isRevoked && !f.isTeamRevoked).length})
                      </span>
                    </p>
                    <div className="space-y-1.5">
                      {userFiles.filter((f) => !f.isRevoked && !f.isTeamRevoked).map((f) => (
                        <div key={f.fileNumber} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{f.fileTitle}</p>
                            <p className="text-xs text-gray-400">{f.fileNumber} · {f.ulb}</p>
                          </div>
                          <button
                            onClick={() => revokeAccess(f.fileNumber, { userId: selectedUser.id })}
                            className="ml-3 shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                      {userFiles.filter((f) => !f.isRevoked && !f.isTeamRevoked).length === 0 && (
                        <p className="text-sm text-gray-400 italic">None</p>
                      )}
                    </div>
                  </div>

                  {/* Revoked files */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Access Revoked
                      <span className="ml-1.5 text-gray-300 font-normal normal-case">
                        ({userFiles.filter((f) => f.isRevoked || f.isTeamRevoked).length})
                      </span>
                    </p>
                    <div className="space-y-1.5">
                      {userFiles.filter((f) => f.isRevoked || f.isTeamRevoked).map((f) => (
                        <div key={f.fileNumber} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-red-100 bg-red-50/50">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{f.fileTitle}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-gray-400">{f.fileNumber}</p>
                              {f.isTeamRevoked && !f.isRevoked && (
                                <span className="text-xs text-amber-500">via team restriction</span>
                              )}
                            </div>
                          </div>
                          {f.isRevoked && (
                            <button
                              onClick={() => restoreAccess(f.fileNumber, { userId: selectedUser.id })}
                              className="ml-3 shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                            >
                              Restore
                            </button>
                          )}
                          {f.isTeamRevoked && !f.isRevoked && (
                            <span className="ml-3 shrink-0 text-xs text-gray-400 italic">Manage via Teams</span>
                          )}
                        </div>
                      ))}
                      {userFiles.filter((f) => f.isRevoked || f.isTeamRevoked).length === 0 && (
                        <p className="text-sm text-gray-400 italic">None</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : mode === "teams" && selectedTeam ? (
          <>
            {/* Sticky team header */}
            <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#1a2744]/10 text-[#1a2744] font-bold text-sm flex items-center justify-center shrink-0">
                {selectedTeam.name.split(" ")[1]?.[0] || selectedTeam.name[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{selectedTeam.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTeam.members.map((m) => (
                    <span key={m.id} className="text-xs text-gray-500 flex items-center gap-1">
                      {m.name} <RolePill role={m.role} />
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  ULB: {getTeamAssignedUlbNames(selectedTeam.id).join(", ") || "Not assigned"}
                </p>
              </div>
            </div>

            {/* Scrollable file list */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {teamFiles.length === 0 ? (
                <p className="text-sm text-gray-400">This team is not assigned to any ULB, so they have no file access to manage.</p>
              ) : (
                <>
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Files with Team Access
                      <span className="ml-1.5 text-gray-300 font-normal normal-case">
                        ({teamFiles.filter((f) => !f.isRevoked).length})
                      </span>
                    </p>
                    <div className="space-y-1.5">
                      {teamFiles.filter((f) => !f.isRevoked).map((f) => (
                        <div key={f.fileNumber} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{f.fileTitle}</p>
                            <p className="text-xs text-gray-400">{f.fileNumber} · {f.ulb}</p>
                          </div>
                          <button
                            onClick={() => revokeAccess(f.fileNumber, { teamId: selectedTeam.id })}
                            className="ml-3 shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                      {teamFiles.filter((f) => !f.isRevoked).length === 0 && (
                        <p className="text-sm text-gray-400 italic">None</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Team Access Revoked
                      <span className="ml-1.5 text-gray-300 font-normal normal-case">
                        ({teamFiles.filter((f) => f.isRevoked).length})
                      </span>
                    </p>
                    <div className="space-y-1.5">
                      {teamFiles.filter((f) => f.isRevoked).map((f) => (
                        <div key={f.fileNumber} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-red-100 bg-red-50/50">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{f.fileTitle}</p>
                            <p className="text-xs text-gray-400">{f.fileNumber}</p>
                          </div>
                          <button
                            onClick={() => restoreAccess(f.fileNumber, { teamId: selectedTeam.id })}
                            className="ml-3 shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                      {teamFiles.filter((f) => f.isRevoked).length === 0 && (
                        <p className="text-sm text-gray-400 italic">None</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ── By File / ULB Tab ──────────────────────────────────────────────
function ByFileTab({ files, revokeAccess, restoreAccess }) {
  const assignedUlbIds = Object.keys(DUMMY_ULB_ASSIGNMENTS);
  const assignedUlbs = DUMMY_ULBS.filter((u) => assignedUlbIds.includes(u.id));

  const [selectedUlbId, setSelectedUlbId] = useState(assignedUlbs[0]?.id || "");
  const [fileSearch, setFileSearch] = useState("");
  const [selectedFileNumber, setSelectedFileNumber] = useState(null);
  const [userSearch, setUserSearch] = useState("");

  const ulbFiles = files.filter((f) => getUlbIdByName(f.ulb) === selectedUlbId);

  const filteredFiles = ulbFiles.filter((f) => {
    const q = fileSearch.toLowerCase();
    return !q || f.fileNumber.toLowerCase().includes(q) || f.fileTitle?.toLowerCase().includes(q);
  });

  const selectedFile = ulbFiles.find((f) => f.fileNumber === selectedFileNumber) || null;

  const allUsersForUlb = getUsersForUlb(selectedUlbId);
  const allTeamsForUlb = (DUMMY_ULB_ASSIGNMENTS[selectedUlbId]?.teams || [])
    .map((tid) => DUMMY_TEAMS.find((t) => t.id === tid))
    .filter(Boolean);

  const uq = userSearch.toLowerCase();
  const usersForUlb = uq
    ? allUsersForUlb.filter((u) =>
        u.name.toLowerCase().includes(uq) || u.id.toLowerCase().includes(uq)
      )
    : allUsersForUlb;
  const teamsForUlb = uq
    ? allTeamsForUlb.filter((t) =>
        t.name.toLowerCase().includes(uq) ||
        t.members.some((m) => m.name.toLowerCase().includes(uq))
      )
    : allTeamsForUlb;

  function isUserRevoked(user, file) {
    return file?.deniedAccess?.userIds?.includes(user.id) ?? false;
  }

  function isTeamRevoked(team, file) {
    return file?.deniedAccess?.teamIds?.includes(team.id) ?? false;
  }

  function fileIsRestricted(f) {
    return (f.deniedAccess?.userIds?.length || 0) > 0 ||
           (f.deniedAccess?.teamIds?.length || 0) > 0;
  }

  return (
    <div className="flex h-full gap-4">
      {/* Left panel */}
      <div className="w-80 shrink-0 flex flex-col gap-3">
        {/* ULB selector */}
        <select
          value={selectedUlbId}
          onChange={(e) => { setSelectedUlbId(e.target.value); setSelectedFileNumber(null); setFileSearch(""); setUserSearch(""); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white"
        >
          {assignedUlbs.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {/* File search */}
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white">
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by file no. or title..."
            value={fileSearch}
            onChange={(e) => setFileSearch(e.target.value)}
            className="text-sm text-gray-700 outline-none w-full placeholder-gray-400"
          />
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filteredFiles.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No files found</p>
          ) : filteredFiles.map((f) => {
            const restricted = fileIsRestricted(f);
            const isSelected = selectedFileNumber === f.fileNumber;
            return (
              <button
                key={f.fileNumber}
                onClick={() => { setSelectedFileNumber(f.fileNumber); setUserSearch(""); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                  isSelected
                    ? "bg-[#1a2744] border-[#1a2744]"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-gray-800"}`}>
                      {f.fileTitle}
                    </p>
                    <p className={`text-xs mt-0.5 ${isSelected ? "text-white/60" : "text-gray-400"}`}>
                      {f.fileNumber}
                    </p>
                  </div>
                  {restricted && !isSelected && (
                    <span className="shrink-0 mt-0.5 text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-500">
                      Restricted
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-gray-400 p-8">
            <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Select a file to manage access</p>
          </div>
        ) : (
          <>
            {/* Fixed header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedFile.fileTitle}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{selectedFile.fileNumber} · {selectedFile.ulb}</p>
                </div>
                <FileBadge revoked={fileIsRestricted(selectedFile)} />
              </div>
              <p className="text-xs text-gray-400 italic mb-3">
                Partner and State Controller always retain access regardless of restrictions.
              </p>
              {/* User search */}
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or user ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="text-sm text-gray-700 outline-none w-full placeholder-gray-400 bg-transparent"
                />
                {userSearch && (
                  <button onClick={() => setUserSearch("")} className="text-gray-400 hover:text-gray-600 shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Two-column scrollable body */}
            <div className="flex-1 flex gap-0 overflow-hidden min-h-0">
              {/* Teams column */}
              <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 pt-4 pb-2 shrink-0">
                  Teams
                  <span className="ml-1.5 font-normal normal-case text-gray-300">({teamsForUlb.length})</span>
                </p>
                <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-1.5">
                  {teamsForUlb.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No teams found</p>
                  ) : teamsForUlb.map((team) => {
                    const revoked = isTeamRevoked(team, selectedFile);
                    return (
                      <div key={team.id} className={`flex items-start justify-between px-3 py-2.5 rounded-lg border ${
                        revoked ? "border-red-100 bg-red-50/50" : "border-gray-100 bg-gray-50"
                      }`}>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">{team.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                            {team.members.map((m) => m.name).join(", ")}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
                          <AccessBadge revoked={revoked} />
                          {revoked ? (
                            <button
                              onClick={() => restoreAccess(selectedFile.fileNumber, { teamId: team.id })}
                              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              onClick={() => revokeAccess(selectedFile.fileNumber, { teamId: team.id })}
                              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individuals column */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 pt-4 pb-2 shrink-0">
                  Individuals
                  <span className="ml-1.5 font-normal normal-case text-gray-300">({usersForUlb.length})</span>
                </p>
                <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-1.5">
                  {usersForUlb.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No individuals found</p>
                  ) : usersForUlb.map((user) => {
                    const revoked = isUserRevoked(user, selectedFile);
                    return (
                      <div key={user.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
                        revoked ? "border-red-100 bg-red-50/50" : "border-gray-100 bg-gray-50"
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={user.name} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                            <RolePill role={user.role} />
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 ml-2 shrink-0">
                          <AccessBadge revoked={revoked} />
                          {revoked ? (
                            <button
                              onClick={() => restoreAccess(selectedFile.fileNumber, { userId: user.id })}
                              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              onClick={() => revokeAccess(selectedFile.fileNumber, { userId: user.id })}
                              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function AccessControlPage() {
  const [tab, setTab] = useState("person");
  const { files, revokeAccess, restoreAccess } = useFiles();

  const TABS = [
    { id: "person",  label: "By Person" },
    { id: "file",    label: "By File / ULB" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Access Control</h1>
          <p className="text-sm text-gray-400 mt-1">Manage file-level access for users and teams</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-[#1a2744] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {tab === "person" ? (
          <ByPersonTab files={files} revokeAccess={revokeAccess} restoreAccess={restoreAccess} />
        ) : (
          <ByFileTab files={files} revokeAccess={revokeAccess} restoreAccess={restoreAccess} />
        )}
      </div>
    </div>
  );
}
