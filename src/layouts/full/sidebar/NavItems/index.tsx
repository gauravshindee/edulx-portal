import React from "react";
import { ChildItem } from "../Sidebaritems";
import { Sidebar } from "flowbite-react";
import { Icon } from "@iconify/react";
import { Link, useLocation } from "react-router"; // Assuming 'react-router-dom' for Link

interface NavItemsProps {
  item: ChildItem;
}

const NavItems: React.FC<NavItemsProps> = ({ item }) => {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <>
      <Sidebar.Item
        to={item.url}
        as={Link}
        // These classes control the text color (and thus icon color due to inheritance)
        className={`${
          item.url == pathname
            ? "text-white bg-primary rounded-xl  hover:text-white hover:bg-primary dark:hover:text-white shadow-btnshdw active"
            : "text-link bg-transparent group/link "
        } `}
      >
        <span className="flex gap-3 items-center"> {/* Use items-center for vertical alignment */}
          {item.icon ? (
            // MODIFICATION HERE:
            // - Removed `${item.color}` as it's not defined in your data
            // - Added "text-xl" for a standard icon size (around 24px)
            // - Added "mr-3" for consistent spacing between icon and text
            // - Added "text-current" to ensure it inherits the parent link's color
            <Icon icon={item.icon} className="text-xl mr-3 text-current" />
          ) : (
            // This is your fallback dot if no icon is specified
            <span
              className={`${
                item.url == pathname
                  ? "dark:bg-white rounded-full mx-1.5 group-hover/link:bg-primary !bg-primary h-[6px] w-[6px]"
                  : "h-[6px] w-[6px] bg-black/40 dark:bg-white rounded-full mx-1.5 group-hover/link:bg-primary"
              } `}
            ></span>
          )}
          <span
            className={`max-w-36 overflow-hidden`}
          >
            {item.name}
          </span>
        </span>
      </Sidebar.Item>
    </>
  );
};

export default NavItems;