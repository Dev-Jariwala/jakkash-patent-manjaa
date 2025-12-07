/* eslint-disable react/prop-types */
import * as React from "react"
import { ChevronRight } from 'lucide-react';
// import { UserNav } from '@/components/ui/Layouts/user-nav';

import { Separator } from "@/components/ui/separator"
import { Sidebar as SidebarComponent, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarTrigger, } from "@/components/ui/sidebar"

import { Collapsible, CollapsibleContent, CollapsibleTrigger, } from "@/components/ui/collapsible"
import { Link, Outlet, useLocation } from "react-router-dom";
// import { ModeToggle } from "../ui/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/sidebar/Navbar";
import DashboardSvg from "@/components/svgs/DashboardSvg";
import ProductSvg from "@/components/svgs/ProductSvg";
import StocksSvg from "@/components/svgs/StocksSvg";
import BillSvg from "@/components/svgs/BillSvg";
import ClientSvg from "@/components/svgs/ClientSvg";
import PurchaseSvg from "@/components/svgs/PurchaseSvg";
import AnalyticsSvg from "@/components/svgs/AnalyticsSvg";
import { cn } from "@/lib/utils";
import CollectionsSvg from "@/components/svgs/Collections";


const data = {
    navMain: [
        {
            title: 'Dashboard',
            icon: DashboardSvg,
            link: '/',
            isCollapsible: false,
        },
        {
            title: 'Collections',
            icon: CollectionsSvg,
            link: '/collections',
            isCollapsible: false,
        },
        {
            title: 'Products',
            icon: ProductSvg,
            link: '/products',
            isCollapsible: false,
        },
        {
            title: 'Stocks',
            icon: StocksSvg,
            link: '/stocks',
            isCollapsible: false,
        },
        {
            title: 'Bills',
            icon: BillSvg,
            link: '/bills',
            isCollapsible: false,
        },
        {
            title: 'Clients',
            icon: ClientSvg,
            link: '/clients',
            isCollapsible: false,
        },
        {
            title: 'Purchases',
            icon: PurchaseSvg,
            link: '/purchases',
            isCollapsible: false,
        },
        {
            title: 'Analytics',
            icon: AnalyticsSvg,
            link: '/analytics',
            isCollapsible: false,
        },
        // {
        //     title: 'Admin',
        //     // icon: AdminSvg,
        //     link: '/admin',
        //     isCollapsible: true,
        //     items: [
        //         {
        //             title: 'Roles & Permissions',
        //             link: '/admin/roles'
        //         },
        //         {
        //             title: 'Login Activity Logs',
        //             link: '/admin/login-activity-logs'
        //         }
        //     ]
        // },
    ]
}

const Sidebar = () => {

    const location = useLocation()

    const isActive = (link) => {
        return location.pathname.split('/')[1] === link.split('/')[1]
    }

    const isActiveSubMenu = (link) => {
        return location.pathname.split('/')[2] === link.split('/')[2]
    }

    return (
        <SidebarProvider>
            <SidebarComponent className='shadow-xl' collapsible="icon" style={{ fontFamily: 'Nunito, "Segoe UI", arial' }} >
                <SidebarHeader className="mb-3">
                    <SidebarMenu>
                        <SidebarMenuItem asChild>
                            <Link className="flex items-center gap-1 hover:bg-gray-200 rounded-lg h-12 cursor-pointer">
                                <Avatar className="w-9 h-9 mx-2 border-2 border-gray-400">
                                    <AvatarImage
                                        src={`/logo.png`}
                                    />
                                    <AvatarFallback></AvatarFallback>
                                </Avatar>
                                <div className="group-data-[collapsible=icon]:hidden">
                                    <div className={`font-semibold text-xl`}>Jakkash</div>
                                    {/* <div className={`text-xs`}>patent manja</div> */}
                                </div>
                            </Link>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        {/* <SidebarGroupLabel>Collections</SidebarGroupLabel> */}
                        <SidebarMenu className="space-y-">
                            {data.navMain.map((item) => (
                                <React.Fragment key={item.title}>
                                    {item.isCollapsible ? (
                                        <Collapsible asChild defaultOpen={isActive(item.link)} className="group/collapsible">
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton tooltip={item.title} isActive={isActive(item.link)}>
                                                        {item.icon && <item.icon />}
                                                        <span>{item.title}</span>
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {item.items?.map((subItem) => (
                                                            <SidebarMenuSubItem key={subItem.title}>
                                                                <SidebarMenuSubButton asChild isActive={isActiveSubMenu(subItem.link)} aria-disabled={subItem.isDisabled}>
                                                                    <Link className="no-underline" to={subItem.link}>
                                                                        <span>{subItem.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    ) : (
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive(item.link)}
                                                tooltip={item.title}
                                            >
                                                <Link className={cn("no-underline text-inherit !h-10 ", isActive(item.link) ? '!bg-indigo-200 !text-gray-700' : 'hover:!bg-gray-200')} to={item.link}>
                                                    <span className="mx-1">
                                                        {item.icon && <item.icon />}
                                                    </span>
                                                    <span className=" animate-fade animate-duration-300">{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )}
                                </React.Fragment>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarRail />
            </SidebarComponent>
            <SidebarInset className='flex flex-col relative w-full h-[100dvh]'>
                <Navbar />
                <main className=" flex-1 overflow-y-auto h-[calc(100dvh-4rem)]">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default Sidebar