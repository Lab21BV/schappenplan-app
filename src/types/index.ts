export type Role = "VERKOPER" | "HOOFDKANTOOR";

export type DisplayType = "STROK" | "WANDBORD" | "DISPLAYBORD";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  showroomId: string | null;
  showroomName: string | null;
}

export interface CategoryTree {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  children: CategoryTree[];
}
