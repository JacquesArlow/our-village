export const accountRoles = [
  "patient",
  "receptionist",
  "doctor",
  "admin",
] as const;
export type AccountRole = (typeof accountRoles)[number];

export const accountRoleLabels: Record<AccountRole, string> = {
  patient: "Patient",
  receptionist: "Receptionist",
  doctor: "Doctor",
  admin: "Administrator",
};

export function accountHome(role: AccountRole) {
  if (role === "admin") return "/admin";
  if (role === "doctor") return "/doctor";
  if (role === "receptionist") return "/reception";
  return "/account";
}
