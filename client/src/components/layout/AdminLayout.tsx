"use client";

import { useState } from "react";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  return (
    <div className="flex min-h-screen bg-[#f6f7f9]">

      <Sidebar collapsed={sidebarCollapsed} />

      <div
        className={`
          flex min-h-screen min-w-0 flex-1 flex-col
          transition-all duration-300
        `}
      >

        <Navbar
          toggleSidebar={() =>
            setSidebarCollapsed(
              !sidebarCollapsed
            )
          }
        />


        <main className="min-w-0 flex-1 px-5 py-6 md:px-7 lg:px-8 xl:px-9">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>


      </div>

    </div>
  );
}