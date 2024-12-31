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
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <div className={`tw-flex tw-items-center tw-animate-fade tw-animate-duration-300 tw-justify-start tw-space-x-5`}>
                                <span className="tw-text-3xl">
                                    <Avatar>
                                        <AvatarImage
                                            src={`${import.meta.env.VITE_BACKEND_URL}imgs/logo.png`}
                                        />
                                        <AvatarFallback></AvatarFallback>
                                    </Avatar>
                                </span>
                                <span className={`tw-block tw-text-2xl tw-animate-fade tw-animate-duration-300`}>
                                    Jakkash
                                </span>
                            </div>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel></SidebarGroupLabel>
                        <SidebarMenu>
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
                                                <Link className="tw-no-underline tw-text-inherit" to={item.link}>
                                                    {item.icon && <item.icon />}
                                                    <span>{item.title}</span>
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