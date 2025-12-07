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
    <div className=" text-gray-800 sticky z-99 bg-white top-0 left-0 border-b border-gray-200 h-16 flex items-center justify-between px-4">
      <div className="flex items-center space-x-3">
        <button onClick={toggleSidebar} className="text-lg font-semibold hover:bg-gray-200 p-2 rounded-full">
          <AiOutlineMenu />
        </button>
        <ActiveCollectionSelect />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="shadow-lg border-2 border-gray-500">
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
