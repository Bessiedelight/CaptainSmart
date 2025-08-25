"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, Plus, Home } from "lucide-react";

export default function ExposeCornerNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-black text-white py-4 px-6 lg:px-12">
      <div className="flex items-center justify-between">
        {/* Logo with Text */}
        <Link href="/" className="flex items-center space-x-3">
          <svg
            width="40"
            height="38"
            viewBox="0 0 122 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="60.5" cy="60.5" r="12.5" fill="#D4A299" />
            <circle cx="61" cy="61" r="32" stroke="#D4A299" strokeWidth="13" />
            <circle cx="114.5" cy="59.5" r="7.5" fill="#D4A299" />
            <circle
              cx="48.4914"
              cy="112.416"
              r="7.5"
              transform="rotate(105 48.4914 112.416)"
              fill="#D4A299"
            />
            <circle
              cx="15.1597"
              cy="32.2331"
              r="7.5"
              transform="rotate(-163.235 15.1597 32.2331)"
              fill="#D4A299"
            />
            <circle
              cx="74.3445"
              cy="8.34457"
              r="7.5"
              transform="rotate(-73.2353 74.3445 8.34457)"
              fill="#D4A299"
            />
            <circle cx="110.5" cy="83.5" r="7.5" fill="#D4A299" />
            <circle
              cx="24.9493"
              cy="100.342"
              r="7.5"
              transform="rotate(105 24.9493 100.342)"
              fill="#D4A299"
            />
            <circle
              cx="94.6292"
              cy="19.9858"
              r="7.5"
              transform="rotate(-73.2353 94.6292 19.9858)"
              fill="#D4A299"
            />
            <circle cx="94.5" cy="102.5" r="7.5" fill="#D4A299" />
            <circle
              cx="10.1856"
              cy="81.1856"
              r="7.5"
              transform="rotate(105 10.1856 81.1856)"
              fill="#D4A299"
            />
            <circle
              cx="31.1945"
              cy="16.1323"
              r="7.5"
              transform="rotate(-163.235 31.1945 16.1323)"
              fill="#D4A299"
            />
            <circle
              cx="108.445"
              cy="35.3794"
              r="7.5"
              transform="rotate(-73.2353 108.445 35.3794)"
              fill="#D4A299"
            />
            <circle cx="71.5" cy="112.5" r="7.5" fill="#D4A299" />
            <circle
              cx="8.1856"
              cy="57.1856"
              r="7.5"
              transform="rotate(105 8.1856 57.1856)"
              fill="#D4A299"
            />
            <circle
              cx="53.5173"
              cy="8.36865"
              r="7.5"
              transform="rotate(-163.235 53.5173 8.36865)"
              fill="#D4A299"
            />
          </svg>
          <span className="text-xl font-bold text-white tracking-wide">
            EXPOSE CORNER
          </span>
        </Link>

        {/* Centered Navigation Links */}
        <div className="hidden md:flex items-center justify-center flex-1">
          <div className="flex items-center space-x-8">
            <Link
              href="/expose-corner"
              className="text-white hover:text-orange-400 transition-colors font-medium tracking-wide"
            >
              Feed
            </Link>
            <Link
              href="/expose-corner/create"
              className="text-white hover:text-orange-400 transition-colors font-medium tracking-wide"
            >
              Create Exposé
            </Link>
            <Link
              href="/"
              className="text-white hover:text-orange-400 transition-colors font-medium tracking-wide"
            >
              Home
            </Link>
            <Link
              href="/smart-news"
              className="text-white hover:text-orange-400 transition-colors font-medium tracking-wide"
            >
              Smart News
            </Link>
          </div>
        </div>

        {/* Right Side Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/expose-corner/create">
            <button
              className="flex items-center space-x-2 text-white px-4 py-2 rounded-md font-medium transition-colors border hover:bg-orange-600/10"
              style={{ borderColor: "#D4A299" }}
              title="Create a new anonymous exposé"
            >
              <Plus className="w-4 h-4" />
              <span>New Exposé</span>
            </button>
          </Link>
          <Link href="/">
            <button
              className="flex items-center space-x-2 text-white px-4 py-2 rounded-md font-medium transition-colors border"
              style={{ borderColor: "#D4A29980" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#B8927080")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#D4A29980")
              }
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
          </Link>
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
              href="/expose-corner"
              className="text-white hover:text-orange-400 transition-colors font-medium tracking-wide"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Feed
            </Link>
            <Link
              href="/expose-corner/create"
              className="text-white hover:text-orange-400 transition-colors font-medium tracking-wide"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Create Exposé
            </Link>
            <Link
              href="/"
              className="text-white hover:text-orange-400 transition-colors font-medium tracking-wide"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/smart-news"
              className="text-white hover:text-orange-400 transition-colors font-medium tracking-wide"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Smart News
            </Link>
            <div className="pt-4 space-y-3">
              <Link href="/expose-corner/create">
                <button
                  className="w-full flex items-center justify-center space-x-2 text-white px-4 py-2 rounded-md font-medium transition-colors border hover:bg-orange-600/10"
                  style={{ borderColor: "#D4A299" }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Plus className="w-4 h-4" />
                  <span>New Exposé</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
