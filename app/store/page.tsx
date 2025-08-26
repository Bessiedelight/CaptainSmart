"use client";

import React, { useState, ChangeEvent } from "react";
import Link from "next/link";
import { Filter, Search, X } from "lucide-react";
import StoreNav from "@/components/StoreNav";

const categories = [
  "All",
  "APPAREL",
  "ACCESSORIES",
  "MUGS",
  "STICKERS",
  "BOTTLES",
  "CAPS",
];

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
}

const dummyProducts: Product[] = [
  {
    id: "1",
    name: "Premium T-Shirt",
    description: "Comfortable cotton blend t-shirt with modern fit",
    price: 29.99,
    image: "/shirt.png",
    category: "APPAREL",
    inStock: true,
  },
  {
    id: "2",
    name: "Coffee Mug",
    description: "Ceramic mug perfect for your morning coffee",
    price: 14.99,
    image: "/shirt.png",
    category: "MUGS",
    inStock: true,
  },
  {
    id: "3",
    name: "Hoodie",
    description: "Cozy fleece hoodie for cool weather",
    price: 49.99,
    image: "/shirt.png",
    category: "APPAREL",
    inStock: false,
  },
  {
    id: "4",
    name: "Hoodie 456",
    description: "Cozy fleece hoodie for cool weather",
    price: 49.99,
    image: "/shirt.png",
    category: "APPAREL",
    inStock: false,
  },
];

export default function StorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simulate loading for demonstration
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const toggleMobileFilters = () => {
    setShowMobileFilters((prev) => !prev);
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch((prev) => !prev);
  };

  const closeMobileFilters = () => {
    setShowMobileFilters(false);
  };

  const filteredProducts = dummyProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    const { StorePageSkeleton } = require("@/components/SkeletonLoaders");
    return <StorePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Store Navigation */}
      <StoreNav />

      {/* Header */}
      <div className="border-b border-gray-200 mb-8 lg:mb-16">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-24 py-8 lg:py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-400 mb-6 lg:mb-8">Home / Store</nav>

          {/* Mobile Actions Bar */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <button
              onClick={toggleMobileSearch}
              className="flex items-center space-x-2 px-4 py-3 bg-white rounded-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-300"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </button>
            <button
              onClick={toggleMobileFilters}
              className="flex items-center space-x-2 px-4 py-3 bg-white rounded-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-300"
            >
              <Filter className="h-4 w-4" />
              <span>Categories</span>
            </button>
          </div>

          {/* Mobile Search Overlay */}
          {showMobileSearch && (
            <div className="fixed inset-0 z-50 bg-white lg:hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-black">
                    Search Products
                  </h2>
                  <button
                    onClick={toggleMobileSearch}
                    className="p-2 hover:bg-gray-100 rounded-sm transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search products…"
                    className="w-full bg-white border border-gray-300 rounded-sm px-4 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                    autoFocus
                  />
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {searchTerm && (
                  <div className="mt-6">
                    <button
                      onClick={toggleMobileSearch}
                      className="w-full bg-black text-white py-4 rounded-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Search &ldquo;{searchTerm}&rdquo;
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Filters Drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={closeMobileFilters}
              ></div>
              {/* Drawer Content */}
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-sm max-h-[85vh] flex flex-col animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-300">
                  <div>
                    <h2 className="text-xl font-semibold text-black">
                      Categories
                    </h2>
                    <p className="text-sm text-gray-400">Select a category</p>
                  </div>
                  <button
                    onClick={closeMobileFilters}
                    className="p-2 hover:bg-gray-100 rounded-sm transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                {/* Categories Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-3">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          closeMobileFilters();
                        }}
                        className={`w-full text-left px-4 py-4 rounded-sm transition-colors ${
                          selectedCategory === cat
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Search Bar */}
          <div className="relative mb-8 lg:mb-12 hidden lg:block">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search products…"
              className="w-full max-w-lg bg-white border border-gray-300 rounded-sm px-6 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            />
          </div>

          {/* Category Tabs */}
          <div className="overflow-hidden">
            <div className="flex space-x-3 lg:space-x-6 overflow-x-auto scrollbar-hide text-sm font-medium text-gray-600 pb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`border px-6 py-3 lg:px-8 lg:py-4 flex-shrink-0 hover:bg-gray-100 whitespace-nowrap transition-colors rounded-sm ${
                    selectedCategory === cat
                      ? "border-black font-semibold bg-black text-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-24 pb-16 lg:pb-24">
        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 lg:py-24">
              <p className="text-gray-400 text-xl">
                No products found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
              {filteredProducts.map((product) => (
                <Link key={product.id} href={`/store/${product.id}`}>
                  <div className="group cursor-pointer bg-white rounded-sm overflow-hidden border border-gray-300 hover:border-black transition-all duration-300">
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-black text-base group-hover:text-gray-700 transition-colors leading-tight">
                          {product.name}
                        </h3>
                        <span
                          className={`px-3 py-1 text-xs rounded-sm font-medium ${
                            product.inStock
                              ? "bg-gray-200 text-gray-800"
                              : "bg-black text-white"
                          }`}
                        >
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xl font-bold text-black">
                          ${product.price}
                        </span>
                        <span className="text-xs text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-sm">
                          {product.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
