/* eslint-disable react/prop-types */
// src/components/Navbar.js
import { AiOutlineMenu } from "react-icons/ai";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/authProvider";
import ActiveCollectionSelect from "./components/ActiveCollectionSelect";
import { useSidebar } from "../ui/sidebar";

const Navbar = () => {
  const { setToken } = useAuth();
  const { toggleSidebar } = useSidebar();
  return (
    <div className=" tw-text-gray-800 tw-sticky tw-z-99 tw-bg-white tw-top-0 tw-left-0 tw-border-b tw-border-gray-200 tw-h-16 tw-flex tw-items-center tw-justify-between tw-px-4">
      <div className="tw-flex tw-items-center tw-space-x-3">
        <button onClick={toggleSidebar} className="tw-text-lg tw-font-semibold hover:tw-bg-gray-200 tw-p-2 tw-rounded-full">
          <AiOutlineMenu />
        </button>
        <ActiveCollectionSelect />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="tw-shadow-lg tw-border-2 tw-border-gray-500">
            <AvatarImage src="/logo.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setToken()}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Navbar;
