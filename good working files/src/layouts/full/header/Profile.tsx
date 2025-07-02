import { Button, Dropdown } from "flowbite-react";
import { useAuth } from "src/context/AuthContext";
import { Icon } from "@iconify/react";
import user1 from "/src/assets/images/profile/user-1.jpg";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "src/firebase";

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth(); // ✅ get user and profile from context

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/auth/login");
  };

  return (
    <div className="relative group/menu">
      <Dropdown
        label=""
        className="rounded-sm w-44"
        dismissOnClick={false}
        renderTrigger={() => (
          <span className="h-10 w-10 hover:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary">
            <img
              src={user1}
              alt="profile"
              height="35"
              width="35"
              className="rounded-full"
            />
          </span>
        )}
      >
        {/* Show user's name */}
        {profile?.name && (
          <Dropdown.Item disabled className="text-center text-xs text-gray-600 font-semibold">
            {profile.name}
          </Dropdown.Item>
        )}

        {/* Show user's email */}
        {user?.email && (
          <Dropdown.Item disabled className="text-center text-xs text-gray-500">
            {user.email}
          </Dropdown.Item>
        )}

        <Dropdown.Item className="px-3 py-3 flex items-center bg-hover group/link w-full gap-3 text-dark">
          <Icon icon="solar:user-circle-outline" height={20} />
          My Profile
        </Dropdown.Item>
        <Dropdown.Item className="px-3 py-3 flex items-center bg-hover group/link w-full gap-3 text-dark">
          <Icon icon="solar:letter-linear" height={20} />
          My Account
        </Dropdown.Item>
        <Dropdown.Item className="px-3 py-3 flex items-center bg-hover group/link w-full gap-3 text-dark">
          <Icon icon="solar:checklist-linear" height={20} />
          My Task
        </Dropdown.Item>

        <div className="p-3 pt-0">
          <Button
            onClick={handleLogout}
            size="sm"
            className="mt-2 border border-primary text-primary bg-transparent hover:bg-lightprimary outline-none focus:outline-none w-full"
          >
            Logout
          </Button>
        </div>
      </Dropdown>
    </div>
  );
};

export default Profile;
