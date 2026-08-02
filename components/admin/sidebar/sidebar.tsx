"use client";

import { ChevronRight, LogOut, X } from "lucide-react";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sidebarItems, type AdminPortalRole } from "./sidebaritems";
import LogoutModal from "../logout-modal";
import { useAdminSession } from "@/hooks/use-admin-session";

const AppSidebar = () => {
  const pathname = usePathname();
  const { data: admin } = useAdminSession();
  const { state, setOpenMobile, isMobile } = useSidebar();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const adminRole = admin?.role as AdminPortalRole | undefined;

  const visibleItems = sidebarItems.filter(
    (item) => !item.roles || (adminRole && item.roles.includes(adminRole))
  );

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-0">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg">
              <Image
                src="/images/acm_logo.png"
                alt="Logo"
                width={32}
                height={32}
              />
            </div>
            {state === "expanded" && (
              <span className="text-2xl font-bold tracking-tight text-primary dark:text-muted-foreground">
                ACM Events
              </span>
            )}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseSidebar}
                className="ml-auto h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </SidebarHeader>

        <ScrollArea className="flex-1">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className={state === "collapsed" ? "" : "px-3"}>
                  {visibleItems.map((item) => {
                    const isDeep = (href: string) =>
                      href.split("/").filter(Boolean).length > 1;
                    const isLinkActive = (href: string) =>
                      pathname === href ||
                      (isDeep(href) && pathname.startsWith(href + "/"));
                    const isActive =
                      isLinkActive(item.href) ||
                      item.subItems?.some((sub) => isLinkActive(sub.href));

                    if (item.subItems) {
                      return (
                        <Collapsible
                          key={item.label}
                          defaultOpen={isActive}
                          className="group/collapsible"
                        >
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              render={<CollapsibleTrigger />}
                              tooltip={item.label}
                              isActive={isActive}
                              className="h-9"
                            >
                              {item.icon && <item.icon size={18} />}
                              <span>{item.label}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.subItems.map((subItem) => (
                                  <SidebarMenuSubItem key={subItem.label}>
                                    <SidebarMenuSubButton
                                      render={
                                        <Link
                                          href={subItem.href}
                                          onClick={handleLinkClick}
                                        />
                                      }
                                      isActive={isLinkActive(subItem.href)}
                                    >
                                      <span>{subItem.label}</span>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          render={
                            <Link href={item.href} onClick={handleLinkClick} />
                          }
                          isActive={isActive}
                          tooltip={item.label}
                          className="h-9"
                        >
                          {item.icon && <item.icon size={18} />}
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Logout"
                      className="mt-4"
                      onClick={() => setShowLogoutModal(true)}
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </ScrollArea>
      </Sidebar>
      <LogoutModal
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
      />
    </>
  );
};

export default AppSidebar;
