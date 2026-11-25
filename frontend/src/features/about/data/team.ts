export interface TeamMember {
  initials: string;
  name: string;
  roleKey: string;
  color: "green" | "beige";
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    initials: "SD",
    name: "Santiago Dimas González",
    roleKey: "about.team.memberRole",
    color: "green",
  },
  {
    initials: "CL",
    name: "Claudia Nicol López Reyes",
    roleKey: "about.team.memberRole",
    color: "beige",
  },
  {
    initials: "JM",
    name: "Jessica Marcelino López",
    roleKey: "about.team.memberRole",
    color: "green",
  },
  {
    initials: "CM",
    name: "Cristian Enrique Mendieta Mondragón",
    roleKey: "about.team.memberRole",
    color: "beige",
  },
  {
    initials: "UM",
    name: "Uriel Miranda Ferreyra",
    roleKey: "about.team.memberRole",
    color: "green",
  },
  {
    initials: "MM",
    name: "Mia Paulina Moya Rivera",
    roleKey: "about.team.memberRole",
    color: "beige",
  },
];
