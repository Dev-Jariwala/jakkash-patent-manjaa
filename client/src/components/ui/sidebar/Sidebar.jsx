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


const data = {
    navMain: [
        {
            title: 'Dashboard',
            icon: DashboardSvg,
            link: '/',
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
            <SidebarComponent className='tw-shadow-xl' collapsible="icon" style={{ fontFamily: 'Nunito, "Segoe UI", arial' }} >
                <SidebarHeader className="tw-mb-3">
                    <SidebarMenu>
                        <SidebarMenuItem asChild>
                            <Link className="tw-flex tw-items-center tw-gap-1 hover:tw-bg-gray-200 tw-rounded-lg tw-h-12 tw-cursor-pointer">
                                <Avatar className="tw-w-9 tw-h-9 tw-mx-2 tw-border-2 tw-border-gray-400">
                                    <AvatarImage
                                        src={`/logo.png`}
                                    />
                                    <AvatarFallback></AvatarFallback>
                                </Avatar>
                                <div className="group-data-[collapsible=icon]:tw-hidden">
                                    <div className={`tw-font-semibold tw-text-xl`}>Jakkash</div>
                                    {/* <div className={`tw-text-xs`}>patent manja</div> */}
                                </div>
                            </Link>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        {/* <SidebarGroupLabel>Collections</SidebarGroupLabel> */}
                        <SidebarMenu className="tw-space-y-">
                            {data.navMain.map((item) => (
                                <React.Fragment key={item.title}>
                                    {item.isCollapsible ? (
                                        <Collapsible asChild defaultOpen={isActive(item.link)} className="tw-group/collapsible">
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton tooltip={item.title} isActive={isActive(item.link)}>
                                                        {item.icon && <item.icon />}
                                                        <span>{item.title}</span>
                                                        <ChevronRight className="tw-ml-auto tw-transition-transform tw-duration-200 group-data-[state=open]/collapsible:tw-rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {item.items?.map((subItem) => (
                                                            <SidebarMenuSubItem key={subItem.title}>
                                                                <SidebarMenuSubButton asChild isActive={isActiveSubMenu(subItem.link)} aria-disabled={subItem.isDisabled}>
                                                                    <Link className="tw-no-underline" to={subItem.link}>
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
                                                <Link className={cn("tw-no-underline tw-text-inherit !tw-h-10 ", isActive(item.link) ? '!tw-bg-indigo-200 !tw-text-gray-700' : 'hover:!tw-bg-gray-200')} to={item.link}>
                                                    <span className="tw-mx-1">
                                                        {item.icon && <item.icon />}
                                                    </span>
                                                    <span className=" tw-animate-fade tw-animate-duration-300">{item.title}</span>
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
            <SidebarInset className='tw-flex tw-flex-col tw-relative tw-w-full tw-h-[100dvh]'>
                <Navbar />
                <main className=" tw-flex-1 tw-overflow-y-auto tw-h-[calc(100dvh-4rem)]">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default Sidebar