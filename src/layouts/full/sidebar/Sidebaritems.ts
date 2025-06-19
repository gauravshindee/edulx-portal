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
        icon: "solar:user-circle-linear", // Changed from airbuds
        id: uniqueId(),
        url: "/student/my-profile",
      },
      {
        name: "Application Tracking",
        icon: "solar:checklist-minimalistic-outline", // Changed from bedside-table
        id: uniqueId(),
        url: "/student/applications",
      },
      {
        name: "Document Upload",
        icon: "solar:archive-up-minimlistic-linear", // Changed from text-circle
        id: uniqueId(),
        url: "/student/documents",
      },
      {
        name: "SOP Questionaire",
        icon: "solar:document-text-linear", // Changed from password-minimalistic
        id: uniqueId(),
        url: "/student/SopQuestionnaire",
      },

    ],
  },
  {
    heading: "FINANCES",
    children: [
      {
        name: "Edulx Payments",
        icon: "solar:wallet-money-line-duotone", // Suggested: A wallet/money icon
        id: uniqueId(),
        url: "/student/edulxpayments",
      },
      {
        name: "Total Expenses",
        icon: "solar:money-bag-line-duotone", // Suggested: A receipt/bill icon
        id: uniqueId(),
        url: "/student/totalexpense",
      },
    ],
  },
  {
    heading: "EDUCATION",
    children: [
      {
        name: "Study Material",
        icon: "solar:book-linear", // Suggested: A book icon
        id: uniqueId(),
        url: "/student/studymaterial",
      },
      {
        name: "Mock Tests",
        icon: "solar:map-point-school-linear", // Suggested: A notebook/test icon
        id: uniqueId(),
        url: "/student/MockTest",
      },
    ],
  },
];

export default SidebarContent;