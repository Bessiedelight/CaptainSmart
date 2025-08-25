"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import SmartNewsNavbar from "@/components/SmartNewsNavbar";
import Navigation from "@/components/Navigation";

export default function SmartNewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const pathname = usePathname();

  // Only show the old navbar on sub-routes, not on the main smart-news page
  const isMainPage = pathname === "/smart-news";

  return (
    <div className="min-h-screen">
      {!isMainPage && (
        <>
          <SmartNewsNavbar
            onNavigationToggle={() => setIsNavOpen(true)}
            isNavOpen={isNavOpen}
          />
          <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
        </>
      )}
      <main>{children}</main>
    </div>
  );
}
