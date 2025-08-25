"use client";
import React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import NavigationTrigger from "./NavigationTrigger";

interface SmartNewsNavbarProps {
  onNavigationToggle?: () => void;
  isNavOpen?: boolean;
}

export default function SmartNewsNavbar({
  onNavigationToggle,
  isNavOpen = false,
}: SmartNewsNavbarProps) {
  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return today.toLocaleDateString("en-US", options);
  };

  return (
    <>
      <nav className="bg-white">
        <div className="px-4 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Top Header */}
            <div className="py-3 border-b border-gray-200">
              <div className="flex items-center justify-between w-full">
                {/* Left - Date and Today's Paper */}
                <div className="flex flex-col text-sm text-gray-600">
                  <span className="font-medium">{getCurrentDate()}</span>
                  <Link
                    href="/smart-news/todays-paper"
                    className="hover:underline"
                  >
                    Today's Paper
                  </Link>
                </div>

                {/* Center - SMART NEWS Logo */}
                <div className="flex items-center justify-center flex-1">
                  <Link
                    href="/smart-news"
                    className="text-4xl font-bold text-black tracking-tight"
                    style={{ fontFamily: "Old English Text MT, serif" }}
                  >
                    Smart News
                  </Link>
                </div>

                {/* Right - Market Info and Navigation Trigger */}
                <div className="flex items-center space-x-4">
                  <div className="hidden md:flex text-sm text-gray-600">
                    <span className="font-medium">Dow</span>
                    <span className="ml-2 text-green-600">+1.1%</span>
                  </div>

                  {onNavigationToggle && (
                    <NavigationTrigger
                      onClick={onNavigationToggle}
                      isNavOpen={isNavOpen}
                      theme="dark"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="py-2 border-b border-gray-200">
              <div className="flex items-center justify-center">
                <div className="hidden md:flex items-center space-x-8">
                  <Link
                    href="/smart-news/politics"
                    className="flex items-center space-x-1 text-gray-700 hover:text-black transition-colors text-sm font-medium py-2"
                  >
                    <span>Politics</span>
                    <ChevronDown className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/smart-news/sports"
                    className="flex items-center space-x-1 text-gray-700 hover:text-black transition-colors text-sm font-medium py-2"
                  >
                    <span>Sports</span>
                    <ChevronDown className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/smart-news/entertainment"
                    className="flex items-center space-x-1 text-gray-700 hover:text-black transition-colors text-sm font-medium py-2"
                  >
                    <span>Entertainment</span>
                    <ChevronDown className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/smart-news/explore"
                    className="flex items-center space-x-1 text-gray-700 hover:text-black transition-colors text-sm font-medium py-2"
                  >
                    <span>Explore</span>
                    <ChevronDown className="w-3 h-3" />
                  </Link>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden flex items-center space-x-4 overflow-x-auto">
                  <Link
                    href="/smart-news/politics"
                    className="text-gray-700 hover:text-black transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Politics
                  </Link>
                  <Link
                    href="/smart-news/sports"
                    className="text-gray-700 hover:text-black transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Sports
                  </Link>
                  <Link
                    href="/smart-news/entertainment"
                    className="text-gray-700 hover:text-black transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Entertainment
                  </Link>
                  <Link
                    href="/smart-news/explore"
                    className="text-gray-700 hover:text-black transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
