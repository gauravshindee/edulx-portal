export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: any;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: any;
}

import { uniqueId } from "lodash";

const SidebarContent: MenuItem[] = [
  {
    heading: "HOME",
    children: [
      {
        name: "Edulx Overview",
        icon: "solar:widget-add-line-duotone",
        id: uniqueId(),
        url: "/",
      },
    ],
  },
  {
    heading: "STUDENT OVERVIEW",
    children: [
      {
        name: "My Profile",
        icon: "solar:airbuds-case-charge-outline",
        id: uniqueId(),
        url: "/student/my-profile",
      },
      {
        name: "Application Tracking",
        icon: "solar:bedside-table-3-linear",
        id: uniqueId(),
        url: "/ui/table",
      },
      {
        name: "Document Upload",
        icon: "solar:text-circle-outline",
        id: uniqueId(),
        url: "/student/documents",
      },
      {
        name: "SOP Questionaire",
        icon: "solar:password-minimalistic-outline",
        id: uniqueId(),
        url: "/student/SopQuestionnaire",
      },
    
    ],
  },
  {
    heading: "AUTH",
    children: [
      {
        name: "Login",
        icon: "solar:login-2-linear",
        id: uniqueId(),
        url: "/auth/login",
      },
      {
        name: "Register",
        icon: "solar:shield-user-outline",
        id: uniqueId(),
        url: "/auth/register",
      },
    ],
  },
  {
    heading: "EXTRA",
    children: [
      {
        name: "Icons",
        icon: "solar:smile-circle-outline",
        id: uniqueId(),
        url: "/icons/solar",
      },
      {
        name: "Sample Page",
        icon: "solar:notes-minimalistic-outline",
        id: uniqueId(),
        url: "/sample-page",
      },
    ],
  },
];

export default SidebarContent;
