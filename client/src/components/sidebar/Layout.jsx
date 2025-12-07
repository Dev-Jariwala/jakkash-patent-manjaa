import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import { Store } from "lucide-react";
import BillSvg from "../svgs/BillSvg";
import DashboardSvg from "../svgs/DashboardSvg";
import StocksSvg from "../svgs/StocksSvg";
import ProductSvg from "../svgs/ProductSvg";
import ClientSvg from "../svgs/ClientSvg";
import PurchaseSvg from "../svgs/PurchaseSvg";
import AnalyticsSvg from "../svgs/AnalyticsSvg";
import CollectionsSvg from "../svgs/Collections";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const tabs = [
    {
      link: "/",
      label: "Dashboard",
      icon: <DashboardSvg />,
      active: [""],
    },
    {
      link: "/collections",
      label: "Collections",
      icon: <CollectionsSvg />,
      active: ["collections"],
    },
    {
      link: "/products",
      label: "Products",
      icon: <ProductSvg />,
      active: ["products"],
    },
    {
      link: "/stocks",
      label: "Stocks",
      icon: <StocksSvg />,
      active: ["stocks"],
    },
    {
      link: "/bills",
      label: "Bills",
      icon: <BillSvg />,
      active: ["bills"],
    },
    {
      link: "/clients",
      label: "Clients",
      icon: <ClientSvg />,
      active: ["clients"],
    },
    {
      link: "/purchases",
      label: "Purchases",
      icon: <PurchaseSvg />,
      active: ["purchases"],
    },
    {
      link: "/analytics",
      label: "Analytics",
      icon: <AnalyticsSvg />,
      active: ["analytics"],
    },
  ];
  return (
    <>
      <div className="flex">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          tabs={tabs}
          toggleSidebar={toggleSidebar}
        />
        <div className="flex flex-col relative w-full h-[100dvh]">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className=" flex-1 overflow-y-auto h-[calc(100dvh-4rem)]">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default Layout;
