"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Filter, Clock, TrendingUp, Calendar } from "lucide-react";
import { PREDEFINED_HASHTAGS } from "@/lib/constants";

interface ExposeFiltersProps {
  selectedHashtag: string;
  selectedSort: "newest" | "trending" | "expiring";
  onHashtagChange: (hashtag: string) => void;
  onSortChange: (sort: "newest" | "trending" | "expiring") => void;
  availableHashtags?: string[];
  isLoading?: boolean;
  hasError?: boolean;
}

export default function ExposeFilters({
  selectedHashtag,
  selectedSort,
  onHashtagChange,
  onSortChange,
  availableHashtags = [],
  isLoading = false,
  hasError = false,
}: ExposeFiltersProps) {
  const [isHashtagDropdownOpen, setIsHashtagDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Combine predefined hashtags with available ones from the database
  const allHashtags = [
    "all",
    ...PREDEFINED_HASHTAGS,
    ...availableHashtags.filter((tag) => !PREDEFINED_HASHTAGS.includes(tag)),
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".hashtag-dropdown")) {
        setIsHashtagDropdownOpen(false);
      }
      if (!target.closest(".sort-dropdown")) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortOptions = [
    {
      value: "newest" as const,
      label: "Newest First",
      icon: Calendar,
      description: "Most recently posted",
    },
    {
      value: "trending" as const,
      label: "Trending",
      icon: TrendingUp,
      description: "Most upvoted",
    },
    {
      value: "expiring" as const,
      label: "Expiring Soon",
      icon: Clock,
      description: "Expiring soonest",
    },
  ];

  const getHashtagDisplayName = (hashtag: string) => {
    if (hashtag === "all") return "All Categories";
    return hashtag;
  };

  const getCurrentSortOption = () => {
    return (
      sortOptions.find((option) => option.value === selectedSort) ||
      sortOptions[0]
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Filter Label */}
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter & Sort
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Hashtag Filter */}
          <div className="relative hashtag-dropdown">
            <button
              onClick={() => setIsHashtagDropdownOpen(!isHashtagDropdownOpen)}
              disabled={isLoading}
              className={`
                flex items-center justify-between space-x-2 px-4 py-2 
                bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 
                rounded-md text-sm font-medium text-gray-700 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                min-w-[180px]
              `}
            >
              <span className="truncate">
                {getHashtagDisplayName(selectedHashtag)}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isHashtagDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isHashtagDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                {allHashtags.map((hashtag) => (
                  <button
                    key={hashtag}
                    onClick={() => {
                      onHashtagChange(hashtag);
                      setIsHashtagDropdownOpen(false);
                    }}
                    className={`
                      w-full text-left px-4 py-2 text-sm
                      hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                      ${
                        selectedHashtag === hashtag
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300"
                      }
                    `}
                  >
                    {getHashtagDisplayName(hashtag)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Options */}
          <div className="relative sort-dropdown">
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              disabled={isLoading}
              className={`
                flex items-center justify-between space-x-2 px-4 py-2 
                bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 
                rounded-md text-sm font-medium text-gray-700 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                min-w-[160px]
              `}
            >
              <div className="flex items-center space-x-2">
                {(() => {
                  const IconComponent = getCurrentSortOption().icon;
                  return <IconComponent className="w-4 h-4" />;
                })()}
                <span>{getCurrentSortOption().label}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isSortDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setIsSortDropdownOpen(false);
                    }}
                    className={`
                      w-full text-left px-4 py-3 
                      hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                      ${
                        selectedSort === option.value
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300"
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      {(() => {
                        const IconComponent = option.icon;
                        return <IconComponent className="w-4 h-4" />;
                      })()}
                      <div>
                        <div className="text-sm font-medium">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedHashtag !== "all" || selectedSort !== "newest") && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Active filters:
            </span>

            {selectedHashtag !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                {selectedHashtag}
                <button
                  onClick={() => onHashtagChange("all")}
                  className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
                  aria-label="Remove hashtag filter"
                >
                  ×
                </button>
              </span>
            )}

            {selectedSort !== "newest" && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                {getCurrentSortOption().label}
                <button
                  onClick={() => onSortChange("newest")}
                  className="ml-1 hover:text-green-600 dark:hover:text-green-300"
                  aria-label="Remove sort filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
