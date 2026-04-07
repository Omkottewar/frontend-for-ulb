import { DUMMY_ALLOCATION_USERS, DUMMY_TEAMS, DUMMY_ULBS, DUMMY_ULB_ASSIGNMENTS } from "./dummyData";
import { getSession } from "./auth";

export function getUlbIdByName(ulbName) {
  return DUMMY_ULBS.find((u) => u.name === ulbName)?.id ?? null;
}

export function getUserTeamIds(userId) {
  return DUMMY_TEAMS
    .filter((t) => t.members.some((m) => m.id === userId))
    .map((t) => t.id);
}

export function getUserAssignedUlbIds(userId) {
  const teamIds = getUserTeamIds(userId);
  const ulbIds = [];
  for (const [ulbId, assignment] of Object.entries(DUMMY_ULB_ASSIGNMENTS)) {
    const hasTeam = assignment.teams.some((tid) => teamIds.includes(tid));
    const hasIndividual = assignment.individuals.some((ind) => ind.id === userId);
    if (hasTeam || hasIndividual) ulbIds.push(ulbId);
  }
  return ulbIds;
}

export function getCurrentUserInfo() {
  const session = getSession();
  if (!session) return null;
  return DUMMY_ALLOCATION_USERS.find((u) => u.name === session.name) ?? null;
}

export function canAccessFile(file) {
  return true; // Temporary override to allow access to all files during development
  const session = getSession();
  if (!session) return false;

  // Partner and State Controller always have access
  if (session.role === "Partner" || session.role === "State Controller") return true;

  const userInfo = getCurrentUserInfo();
  if (!userInfo) return false;

  const userId = userInfo.id;

  // Check if user is assigned to this file's ULB
  const ulbId = getUlbIdByName(file.ulb);
  if (!ulbId) return false;

  const assignedUlbIds = getUserAssignedUlbIds(userId);
  if (!assignedUlbIds.includes(ulbId)) return false;

  // Apply deny list overrides
  const denied = file.deniedAccess;
  if (!denied) return true;

  if (denied.userIds?.includes(userId)) return false;

  const userTeamIds = getUserTeamIds(userId);
  if (userTeamIds.some((tid) => denied.teamIds?.includes(tid))) return false;

  return true;
}
