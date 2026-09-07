export const ROLES = [
  "PLATFORM_OWNER",
  "PRINCIPAL",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "BURSAR",
  "LIBRARIAN",
  "TRANSPORT_OFFICER",
] as const;

export type RoleName = (typeof ROLES)[number];

export const ROLE_LABELS: Record<RoleName, string> = {
  PLATFORM_OWNER: "Platform Owner",
  PRINCIPAL: "Principal",
  ADMIN: "Administrator",
  TEACHER: "Teacher",
  STUDENT: "Student",
  GUARDIAN: "Guardian",
  BURSAR: "Bursar",
  LIBRARIAN: "Librarian",
  TRANSPORT_OFFICER: "Transport Officer",
};

// Where a role lands after login.
export const ROLE_HOME: Record<RoleName, string> = {
  PLATFORM_OWNER: "/admin",
  PRINCIPAL: "/admin",
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
  GUARDIAN: "/guardian",
  BURSAR: "/bursar",
  LIBRARIAN: "/library",
  TRANSPORT_OFFICER: "/transport",
}

// Which top-level dashboard section a role may enter.
export const ROLE_SECTION_ACCESS: Record<RoleName, string[]> = {
  PLATFORM_OWNER: ["/admin", "/teacher", "/student", "/guardian", "/bursar", "/library", "/transport"],
  PRINCIPAL: ["/admin", "/teacher", "/bursar", "/library", "/transport"],
  ADMIN: ["/admin", "/library", "/transport"],
  TEACHER: ["/teacher"],
  STUDENT: ["/student"],
  GUARDIAN: ["/guardian"],
  BURSAR: ["/bursar"],
  LIBRARIAN: ["/library"],
  TRANSPORT_OFFICER: ["/transport"],
};

export function canAccessSection(role: string, pathname: string): boolean {
  const allowed = ROLE_SECTION_ACCESS[role as RoleName] ?? [];
  return allowed.some((base) => pathname === base || pathname.startsWith(base + "/"));
}
