"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag, User } from "lucide-react";

export default function StoreNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-black text-white py-4 px-6 lg:px-12">
      <div className="flex items-center justify-between">
        {/* Logo with Text */}
        <Link href="/" className="flex items-center space-x-3">
          <ShoppingBag className="w-8 h-8 text-[#D4A299]" />
          <span className="text-xl font-bold text-white tracking-wide">
            MERCHANDISE STORE
          </span>
        </Link>

        {/* Centered Navigation Links */}
        <div className="hidden md:flex items-center justify-center flex-1">
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="text-white hover:text-[#D4A299] transition-colors font-medium tracking-wide"
            >
              Home
            </Link>
            <Link
              href="/store"
              className="text-[#D4A299] hover:text-[#C4928A] transition-colors font-medium tracking-wide"
            >
              Store
            </Link>
            <Link
              href="/smart-news"
              className="text-white hover:text-[#D4A299] transition-colors font-medium tracking-wide"
            >
              Smart News
            </Link>
            <Link
              href="/video-and-podcast"
              className="text-white hover:text-[#D4A299] transition-colors font-medium tracking-wide"
            >
              Media
            </Link>
          </div>
        </div>

        {/* Right Side Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            className="flex items-center space-x-2 text-white px-4 py-2 rounded-md font-medium transition-colors border hover:bg-[#D4A299]/10"
            style={{ borderColor: "#D4A299" }}
          >
            <User className="w-4 h-4" />
            <span>Account</span>
          </button>
          <button
            className="text-white px-6 py-2 rounded-md font-medium transition-colors border"
            style={{ borderColor: "#D4A29980" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "#C4928A80")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "#D4A29980")
            }
          >
            Cart (0)
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white p-2" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4">
          <div className="flex flex-col space-y-4">
            <Link
              href="/"
              className="text-white hover:text-[#D4A299] transition-colors font-medium tracking-wide"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/store"
              className="text-[#D4A299] hover:text-[#C4928A] transition-colors font-medium tracking-wide"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Store
            </Link>
            <Link
              href="/smart-news"
              className="text-white hover:text-[#D4A299] transition-colors font-medium tracking-wide"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Smart News
            </Link>
            <Link
              href="/video-and-podcast"
              className="text-white hover:text-[#D4A299] transition-colors font-medium tracking-wide"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Media
            </Link>
            <div className="pt-4 space-y-3">
              <button
                className="w-full flex items-center justify-center space-x-2 text-white px-4 py-2 rounded-md font-medium transition-colors border hover:bg-[#D4A299]/10"
                style={{ borderColor: "#D4A299" }}
              >
                <User className="w-4 h-4" />
                <span>Account</span>
              </button>
              <button
                className="w-full text-white px-6 py-2 rounded-md font-medium transition-colors border-2"
                style={{ borderColor: "#D4A29980" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#C4928A80")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#D4A29980")
                }
              >
                Cart (0)
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
