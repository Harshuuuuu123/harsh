import { useState, useEffect, useRef } from "react";
import { useNotices } from "@/hooks/use-notices";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilters } from "@/components/CategoryFilters";
import { FilterControls } from "@/components/FilterControls";
import { NoticeCard } from "@/components/NoticeCard";
import { UploadModal } from "@/components/UploadModal";
import { InfiniteScroll } from "@/components/InfiniteScroll";
import { Button } from "@/components/ui/button";
import { Plus, Menu, X } from "lucide-react";

export default function Home() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Debounce search query to reduce API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const {
    notices,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    categoryCounts
  } = useNotices({ 
    search: debouncedSearchQuery, 
    category: activeCategory,
    dateFilter,
    sortBy
  });

  const allNotices = notices?.pages?.flatMap(page => page.notices) || [];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "home", label: "Home" },
    { value: "land", label: "Land" },
    { value: "namechange", label: "Name Change" },
    { value: "property", label: "Property Dispute" },
    { value: "legal", label: "Legal" },
    { value: "public", label: "Public Notice" },
    { value: "court", label: "Court Notice" },
    { value: "tender", label: "Tender" }
  ];

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-light-grey">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Side - Logo and Name */}
            <div className="flex items-center">
              <div className="flex items-center">
                <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L9 7V9C9 10.1 9.9 11 11 11V16L9.5 17.5L10.91 18.91L12 17.83L13.09 18.91L14.5 17.5L13 16V11C14.1 11 15 10.1 15 9H21Z" fill="#2c3e50"/>
                  <circle cx="12" cy="4" r="1.5" fill="white"/>
                </svg>
                <h1 className="text-lg font-semibold text-gray-900">Jahir Soochna</h1>
              </div>
            </div>

            {/* Right Side - Upload Button and Menu */}
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-navy hover:bg-navy text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Upload Notice</span>
                <span className="sm:hidden">Upload</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5 text-slate" /> : <Menu className="h-5 w-5 text-slate" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isMobileMenuOpen && (
          <div 
            ref={menuRef}
            className="absolute top-16 right-4 w-64 bg-white shadow-xl border border-gray-200 rounded-lg z-50 animate-in slide-in-from-top-2 duration-200"
          >
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-center">Categories</h3>
              <div className="space-y-1">
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleCategorySelect(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                      activeCategory === option.value
                        ? "bg-navy text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100 hover:shadow-sm"
                    }`}
                  >
                    {option.label}
                    {categoryCounts[option.value] && (
                      <span className="ml-2 text-xs opacity-75 bg-gray-200 px-1.5 py-0.5 rounded-full">
                        {categoryCounts[option.value]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Search Bar */}
      <SearchBar 
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {/* Category Filters */}
      <CategoryFilters
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categoryCounts={categoryCounts}
      />

      {/* Filter Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FilterControls
          dateFilter={dateFilter}
          sortBy={sortBy}
          onDateFilterChange={setDateFilter}
          onSortByChange={setSortBy}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Notices Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-dark-grey mb-2">
            {activeCategory === "all" ? "All Notices" : `${activeCategory} Notices`}
          </h2>
          <p className="text-slate">
            {allNotices.length} {allNotices.length === 1 ? 'notice' : 'notices'} found
          </p>
        </div>

        {/* Notices List */}
        <div className="space-y-4">
          {allNotices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}

          {isLoading && allNotices.length === 0 && (
            <div className="text-center py-8">
              <div className="text-slate">Loading notices...</div>
            </div>
          )}

          {!isLoading && allNotices.length === 0 && (
            <div className="text-center py-8">
              <div className="text-slate">No notices found</div>
            </div>
          )}
        </div>

        {/* Infinite Scroll */}
        <InfiniteScroll
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
