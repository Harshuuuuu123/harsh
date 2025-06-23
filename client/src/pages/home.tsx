import { useState, useEffect, useRef, SetStateAction } from "react";
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
import { Plus, Menu, X, FileImage, UserCircle, LogOut } from "lucide-react";
import img1 from "../../../attached_assets/jahirimg.jpg";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Notice } from "@shared/db/schema";

type NoticeWithObjection = Notice & { objectionCount: number };

export default function Home() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTemplateGeneratorOpen, setIsTemplateGeneratorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const userRole = localStorage.getItem("userRole");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      if (!axios.defaults.headers.common["Authorization"]) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      const email = localStorage.getItem("userEmail") || "";
      setUserEmail(email);
    }
  }, []);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const menuButton = document.querySelector('[data-menu-button="true"]') as Element | null;
      if (menuRef.current && !menuRef.current.contains(target) && (!menuButton || !menuButton.contains(target))) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
      delete axios.defaults.headers.common["Authorization"];
      navigate("/login");
    }
  };

  const {
    notices,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    categoryCounts,
  } = useNotices({
    search: debouncedSearchQuery,
    category: activeCategory,
    dateFilter,
    sortBy,
  });

  const allNotices: NoticeWithObjection[] = notices?.pages?.flatMap((page) => page.notices) || [];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "home", label: "Home" },
    { value: "land", label: "Land" },
    { value: "namechange", label: "Name Change" },
    { value: "property", label: "Property Dispute" },
    { value: "legal", label: "Legal" },
    { value: "public", label: "Public Notice" },
    { value: "court", label: "Court Notice" },
    { value: "tender", label: "Tender" },
  ];

  const handleCategorySelect = (category: SetStateAction<string>) => {
    setActiveCategory(category);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-light-grey">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <img src={img1} alt="jahir-img" className="h-14 w-30 m-2" />
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 relative">
              {userEmail && (
                <span className="hidden sm:inline text-sm text-gray-600 mr-2">
                  Logged in as: <strong>{userEmail}</strong>
                </span>
              )}

              {userRole === "lawyer" && (
                <>
                  <Button onClick={() => setIsTemplateGeneratorOpen(true)} variant="outline" size="sm" className="px-2 sm:px-3 py-1.5 sm:py-2 border-navy text-navy hover:bg-navy hover:text-white transition-colors text-xs sm:text-sm">
                    <FileImage className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                    <span className="hidden lg:inline">Generate Notice</span>
                    <span className="lg:hidden">Generate</span>
                  </Button>

                  <Button onClick={() => setIsUploadModalOpen(true)} size="sm" className="bg-navy hover:bg-navy text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                    <span className="hidden md:inline">Upload Notice</span>
                    <span className="md:hidden">Upload</span>
                  </Button>
                </>
              )}

              <div className="relative" ref={profileRef}>
                <Button variant="ghost" size="sm" className="p-1.5 sm:p-2" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                  <UserCircle className="h-5 w-5 text-slate" />
                </Button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <LogOut className="inline-block mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>

              <Button variant="ghost" size="sm" className="p-1.5 sm:p-2" data-menu-button="true" onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}>
                {isMobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5 text-slate" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-slate" />}
              </Button>

              {isMobileMenuOpen && (
                <div className="absolute right-0 top-14 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 duration-200 max-h-96 overflow-y-auto">
                  <div className="py-2">
                    <p className="px-4 py-1 text-xs text-gray-400 uppercase">Categories</p>
                    {categoryOptions.map((option) => (
                      <button key={option.value} onClick={() => handleCategorySelect(option.value)} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${activeCategory === option.value ? "bg-gray-100 font-semibold" : ""}`}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filter Row */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="w-full md:w-[48%]">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <div className="w-full md:w-[48%]">
            <FilterControls
              dateFilter={dateFilter}
              sortBy={sortBy}
              onDateFilterChange={setDateFilter}
              onSortByChange={setSortBy}
            />
          </div>
        </div>
      </div>

      <CategoryFilters
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categoryCounts={categoryCounts}
      />

      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-dark-grey mb-2">
            {activeCategory === "all" ? "All Notices" : `${activeCategory} Notices`}
          </h2>
          <p className="text-slate">
            {allNotices.length} {allNotices.length === 1 ? "notice" : "notices"} found
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {allNotices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}

          {isLoading && allNotices.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate">Loading notices...</div>
          )}

          {!isLoading && allNotices.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate">No notices found</div>
          )}
        </div>

        <InfiniteScroll
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      </main>

      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      <NoticeTemplateGenerator isOpen={isTemplateGeneratorOpen} onClose={() => setIsTemplateGeneratorOpen(false)} />
    </div>
  );
}
