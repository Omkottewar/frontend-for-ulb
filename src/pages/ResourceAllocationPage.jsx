import { useState, useMemo } from "react";
import {
  DUMMY_ULBS,
  DUMMY_TEAMS as INITIAL_TEAMS,
  DUMMY_ULB_ASSIGNMENTS as INITIAL_ASSIGNMENTS,
  DUMMY_ALLOCATION_USERS,
} from "../utils/dummyData";

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLE_COLORS = {
  "Team Lead":               "bg-blue-100 text-blue-700",
  "Chartered Accountant":    "bg-purple-100 text-purple-700",
  "ULB Field Executive":     "bg-green-100 text-green-700",
  "Non-ULB Field Executive": "bg-orange-100 text-orange-600",
};

const STATUS_STYLES = {
  "Assigned":           "bg-green-100 text-green-700",
  "Partially Assigned": "bg-amber-100 text-amber-600",
  "Unassigned":         "bg-gray-100 text-gray-500",
};

const WORKLOAD_STYLES = {
  "Not Assigned": "bg-gray-100 text-gray-500",
  "Low":          "bg-green-100 text-green-700",
  "Moderate":     "bg-amber-100 text-amber-600",
  "High":         "bg-red-100 text-red-600",
};

const AVAIL_STYLES = {
  "Available": "bg-green-100 text-green-700",
  "Occupied":  "bg-amber-100 text-amber-600",
  "On Leave":  "bg-red-100 text-red-600",
};

const ASSIGNABLE_ROLES = [
  "Team Lead",
  "Chartered Accountant",
  "ULB Field Executive",
  "Non-ULB Field Executive",
];

