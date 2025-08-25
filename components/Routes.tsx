"use client";
import React from "react";
import Link from "next/link";
import { Newspaper, Eye, Store, Video, Users } from "lucide-react";

interface RouteCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const routes: RouteCard[] = [
  {
    id: "expose-corner",
    title: "Expose Corner",
    description: "Uncover hidden truths and investigative stories that matter",
    href: "/expose-corner",
    icon: <Eye className="w-12 h-12" />,
  },
  {
    id: "smart-news",
    title: "Smart News",
    description: "Stay informed with intelligent news curation and analysis",
    href: "/smart-news",
    icon: <Newspaper className="w-12 h-12" />,
  },
  {
    id: "store",
    title: "Store",
    description: "Discover exclusive merchandise and premium products",
    href: "/store",
    icon: <Store className="w-12 h-12" />,
  },
  {
    id: "videos-podcast",
    title: "Videos & Podcast",
    description: "Watch and listen to engaging multimedia content",
    href: "/video-and-podcast",
    icon: <Video className="w-12 h-12" />,
  },
  {
    id: "community",
    title: "Community",
    description: "Connect with like-minded individuals and share ideas",
    href: "/community",
    icon: <Users className="w-12 h-12" />,
  },
];

const Routes = () => {
  console.log("Routes component rendering");
  return (
    <section className="py-20 bg-gray-50 relative z-10">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-wide">
            Explore Sections
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover different areas of our platform and find what interests you
            most
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {routes.map((route) => (
            <Link key={route.id} href={route.href}>
              <div className="bg-white rounded-3xl p-8 hover:shadow-xl transition-all duration-300 cursor-pointer group h-80 flex flex-col items-center justify-center text-center border border-gray-100">
                {/* Icon */}
                <div className="text-gray-700 mb-6 group-hover:scale-110 transition-transform duration-300">
                  {route.icon}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {route.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed">
                  {route.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Routes;
