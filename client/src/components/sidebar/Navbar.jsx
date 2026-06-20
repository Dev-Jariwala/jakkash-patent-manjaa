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
import BillScanner from "./components/BillScanner";
import { useSidebar } from "../ui/sidebar";
import { ModeToggle } from "@/components/ui/mode-toggle";

const Navbar = () => {
  const { setToken } = useAuth();
  const { toggleSidebar } = useSidebar();
  return (
    <div className="sticky z-99 bg-background text-foreground top-0 left-0 border-b border-border h-16 flex items-center justify-between px-4">
      <div className="flex items-center space-x-3">
        <button onClick={toggleSidebar} className="text-lg font-semibold hover:bg-accent p-2 rounded-full">
          <AiOutlineMenu />
        </button>
        <ActiveCollectionSelect />
        <BillScanner />
      </div>

      <div className="flex items-center gap-3">
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="shadow-lg border-2 border-border">
              <AvatarImage src="/logo.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setToken()}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;
