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
              <Button variant="ghost" size="sm" className="md:hidden p-2">
                <Menu className="h-5 w-5 text-slate" />
              </Button>
              <div className="flex items-center ml-2 md:ml-0">
                <svg className="h-8 w-8 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" fill="#1e3a8a" stroke="#1e3a8a" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                  <path d="M12 10.5V13.5M10.5 12H13.5" stroke="#1e3a8a" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <h1 className="text-xl font-bold text-navy">Jahir Soochna</h1>
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