const SHORT_ROLE = {
  "Team Lead":               "Team Lead",
  "Chartered Accountant":    "CA",
  "ULB Field Executive":     "ULB FE",
  "Non-ULB Field Executive": "Non-ULB FE",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function ini(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getStatus(assignment) {
  if (!assignment || (assignment.teams.length === 0 && assignment.individuals.length === 0))
    return "Unassigned";
  if (assignment.teams.length > 0) return "Assigned";
  return "Partially Assigned";
}

function getWorkloadLabel(count) {
  if (count === 0) return "Not Assigned";
  if (count <= 2)  return "Low";
  if (count <= 4)  return "Moderate";
  return "High";
}

// ── Shared UI components ───────────────────────────────────────────────────────

function XIcon({ cls = "w-4 h-4" }) {
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SearchIcon({ cls = "w-4 h-4 text-gray-400" }) {
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function Avatar({ name, size = 8 }) {
  const fs = size <= 6 ? "0.6rem" : size <= 7 ? "0.65rem" : "0.75rem";
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-[#1a2744] flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ fontSize: fs }}
    >
      {ini(name)}
    </div>
  );
}

function RolePill({ role }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[role] ?? "bg-gray-100 text-gray-500"}`}>
      {SHORT_ROLE[role] ?? role}
    </span>
  );
}

function InlineConfirm({ label = "Remove?", onConfirm, onCancel }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-xs text-gray-500">{label}</span>
      <button onClick={onConfirm} className="text-xs px-2 py-0.5 bg-red-500 text-white rounded font-medium">Yes</button>
      <button onClick={onCancel} className="text-xs px-2 py-0.5 border border-gray-200 text-gray-600 rounded">No</button>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2"><SearchIcon /></div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20"
      />
    </div>
  );
}

function ModalShell({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon cls="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ResourceAllocationPage() {
  const [tab, setTab] = useState("ulbs");

  // ── ULBs tab state
  const [ulbSearch, setUlbSearch]       = useState("");
  const [cityFilter, setCityFilter]     = useState("All");
  const [areaFilter, setAreaFilter]     = useState("All");
  const [selectedULBId, setSelectedULBId] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  // ── Teams tab state
  const [teamSearch, setTeamSearch]                   = useState("");
  const [teamDetailId, setTeamDetailId]               = useState(null);
  const [confirmDeleteTeam, setConfirmDeleteTeam]     = useState(false);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null);
  const [addMemberOpen, setAddMemberOpen]             = useState(false);
  const [addMemberRole, setAddMemberRole]             = useState("All");
  const [addMemberSearch, setAddMemberSearch]         = useState("");
  const [teamNameEditing, setTeamNameEditing]         = useState(false);
  const [teamNameDraft, setTeamNameDraft]             = useState("");

  // ── People tab state
  const [selectedPeople, setSelectedPeople]           = useState(new Set());
  const [peopleSearch, setPeopleSearch]               = useState("");
  const [peopleRoleFilter, setPeopleRoleFilter]       = useState("All");
  const [peopleCityFilter, setPeopleCityFilter]       = useState("All");
  const [peopleAvailFilter, setPeopleAvailFilter]     = useState("All");
  // Assign to ULB (from people)
  const [assignPeopleULBOpen, setAssignPeopleULBOpen]       = useState(false);
  const [assignPeopleULBSearch, setAssignPeopleULBSearch]   = useState("");
  const [assignPeopleULBCity, setAssignPeopleULBCity]       = useState("All");
  const [assignPeopleULBSelected, setAssignPeopleULBSelected] = useState(null);
  // Add to team (from people)
  const [addPeopleTeamOpen, setAddPeopleTeamOpen]       = useState(false);
  const [addPeopleTeamSearch, setAddPeopleTeamSearch]   = useState("");
  const [addPeopleTeamSelected, setAddPeopleTeamSelected] = useState(null);

  // ── Data state
  const [teams, setTeams]           = useState(INITIAL_TEAMS);
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);

  // ── Assign Team modal (from ULBs tab)
  const [assignTeamOpen, setAssignTeamOpen]         = useState(false);
  const [assignTeamSearch, setAssignTeamSearch]     = useState("");
  const [assignTeamSelected, setAssignTeamSelected] = useState(null);

  // ── Assign Individual modal (from ULBs tab)
  const [assignIndivOpen, setAssignIndivOpen]         = useState(false);
  const [assignIndivRole, setAssignIndivRole]         = useState("All");
  const [assignIndivSearch, setAssignIndivSearch]     = useState("");
  const [assignIndivSelected, setAssignIndivSelected] = useState([]);

  // ── Create Team modal (shared)
  const [createTeamOpen, setCreateTeamOpen]               = useState(false);
  const [newTeamName, setNewTeamName]                     = useState("");
  const [newTeamRoleFilter, setNewTeamRoleFilter]         = useState("All");
  const [newTeamMemberSearch, setNewTeamMemberSearch]     = useState("");
  const [newTeamMembers, setNewTeamMembers]               = useState([]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const cities = useMemo(() => [...new Set(DUMMY_ULBS.map((u) => u.district))].sort(), []);
  const peopleCities = useMemo(() => [...new Set(DUMMY_ALLOCATION_USERS.map((u) => u.district))].sort(), []);

  const filteredULBs = useMemo(() =>
    DUMMY_ULBS.filter((ulb) =>
      ulb.name.toLowerCase().includes(ulbSearch.toLowerCase()) &&
      (cityFilter === "All" || ulb.district === cityFilter) &&
      (areaFilter === "All" || ulb.type === areaFilter)
    ),
  [ulbSearch, cityFilter, areaFilter]);

  const filteredTeams = useMemo(() =>
    teams.filter((t) => t.name.toLowerCase().includes(teamSearch.toLowerCase())),
  [teams, teamSearch]);

  const filteredPeople = useMemo(() =>
    DUMMY_ALLOCATION_USERS.filter((u) =>
      u.name.toLowerCase().includes(peopleSearch.toLowerCase()) &&
      (peopleRoleFilter === "All" || u.role === peopleRoleFilter) &&
      (peopleCityFilter === "All" || u.district === peopleCityFilter) &&
      (peopleAvailFilter === "All" || u.availability === peopleAvailFilter)
    ),
  [peopleSearch, peopleRoleFilter, peopleCityFilter, peopleAvailFilter]);

  const selectedULB        = selectedULBId ? DUMMY_ULBS.find((u) => u.id === selectedULBId) : null;
  const selectedAssignment = selectedULBId
    ? assignments[selectedULBId] ?? { teams: [], individuals: [] }
    : null;
  const assignedTeamObjects = selectedAssignment
    ? selectedAssignment.teams.map((tid) => teams.find((t) => t.id === tid)).filter(Boolean)
    : [];

  const teamDetail  = teamDetailId ? teams.find((t) => t.id === teamDetailId) : null;
  const ulbsForTeam = useMemo(() => {
    if (!teamDetailId) return [];
    return DUMMY_ULBS.filter((ulb) => assignments[ulb.id]?.teams.includes(teamDetailId));
  }, [teamDetailId, assignments]);

  // Per-user computed info (closed over live state)
  const getUserULBCount = (userId) =>
    DUMMY_ULBS.filter((ulb) => {
      const a = assignments[ulb.id];
      if (!a) return false;
      if (a.individuals.some((i) => i.id === userId)) return true;
      return a.teams.some((tid) => teams.find((t) => t.id === tid)?.members.some((m) => m.id === userId));
    }).length;

  const getUserTeams = (userId) =>
    teams.filter((t) => t.members.some((m) => m.id === userId));

  const getAssignedULBsCount = (teamId) =>
    DUMMY_ULBS.filter((ulb) => assignments[ulb.id]?.teams.includes(teamId)).length;

  const getRolesCovered = (members) => [...new Set(members.map((m) => m.role))];

  // Modal user lists
  const teamsForAssignModal = teams.filter((t) => {
    const curr = assignments[selectedULBId] ?? { teams: [], individuals: [] };
    return !curr.teams.includes(t.id) && t.name.toLowerCase().includes(assignTeamSearch.toLowerCase());
  });
  const usersForAssignModal = DUMMY_ALLOCATION_USERS.filter((u) => {
    const curr = assignments[selectedULBId] ?? { teams: [], individuals: [] };
    return (
      !curr.individuals.some((i) => i.id === u.id) &&
      (assignIndivRole === "All" || u.role === assignIndivRole) &&
      u.name.toLowerCase().includes(assignIndivSearch.toLowerCase())
    );
  });
  const usersForAddMember = DUMMY_ALLOCATION_USERS.filter((u) => {
    if (!teamDetail) return false;
    return (
      !teamDetail.members.some((m) => m.id === u.id) &&
      (addMemberRole === "All" || u.role === addMemberRole) &&
      u.name.toLowerCase().includes(addMemberSearch.toLowerCase())
    );
  });
  const usersForCreateTeam = DUMMY_ALLOCATION_USERS.filter((u) =>
    !newTeamMembers.some((m) => m.id === u.id) &&
    (newTeamRoleFilter === "All" || u.role === newTeamRoleFilter) &&
    u.name.toLowerCase().includes(newTeamMemberSearch.toLowerCase())
  );

  // People-tab: ULBs available for assignment modal
  const ulbsForPeopleAssign = useMemo(() =>
    DUMMY_ULBS.filter((ulb) =>
      ulb.name.toLowerCase().includes(assignPeopleULBSearch.toLowerCase()) &&
      (assignPeopleULBCity === "All" || ulb.district === assignPeopleULBCity)
    ),
  [assignPeopleULBSearch, assignPeopleULBCity]);

  const selectedPeopleList = DUMMY_ALLOCATION_USERS.filter((u) => selectedPeople.has(u.id));

  const hasActiveFilters = ulbSearch || cityFilter !== "All" || areaFilter !== "All";

  // ── Handlers ───────────────────────────────────────────────────────────────

  const removeTeamFromULB = (ulbId, teamId) => {
    setAssignments((p) => ({
      ...p,
      [ulbId]: { ...p[ulbId], teams: (p[ulbId]?.teams ?? []).filter((t) => t !== teamId) },
    }));
    setConfirmRemove(null);
  };
  const removeIndividualFromULB = (ulbId, userId) => {
    setAssignments((p) => ({
      ...p,
      [ulbId]: { ...p[ulbId], individuals: (p[ulbId]?.individuals ?? []).filter((u) => u.id !== userId) },
    }));
    setConfirmRemove(null);
  };

  const doAssignTeam = () => {
    if (!assignTeamSelected || !selectedULBId) return;
    setAssignments((p) => {
      const curr = p[selectedULBId] ?? { teams: [], individuals: [] };
      if (curr.teams.includes(assignTeamSelected)) return p;
      return { ...p, [selectedULBId]: { ...curr, teams: [...curr.teams, assignTeamSelected] } };
    });
    setAssignTeamOpen(false); setAssignTeamSelected(null); setAssignTeamSearch("");
  };
  const doAssignIndividuals = () => {
    if (!assignIndivSelected.length || !selectedULBId) return;
    setAssignments((p) => {
      const curr = p[selectedULBId] ?? { teams: [], individuals: [] };
      const existingIds = curr.individuals.map((i) => i.id);
      const toAdd = assignIndivSelected.filter((u) => !existingIds.includes(u.id));
      return { ...p, [selectedULBId]: { ...curr, individuals: [...curr.individuals, ...toAdd] } };
    });
    setAssignIndivOpen(false); setAssignIndivSelected([]); setAssignIndivSearch(""); setAssignIndivRole("All");
  };

  const doCreateTeam = () => {
    if (!newTeamName.trim() || newTeamMembers.length === 0) return;
    const t = {
      id: `t${Date.now()}`,
      name: newTeamName.trim(),
      members: newTeamMembers,
      createdOn: new Date().toLocaleDateString("en-GB"),
    };
    setTeams((p) => [...p, t]);
    setCreateTeamOpen(false); setNewTeamName(""); setNewTeamMembers([]); setNewTeamMemberSearch(""); setNewTeamRoleFilter("All");
  };

  const doDeleteTeam = () => {
    if (!teamDetailId) return;
    setTeams((p) => p.filter((t) => t.id !== teamDetailId));
    setAssignments((p) => {
      const updated = { ...p };
      Object.keys(updated).forEach((uid) => {
        updated[uid] = { ...updated[uid], teams: (updated[uid]?.teams ?? []).filter((t) => t !== teamDetailId) };
      });
      return updated;
    });
    setTeamDetailId(null); setConfirmDeleteTeam(false);
  };
  const removeTeamMember = (memberId) => {
    setTeams((p) => p.map((t) =>
      t.id !== teamDetailId ? t : { ...t, members: t.members.filter((m) => m.id !== memberId) }
    ));
    setConfirmRemoveMember(null);
  };
  const addMemberToTeam = (user) => {
    setTeams((p) => p.map((t) =>
      t.id !== teamDetailId ? t : { ...t, members: [...t.members, { id: user.id, name: user.name, role: user.role }] }
    ));
    setAddMemberOpen(false); setAddMemberSearch(""); setAddMemberRole("All");
  };
  const saveTeamName = () => {
    if (!teamNameDraft.trim()) return;
    setTeams((p) => p.map((t) => t.id === teamDetailId ? { ...t, name: teamNameDraft.trim() } : t));
    setTeamNameEditing(false);
  };
  const unassignTeamFromULB = (ulbId) => {
    setAssignments((p) => ({
      ...p,
      [ulbId]: { ...p[ulbId], teams: (p[ulbId]?.teams ?? []).filter((t) => t !== teamDetailId) },
    }));
  };
  const openTeamDetail = (teamId) => {
    setTeamDetailId(teamId); setConfirmDeleteTeam(false);
    setConfirmRemoveMember(null); setAddMemberOpen(false); setTeamNameEditing(false);
  };
  const closeTeamDetail = () => {
    setTeamDetailId(null); setTeamNameEditing(false); setAddMemberOpen(false);
  };

  // People tab handlers
  const togglePersonSelect = (userId) => {
    setSelectedPeople((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  };
  const clearPeopleSelection = () => setSelectedPeople(new Set());

  const openAssignPeopleToULB = () => {
    setAssignPeopleULBOpen(true); setAssignPeopleULBSearch(""); setAssignPeopleULBCity("All"); setAssignPeopleULBSelected(null);
  };
  const doAssignPeopleToULB = () => {
    if (!assignPeopleULBSelected || selectedPeople.size === 0) return;
    const peopleToAdd = DUMMY_ALLOCATION_USERS.filter((u) => selectedPeople.has(u.id));
    setAssignments((p) => {
      const curr = p[assignPeopleULBSelected] ?? { teams: [], individuals: [] };
      const existingIds = curr.individuals.map((i) => i.id);
      const toAdd = peopleToAdd.filter((u) => !existingIds.includes(u.id));
      return { ...p, [assignPeopleULBSelected]: { ...curr, individuals: [...curr.individuals, ...toAdd] } };
    });
    setAssignPeopleULBOpen(false); clearPeopleSelection();
  };

  const openAddPeopleToTeam = () => {
    setAddPeopleTeamOpen(true); setAddPeopleTeamSearch(""); setAddPeopleTeamSelected(null);
  };
  const doAddPeopleToTeam = () => {
    if (!addPeopleTeamSelected || selectedPeople.size === 0) return;
    const peopleToAdd = DUMMY_ALLOCATION_USERS.filter((u) => selectedPeople.has(u.id));
    setTeams((p) => p.map((t) => {
      if (t.id !== addPeopleTeamSelected) return t;
      const existingIds = t.members.map((m) => m.id);
      const toAdd = peopleToAdd.filter((u) => !existingIds.includes(u.id)).map((u) => ({ id: u.id, name: u.name, role: u.role }));
      return { ...t, members: [...t.members, ...toAdd] };
    }));
    setAddPeopleTeamOpen(false); clearPeopleSelection();
  };

  const openCreateTeamFromPeople = () => {
    const preSelected = DUMMY_ALLOCATION_USERS.filter((u) => selectedPeople.has(u.id));
    setNewTeamMembers(preSelected);
    setNewTeamName(""); setNewTeamMemberSearch(""); setNewTeamRoleFilter("All");
    setCreateTeamOpen(true);
  };

  // ── Role filter chips ───────────────────────────────────────────────────────
  const RoleChips = ({ active, onChange }) => (
    <div className="flex flex-wrap gap-1.5">
      {["All", ...ASSIGNABLE_ROLES].map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
            active === r
              ? "bg-[#1a2744] text-white border-[#1a2744]"
              : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
          }`}
        >
          {r === "All" ? "All" : SHORT_ROLE[r]}
        </button>
      ))}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Resource Allocation</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage team assignments across ULBs</p>
        </div>
        <button
          onClick={() => setCreateTeamOpen(true)}
          className="px-4 py-2 bg-[#1a2744] text-white text-sm font-medium rounded-lg hover:bg-[#243460] transition-colors"
        >
          + Create Team
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[["ulbs", "ULBs"], ["teams", "Teams"], ["people", "People"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-[#1a2744] text-[#1a2744]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          ULBs Tab
      ════════════════════════════════════════════════════════════════════════ */}
      {tab === "ulbs" && (
        <div>
          <div className="flex gap-3 mb-5 flex-wrap">
            <SearchInput value={ulbSearch} onChange={setUlbSearch} placeholder="Search ULBs..." className="flex-1 min-w-[180px] max-w-xs" />
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20 text-gray-700">
              <option value="All">All Cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20 text-gray-700">
              <option value="All">All Areas</option>
              <option value="Municipal Corporation">Municipal Corporation</option>
              <option value="Municipal Council">Municipal Council</option>
            </select>
            {hasActiveFilters && (
              <button onClick={() => { setUlbSearch(""); setCityFilter("All"); setAreaFilter("All"); }} className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg transition-colors">Clear</button>
            )}
          </div>

          <div className="flex gap-5 items-start">
            {/* Left: ULB list — scrolls independently */}
            <div className="w-80 shrink-0 overflow-y-auto max-h-[calc(100vh-22rem)] pr-1">
              {filteredULBs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-gray-400">No ULBs found</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredULBs.map((ulb) => {
                    const status = getStatus(assignments[ulb.id]);
                    const isSelected = selectedULBId === ulb.id;
                    return (
                      <button
                        key={ulb.id}
                        onClick={() => { setSelectedULBId(ulb.id); setConfirmRemove(null); }}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          isSelected ? "bg-[#1a2744] border-[#1a2744]" : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <p className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-800"}`}>{ulb.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${isSelected ? "text-white/60" : "text-gray-400"}`}>{ulb.district}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isSelected ? "bg-white/20 text-white" : STATUS_STYLES[status]}`}>
                            {status}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Assignment Panel */}
            {selectedULB ? (
              <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-semibold text-gray-800">{selectedULB.name}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[getStatus(selectedAssignment)]}`}>
                        {getStatus(selectedAssignment)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">{selectedULB.district}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setAssignTeamOpen(true); setAssignTeamSelected(null); setAssignTeamSearch(""); }} className="px-3 py-2 text-sm font-medium bg-[#1a2744] text-white rounded-lg hover:bg-[#243460] transition-colors">Assign Team</button>
                    <button onClick={() => { setAssignIndivOpen(true); setAssignIndivSelected([]); setAssignIndivSearch(""); setAssignIndivRole("All"); }} className="px-3 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Assign Individual</button>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Assigned Teams</p>
                  {assignedTeamObjects.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No teams assigned</p>
                  ) : (
                    <div className="space-y-3">
                      {assignedTeamObjects.map((team) => (
                        <div key={team.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{team.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{team.members.length} member{team.members.length !== 1 ? "s" : ""}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {getRolesCovered(team.members).map((role) => <RolePill key={role} role={role} />)}
                            </div>
                          </div>
                          {confirmRemove?.type === "team" && confirmRemove.id === team.id ? (
                            <InlineConfirm onConfirm={() => removeTeamFromULB(selectedULBId, team.id)} onCancel={() => setConfirmRemove(null)} />
                          ) : (
                            <button onClick={() => setConfirmRemove({ type: "team", id: team.id })} className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0"><XIcon /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Assigned Individuals</p>
                  {(selectedAssignment?.individuals ?? []).length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No individuals assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedAssignment.individuals.map((user) => (
                        <div key={user.id} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.name} size={8} />
                            <div><p className="text-sm font-medium text-gray-800">{user.name}</p><RolePill role={user.role} /></div>
                          </div>
                          {confirmRemove?.type === "individual" && confirmRemove.id === user.id ? (
                            <InlineConfirm onConfirm={() => removeIndividualFromULB(selectedULBId, user.id)} onCancel={() => setConfirmRemove(null)} />
                          ) : (
                            <button onClick={() => setConfirmRemove({ type: "individual", id: user.id })} className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0"><XIcon /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {assignedTeamObjects.length === 0 && (selectedAssignment?.individuals ?? []).length === 0 && (
                  <div className="mt-6 flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-sm text-gray-400 font-medium">No assignments yet</p>
                    <p className="text-xs text-gray-300 mt-1">Use Assign Team or Assign Individual to get started</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400 font-medium">Select a ULB to manage assignments</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          Teams Tab
      ════════════════════════════════════════════════════════════════════════ */}
      {tab === "teams" && (
        <div>
          <div className="mb-5">
            <SearchInput value={teamSearch} onChange={setTeamSearch} placeholder="Search teams..." className="max-w-xs" />
          </div>
          {filteredTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-gray-400 font-medium">No teams found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Team Name", "Members", "Roles Covered", "Assigned ULBs", "Created On"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team, i) => {
                    const ulbCount = getAssignedULBsCount(team.id);
                    const roles    = getRolesCovered(team.members);
                    return (
                      <tr key={team.id} onClick={() => openTeamDetail(team.id)} className={`cursor-pointer hover:bg-gray-50 transition-colors ${i > 0 ? "border-t border-gray-100" : ""}`}>
                        <td className="px-5 py-3.5 font-medium text-gray-800">{team.name}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {team.members.slice(0, 3).map((m) => (
                                <div key={m.id} title={m.name} className="w-7 h-7 rounded-full bg-[#1a2744] border-2 border-white flex items-center justify-center text-white font-semibold" style={{ fontSize: "0.65rem" }}>{ini(m.name)}</div>
                              ))}
                              {team.members.length > 3 && (
                                <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 font-semibold" style={{ fontSize: "0.65rem" }}>+{team.members.length - 3}</div>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">{team.members.length}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><div className="flex flex-wrap gap-1">{roles.map((r) => <RolePill key={r} role={r} />)}</div></td>
                        <td className="px-5 py-3.5"><span className={`text-sm font-medium ${ulbCount > 0 ? "text-gray-800" : "text-gray-300"}`}>{ulbCount} {ulbCount === 1 ? "ULB" : "ULBs"}</span></td>
                        <td className="px-5 py-3.5 text-gray-500">{team.createdOn}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          People Tab
      ════════════════════════════════════════════════════════════════════════ */}
      {tab === "people" && (
        <div className="flex flex-col gap-4">
          {/* Filter bar */}
          <div className="flex gap-3 flex-wrap items-center">
            <SearchInput value={peopleSearch} onChange={setPeopleSearch} placeholder="Search people..." className="flex-1 min-w-[180px] max-w-xs" />
            <select value={peopleCityFilter} onChange={(e) => setPeopleCityFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20 text-gray-700">
              <option value="All">All Districts</option>
              {peopleCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={peopleAvailFilter} onChange={(e) => setPeopleAvailFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20 text-gray-700">
              <option value="All">All Availability</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="On Leave">On Leave</option>
            </select>
            <RoleChips active={peopleRoleFilter} onChange={setPeopleRoleFilter} />
            {(peopleSearch || peopleCityFilter !== "All" || peopleRoleFilter !== "All" || peopleAvailFilter !== "All") && (
              <button onClick={() => { setPeopleSearch(""); setPeopleCityFilter("All"); setPeopleRoleFilter("All"); setPeopleAvailFilter("All"); }} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-2 transition-colors">Clear</button>
            )}
          </div>

          {/* People list */}
          {filteredPeople.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-200">
              <p className="text-sm text-gray-400">No people found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto overflow-y-auto max-h-[calc(100vh-22rem)]">
              {/* Table header */}
              <div className="grid grid-cols-[2.5rem_2fr_1fr_1.5fr_1.5fr_1.5fr_1fr] border-b border-gray-100 px-5 py-3 min-w-[900px] sticky top-0 bg-white z-10">
                <div />
                {["Name & Role", "Availability", "Based In", "Experience", "Performance", "Workload"].map((h) => (
                  <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
                ))}
              </div>
              {/* Rows */}
              {filteredPeople.map((user, i) => {
                const ulbCount   = getUserULBCount(user.id);
                const workload   = getWorkloadLabel(ulbCount);
                const isSelected = selectedPeople.has(user.id);
                const perfColor  = user.completionRate >= 80 ? "text-green-700" : user.completionRate >= 60 ? "text-amber-600" : "text-red-600";
                return (
                  <div
                    key={user.id}
                    className={`grid grid-cols-[2.5rem_2fr_1fr_1.5fr_1.5fr_1.5fr_1fr] items-start px-5 py-4 transition-colors min-w-[900px] ${
                      i > 0 ? "border-t border-gray-100" : ""
                    } ${isSelected ? "bg-[#1a2744]/5" : "hover:bg-gray-50"}`}
                  >
                    {/* Checkbox */}
                    <div className="pt-0.5">
                      <input type="checkbox" checked={isSelected} onChange={() => togglePersonSelect(user.id)} className="accent-[#1a2744] w-4 h-4 cursor-pointer" />
                    </div>
                    {/* Name & Role */}
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <Avatar name={user.name} size={9} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                        <div className="mt-0.5"><RolePill role={user.role} /></div>
                        <p className="text-xs text-gray-400 mt-1">{user.phone}</p>
                      </div>
                    </div>
                    {/* Availability */}
                    <div className="pr-4 pt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AVAIL_STYLES[user.availability]}`}>
                        {user.availability}
                      </span>
                    </div>
                    {/* Based In */}
                    <div className="pr-4">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">{user.city}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 pl-[1.125rem]">{user.district}</p>
                      <div className="flex items-center gap-1 mt-1.5 pl-[1.125rem]">
                        {user.hasOwnTransport ? (
                          <>
                            <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h6l2-1zm0 0l2 1h3l2-1V9a1 1 0 00-.93-.995L17 8l-2 4-2-4" />
                            </svg>
                            <span className="text-xs text-green-600">Has transport</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs text-gray-400">No transport</span>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Experience */}
                    <div className="pr-4">
                      <p className="text-sm font-semibold text-gray-800">{user.experienceYears} yrs · {user.auditedULBsTotal} ULBs</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {user.specializations.map((s) => (
                          <span key={s} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                    {/* Performance */}
                    <div className="pr-4">
                      <p className={`text-sm font-semibold ${perfColor}`}>{user.completionRate}% on time</p>
                      <p className="text-xs text-gray-400 mt-0.5">Avg {user.avgResolutionDays} days/query</p>
                    </div>
                    {/* Workload */}
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${WORKLOAD_STYLES[workload]}`}>{workload}</span>
                      <p className="text-xs text-gray-400 mt-1">{ulbCount} ULB{ulbCount !== 1 ? "s" : ""} now</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selection action bar */}
          {selectedPeople.size > 0 && (
            <div className="sticky bottom-0 left-0 right-0 bg-[#1a2744] rounded-xl px-5 py-3.5 flex items-center justify-between shadow-lg">
              <span className="text-sm font-medium text-white">
                {selectedPeople.size} {selectedPeople.size === 1 ? "person" : "people"} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={openAssignPeopleToULB}
                  className="px-3.5 py-2 text-xs font-medium bg-white text-[#1a2744] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Assign to ULB
                </button>
                <button
                  onClick={openAddPeopleToTeam}
                  className="px-3.5 py-2 text-xs font-medium bg-white/15 text-white border border-white/20 rounded-lg hover:bg-white/25 transition-colors"
                >
                  Add to Team
                </button>
                <button
                  onClick={openCreateTeamFromPeople}
                  className="px-3.5 py-2 text-xs font-medium bg-white/15 text-white border border-white/20 rounded-lg hover:bg-white/25 transition-colors"
                >
                  Create Team
                </button>
                <button onClick={clearPeopleSelection} className="ml-1 text-white/50 hover:text-white transition-colors p-1"><XIcon cls="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          Team Detail Panel (slide-in)
      ════════════════════════════════════════════════════════════════════════ */}
      {teamDetail && (
        <>
          <div className="fixed inset-0 bg-black/20 z-30" onClick={closeTeamDetail} />
          <div className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-40 flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
              <div className="flex-1 pr-4 min-w-0">
                {teamNameEditing ? (
                  <div className="flex items-center gap-2">
                    <input value={teamNameDraft} onChange={(e) => setTeamNameDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveTeamName()} className="text-lg font-semibold text-gray-800 border-b-2 border-[#1a2744] outline-none bg-transparent min-w-0" autoFocus />
                    <button onClick={saveTeamName} className="text-xs text-[#1a2744] font-medium shrink-0">Save</button>
                    <button onClick={() => setTeamNameEditing(false)} className="text-xs text-gray-400 shrink-0">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800 truncate">{teamDetail.name}</h2>
                    <button onClick={() => { setTeamNameEditing(true); setTeamNameDraft(teamDetail.name); }} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0" title="Rename">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-0.5">Created {teamDetail.createdOn}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {confirmDeleteTeam ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Delete?</span>
                    <button onClick={doDeleteTeam} className="text-xs px-2 py-1 bg-red-500 text-white rounded font-medium">Yes</button>
                    <button onClick={() => setConfirmDeleteTeam(false)} className="text-xs px-2 py-1 border border-gray-200 text-gray-600 rounded">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteTeam(true)} className="text-xs px-3 py-1.5 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
                )}
                <button onClick={closeTeamDetail} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon cls="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
              {/* Members */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Members</p>
                  <button onClick={() => setAddMemberOpen((v) => !v)} className="text-xs text-[#1a2744] font-medium hover:underline">+ Add Member</button>
                </div>
                {addMemberOpen && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {["All", ...ASSIGNABLE_ROLES].map((r) => (
                        <button key={r} onClick={() => setAddMemberRole(r)} className={`text-xs px-2 py-0.5 rounded-full font-medium border transition-colors ${addMemberRole === r ? "bg-[#1a2744] text-white border-[#1a2744]" : "bg-white text-gray-500 border-gray-200"}`}>
                          {r === "All" ? "All" : SHORT_ROLE[r]}
                        </button>
                      ))}
                    </div>
                    <input value={addMemberSearch} onChange={(e) => setAddMemberSearch(e.target.value)} placeholder="Search users..." className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg mb-2 focus:outline-none" />
                    <div className="space-y-0.5 max-h-40 overflow-y-auto">
                      {usersForAddMember.length === 0 ? <p className="text-xs text-gray-400 text-center py-3">No users available</p>
                        : usersForAddMember.map((u) => (
                          <button key={u.id} onClick={() => addMemberToTeam(u)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white text-left transition-colors">
                            <Avatar name={u.name} size={6} />
                            <div><p className="text-xs font-medium text-gray-800">{u.name}</p><p className="text-xs text-gray-400">{u.role}</p></div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                {teamDetail.members.length === 0 ? <p className="text-sm text-gray-400 italic">No members</p> : (
                  <div className="space-y-2.5">
                    {teamDetail.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={member.name} size={8} />
                          <div><p className="text-sm font-medium text-gray-800">{member.name}</p><RolePill role={member.role} /></div>
                        </div>
                        {confirmRemoveMember === member.id ? (
                          <InlineConfirm onConfirm={() => removeTeamMember(member.id)} onCancel={() => setConfirmRemoveMember(null)} />
                        ) : (
                          <button onClick={() => setConfirmRemoveMember(member.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1"><XIcon cls="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Assigned ULBs */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Assigned ULBs</p>
                {ulbsForTeam.length === 0 ? <p className="text-sm text-gray-400 italic">Not assigned to any ULB</p> : (
                  <div className="space-y-2">
                    {ulbsForTeam.map((ulb) => (
                      <div key={ulb.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div><p className="text-sm font-medium text-gray-800">{ulb.name}</p><p className="text-xs text-gray-400">{ulb.district}</p></div>
                        <button onClick={() => unassignTeamFromULB(ulb.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1" title="Unassign"><XIcon cls="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          Assign Team Modal (ULBs tab)
      ════════════════════════════════════════════════════════════════════════ */}
      {assignTeamOpen && (
        <ModalShell title="Assign Team" onClose={() => setAssignTeamOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setAssignTeamOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={doAssignTeam} disabled={!assignTeamSelected} className="px-4 py-2 text-sm font-medium bg-[#1a2744] text-white rounded-lg hover:bg-[#243460] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Confirm</button>
            </div>
          }
        >
          <p className="text-xs text-gray-400 mb-3">Assigning to <span className="font-medium text-gray-600">{selectedULB?.name}</span></p>
          <input value={assignTeamSearch} onChange={(e) => setAssignTeamSearch(e.target.value)} placeholder="Search teams..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {teamsForAssignModal.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No available teams</p>
              : teamsForAssignModal.map((team) => (
                <button key={team.id} onClick={() => setAssignTeamSelected(assignTeamSelected === team.id ? null : team.id)} className={`w-full text-left p-3 rounded-xl border transition-all ${assignTeamSelected === team.id ? "border-[#1a2744] bg-[#1a2744]/5" : "border-gray-200 hover:border-gray-300"}`}>
                  <p className="text-sm font-semibold text-gray-800">{team.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{team.members.map((m) => m.name).join(", ")}</p>
                </button>
              ))}
          </div>
        </ModalShell>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          Assign Individual Modal (ULBs tab)
      ════════════════════════════════════════════════════════════════════════ */}
      {assignIndivOpen && (
        <ModalShell title="Assign Individual" onClose={() => setAssignIndivOpen(false)}
          footer={
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{assignIndivSelected.length} selected</span>
              <div className="flex gap-2">
                <button onClick={() => setAssignIndivOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={doAssignIndividuals} disabled={assignIndivSelected.length === 0} className="px-4 py-2 text-sm font-medium bg-[#1a2744] text-white rounded-lg hover:bg-[#243460] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Assign</button>
              </div>
            </div>
          }
        >
          <p className="text-xs text-gray-400 mb-3">Assigning to <span className="font-medium text-gray-600">{selectedULB?.name}</span></p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {["All", ...ASSIGNABLE_ROLES].map((r) => (
              <button key={r} onClick={() => setAssignIndivRole(r)} className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${assignIndivRole === r ? "bg-[#1a2744] text-white border-[#1a2744]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
                {r === "All" ? "All" : SHORT_ROLE[r]}
              </button>
            ))}
          </div>
          <input value={assignIndivSearch} onChange={(e) => setAssignIndivSearch(e.target.value)} placeholder="Search users..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {usersForAssignModal.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No users available</p>
              : usersForAssignModal.map((u) => {
                const checked = assignIndivSelected.some((s) => s.id === u.id);
                return (
                  <label key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={() => setAssignIndivSelected((prev) => checked ? prev.filter((s) => s.id !== u.id) : [...prev, u])} className="accent-[#1a2744]" />
                    <Avatar name={u.name} size={7} />
                    <div><p className="text-sm font-medium text-gray-800">{u.name}</p><RolePill role={u.role} /></div>
                  </label>
                );
              })}
          </div>
        </ModalShell>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          Assign People → ULB Modal (People tab)
      ════════════════════════════════════════════════════════════════════════ */}
      {assignPeopleULBOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Assign to ULB</h3>
                <p className="text-xs text-gray-400 mt-0.5">Assigning {selectedPeople.size} {selectedPeople.size === 1 ? "person" : "people"} as individuals</p>
              </div>
              <button onClick={() => setAssignPeopleULBOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon cls="w-5 h-5" /></button>
            </div>
            {/* Selected people chips */}
            <div className="px-6 pt-4 pb-2 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {selectedPeopleList.map((u) => (
                  <div key={u.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a2744]/8 rounded-full border border-[#1a2744]/15">
                    <div className="w-4 h-4 rounded-full bg-[#1a2744] flex items-center justify-center text-white shrink-0" style={{ fontSize: "0.55rem" }}>{ini(u.name)}</div>
                    <span className="text-xs font-medium text-[#1a2744]">{u.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {/* Filters */}
              <div className="flex gap-2 mb-3 mt-2">
                <SearchInput value={assignPeopleULBSearch} onChange={setAssignPeopleULBSearch} placeholder="Search ULBs..." className="flex-1" />
                <select value={assignPeopleULBCity} onChange={(e) => setAssignPeopleULBCity(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none text-gray-700">
                  <option value="All">All Cities</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                {ulbsForPeopleAssign.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No ULBs found</p>
                  : ulbsForPeopleAssign.map((ulb) => {
                    const status     = getStatus(assignments[ulb.id]);
                    const isSelected = assignPeopleULBSelected === ulb.id;
                    // Travel match: any selected person in same district
                    const isLocalMatch = selectedPeopleList.some((u) => u.district === ulb.district);
                    // Familiarity: any selected person has worked here before
                    const isFamiliar   = selectedPeopleList.some((u) => u.previousULBIds?.includes(ulb.id));
                    return (
                      <button key={ulb.id} onClick={() => setAssignPeopleULBSelected(isSelected ? null : ulb.id)} className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? "border-[#1a2744] bg-[#1a2744]/5" : "border-gray-200 hover:border-gray-300"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-800">{ulb.name}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isFamiliar && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Familiar</span>
                            )}
                            {isLocalMatch && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Local</span>
                            )}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[status]}`}>{status}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{ulb.district} · {ulb.type}</p>
                      </button>
                    );
                  })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">
              <button onClick={() => setAssignPeopleULBOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={doAssignPeopleToULB} disabled={!assignPeopleULBSelected} className="px-4 py-2 text-sm font-medium bg-[#1a2744] text-white rounded-lg hover:bg-[#243460] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Confirm Assignment</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          Add People → Team Modal (People tab)
      ════════════════════════════════════════════════════════════════════════ */}
      {addPeopleTeamOpen && (
        <ModalShell title="Add to Team" onClose={() => setAddPeopleTeamOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setAddPeopleTeamOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={doAddPeopleToTeam} disabled={!addPeopleTeamSelected} className="px-4 py-2 text-sm font-medium bg-[#1a2744] text-white rounded-lg hover:bg-[#243460] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Add to Team</button>
            </div>
          }
        >
          <p className="text-xs text-gray-400 mb-3">Adding {selectedPeople.size} {selectedPeople.size === 1 ? "person" : "people"} to a team</p>
          <input value={addPeopleTeamSearch} onChange={(e) => setAddPeopleTeamSearch(e.target.value)} placeholder="Search teams..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {teams.filter((t) => t.name.toLowerCase().includes(addPeopleTeamSearch.toLowerCase())).length === 0
              ? <p className="text-sm text-gray-400 text-center py-4">No teams found</p>
              : teams.filter((t) => t.name.toLowerCase().includes(addPeopleTeamSearch.toLowerCase())).map((team) => {
                const roles = getRolesCovered(team.members);
                return (
                  <button key={team.id} onClick={() => setAddPeopleTeamSelected(addPeopleTeamSelected === team.id ? null : team.id)} className={`w-full text-left p-3 rounded-xl border transition-all ${addPeopleTeamSelected === team.id ? "border-[#1a2744] bg-[#1a2744]/5" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold text-gray-800">{team.name}</p>
                      <span className="text-xs text-gray-400">{team.members.length} members</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {roles.map((r) => <RolePill key={r} role={r} />)}
                    </div>
                  </button>
                );
              })}
          </div>
        </ModalShell>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          Create Team Modal (shared — People tab pre-fills members)
      ════════════════════════════════════════════════════════════════════════ */}
      {createTeamOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="text-base font-semibold text-gray-800">Create Team</h3>
              <button onClick={() => { setCreateTeamOpen(false); setNewTeamName(""); setNewTeamMembers([]); setNewTeamMemberSearch(""); setNewTeamRoleFilter("All"); }} className="text-gray-400 hover:text-gray-600"><XIcon cls="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Team Name</label>
                <input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="e.g. Team Delta" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Add Members</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {["All", ...ASSIGNABLE_ROLES].map((r) => (
                    <button key={r} onClick={() => setNewTeamRoleFilter(r)} className={`text-xs px-2 py-0.5 rounded-full font-medium border transition-colors ${newTeamRoleFilter === r ? "bg-[#1a2744] text-white border-[#1a2744]" : "bg-white text-gray-500 border-gray-200"}`}>
                      {r === "All" ? "All" : SHORT_ROLE[r]}
                    </button>
                  ))}
                </div>
                <input value={newTeamMemberSearch} onChange={(e) => setNewTeamMemberSearch(e.target.value)} placeholder="Search users..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
                <div className="space-y-0.5 max-h-44 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50">
                  {usersForCreateTeam.length === 0 ? <p className="text-xs text-gray-400 text-center py-3">No users available</p>
                    : usersForCreateTeam.map((u) => (
                      <button key={u.id} onClick={() => setNewTeamMembers((p) => [...p, u])} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white text-left transition-colors">
                        <Avatar name={u.name} size={6} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.role}</p>
                        </div>
                        <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    ))}
                </div>
              </div>
              {newTeamMembers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Selected ({newTeamMembers.length})</label>
                  <div className="flex flex-wrap gap-2">
                    {newTeamMembers.map((m) => (
                      <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full">
                        <span className="text-xs font-medium text-gray-700">{m.name}</span>
                        <button onClick={() => setNewTeamMembers((p) => p.filter((x) => x.id !== m.id))} className="text-gray-400 hover:text-red-400"><XIcon cls="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">
              <button onClick={() => { setCreateTeamOpen(false); setNewTeamName(""); setNewTeamMembers([]); setNewTeamMemberSearch(""); setNewTeamRoleFilter("All"); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={doCreateTeam} disabled={!newTeamName.trim() || newTeamMembers.length === 0} className="px-4 py-2 text-sm font-medium bg-[#1a2744] text-white rounded-lg hover:bg-[#243460] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Save Team</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
