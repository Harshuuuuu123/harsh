import { useState, useEffect, useRef } from "react";
import { useNotices } from "@/hooks/use-notices";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilters } from "@/components/CategoryFilters";
import { FilterControls } from "@/components/FilterControls";
import { NoticeCard } from "@/components/NoticeCard";
import { UploadModal } from "@/components/UploadModal";
import { NoticeTemplateGenerator } from "@/components/NoticeTemplateGenerator";
import { InfiniteScroll } from "@/components/InfiniteScroll";
import { Button } from "@/components/ui/button";
import { Plus, Menu, X, FileImage } from "lucide-react";

export default function Home() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTemplateGeneratorOpen, setIsTemplateGeneratorOpen] = useState(false);
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
                <svg className="h-8 w-8 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Scales of Justice */}
                  <g transform="translate(2, 1)">
                    {/* Central pillar */}
                    <line x1="10" y1="2" x2="10" y2="20" stroke="#1e3a8a" strokeWidth="1.5" strokeLinecap="round"/>
                    {/* Top ornament */}
                    <circle cx="10" cy="2" r="1" fill="#1e3a8a"/>
                    {/* Horizontal beam */}
                    <line x1="4" y1="6" x2="16" y1="6" stroke="#1e3a8a" strokeWidth="1.5" strokeLinecap="round"/>
                    {/* Left scale */}
                    <path d="M2 10 L6 8 L6 12 Z" fill="#1e3a8a" opacity="0.8"/>
                    <line x1="4" y1="6" x2="4" y2="8" stroke="#1e3a8a" strokeWidth="1"/>
                    <ellipse cx="4" cy="10" rx="2.5" ry="0.8" fill="none" stroke="#1e3a8a" strokeWidth="1"/>
                    {/* Right scale */}
                    <path d="M18 10 L14 8 L14 12 Z" fill="#1e3a8a" opacity="0.8"/>
                    <line x1="16" y1="6" x2="16" y2="8" stroke="#1e3a8a" strokeWidth="1"/>
                    <ellipse cx="16" cy="10" rx="2.5" ry="0.8" fill="none" stroke="#1e3a8a" strokeWidth="1"/>
                    {/* Base */}
                    <rect x="7" y="18" width="6" height="2" rx="1" fill="#1e3a8a"/>
                    {/* Decorative elements */}
                    <circle cx="6" cy="4" r="0.5" fill="#1e3a8a" opacity="0.6"/>
                    <circle cx="14" cy="4" r="0.5" fill="#1e3a8a" opacity="0.6"/>
                  </g>
                </svg>
                <div className="flex flex-col">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Jahir Soochna</h1>
                  <p className="text-xs sm:text-xs text-gray-600 font-medium tracking-wide">LEGAL NOTICE PLATFORM</p>
                </div>
              </div>
            </div>

            {/* Right Side - Upload Button and Menu */}
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => setIsTemplateGeneratorOpen(true)}
                variant="outline"
                className="px-3 py-2 border-navy text-navy hover:bg-navy hover:text-white transition-colors"
              >
                <FileImage className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Generate Notice</span>
                <span className="md:hidden">Generate</span>
              </Button>
              
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

      {/* Notice Template Generator */}
      <NoticeTemplateGenerator
        isOpen={isTemplateGeneratorOpen}
        onClose={() => setIsTemplateGeneratorOpen(false)}
      />
    </div>
  );
}
