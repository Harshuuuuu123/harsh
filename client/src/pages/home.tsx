import { useState } from "react";
import { useNotices } from "@/hooks/use-notices";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilters } from "@/components/CategoryFilters";
import { NoticeCard } from "@/components/NoticeCard";
import { UploadModal } from "@/components/UploadModal";
import { InfiniteScroll } from "@/components/InfiniteScroll";
import { Button } from "@/components/ui/button";
import { Plus, Menu } from "lucide-react";

export default function Home() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const {
    notices,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    categoryCounts
  } = useNotices({ search: searchQuery, category: activeCategory });

  const allNotices = notices?.pages?.flatMap(page => page.notices) || [];

  return (
    <div className="min-h-screen bg-light-grey">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5 text-slate" />
              </Button>
              <div className="flex items-center ml-2">
                <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L9 7V9C9 10.1 9.9 11 11 11V16L9.5 17.5L10.91 18.91L12 17.83L13.09 18.91L14.5 17.5L13 16V11C14.1 11 15 10.1 15 9H21Z" fill="#2c3e50"/>
                  <circle cx="12" cy="4" r="1.5" fill="white"/>
                </svg>
                <h1 className="text-lg font-semibold text-gray-900">Jahir Soochna</h1>
              </div>
            </div>
            <Button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-navy hover:bg-navy text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Upload Notice</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </div>
        </div>
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
