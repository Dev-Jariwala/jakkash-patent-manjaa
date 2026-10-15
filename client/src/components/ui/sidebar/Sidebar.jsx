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
import OrderSvg from "@/components/svgs/OrderSvg";
import ClientSvg from "@/components/svgs/ClientSvg";
import PurchaseSvg from "@/components/svgs/PurchaseSvg";
import AnalyticsSvg from "@/components/svgs/AnalyticsSvg";
import { cn } from "@/lib/utils";
import CollectionsSvg from "@/components/svgs/Collections";
import MastersSvg from "@/components/svgs/MastersSvg";
import BankSvg from "@/components/svgs/BankSvg";
import { Settings as SettingsIcon } from "lucide-react";

const SettingsNavIcon = () => <SettingsIcon className="w-6 h-6" strokeWidth={1.75} />;


const data = {
    navMain: [
        {
            title: 'Dashboard',
            icon: DashboardSvg,
            iconScale: 1.11,
            link: '/',
            isCollapsible: false,
        },
        {
            title: 'Collections',
            icon: CollectionsSvg,
            iconScale: 0.92,
            link: '/collections',
            isCollapsible: false,
        },
        {
            title: 'Products',
            icon: ProductSvg,
            iconScale: 0.96,
            link: '/products',
            isCollapsible: false,
        },
        {
            title: 'Stocks',
            icon: StocksSvg,
            iconScale: 0.9,
            link: '/stocks',
            isCollapsible: false,
        },
        {
            title: 'Orders',
            icon: OrderSvg,
            iconScale: 1.17,
            link: '/orders',
            isCollapsible: false,
        },
        {
            title: 'Bills',
            icon: BillSvg,
            iconScale: 0.98,
            link: '/bills',
            isCollapsible: false,
        },
        {
            title: 'Clients',
            icon: ClientSvg,
            iconScale: 0.94,
            link: '/clients',
            isCollapsible: false,
        },
        {
            title: 'Purchases',
            icon: PurchaseSvg,
            iconScale: 1.01,
            link: '/purchases',
            isCollapsible: false,
        },
        {
            title: 'Analytics',
            icon: AnalyticsSvg,
            iconScale: 0.92,
            link: '/analytics',
            isCollapsible: false,
        },
        {
            title: 'Masters',
            icon: MastersSvg,
            iconScale: 1.15,
            link: '/masters',
            isCollapsible: false,
        },
        {
            title: 'Bank details',
            icon: BankSvg,
            iconScale: 1.06,
            link: '/bank-details',
            isCollapsible: false,
        },
        {
            title: 'Settings',
            icon: SettingsNavIcon,
            iconScale: 0.96,
            link: '/settings',
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
                            <Link className="flex items-center gap-1 hover:bg-sidebar-accent rounded-lg h-12 cursor-pointer">
                                <Avatar className="w-9 h-9 mx-2 border-2 border-sidebar-border">
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
                                                <Link className={cn("no-underline text-inherit !h-10 ", isActive(item.link) ? '!bg-sidebar-accent !text-sidebar-accent-foreground' : 'hover:!bg-sidebar-accent')} to={item.link}>
                                                    <span
                                                        className="mx-1 flex size-6 shrink-0 items-center justify-center [&_img]:object-contain"
                                                        style={{ transform: `scale(${item.iconScale ?? 1})` }}
                                                    >
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
            <SidebarInset className='flex flex-col relative w-full h-[100dvh] bg-background'>
                <Navbar />
                {/* `relative` keeps this the containing block for absolutely
                    positioned descendants (e.g. the hidden input Radix Checkbox
                    renders). Without it they anchor to SidebarInset, escape this
                    element's overflow clip, and stretch the document past the
                    viewport — which shows up as a second, dead scrollbar. */}
                <main className="relative flex-1 overflow-y-auto h-[calc(100dvh-4rem)]">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default Sidebar