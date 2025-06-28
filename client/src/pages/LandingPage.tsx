"use client"

import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { SearchBar } from "@/components/SearchBar"
import { FilterControls } from "@/components/FilterControls"
import { NoticeCard } from "@/components/NoticeCard"
import { Button } from "@/components/ui/button"
import { useNotices } from "@/hooks/use-notices"
import { useNavigate } from "react-router-dom"
import img1 from "../../../attached_assets/jahirimg.jpg"

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("today")
  const [sortBy, setSortBy] = useState("newest")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const navigate = useNavigate()

  const { notices, isLoading } = useNotices({
    search: debouncedSearchQuery,
    category: "all",
    dateFilter,
    sortBy,
  })

  const todayNotices = notices?.pages?.flatMap((page) => page.notices) || []

  return (
    <div className="min-h-screen bg-light-grey">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full mx-auto px-4 py-2 flex items-center justify-between">
          <img src={img1 || "/placeholder.svg"} alt="jahir-img" className="h-14 w-30" />
          <div className="flex gap-2">
            <Button onClick={() => navigate("/login")} variant="outline">
              Login
            </Button>
            <Button onClick={() => navigate("/signup")}>Signup</Button>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6">
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

      {/* Notices */}
      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-2xl font-bold text-dark-grey mb-4">Today's Notices</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {todayNotices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} showFullDetails={false} />
          ))}

          {isLoading && todayNotices.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate">Loading notices...</div>
          )}

          {!isLoading && todayNotices.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate">No notices found</div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-10 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Want to see more notices?</h3>
          <p className="mb-4 text-sm text-gray-600">Sign up now to access all legal notices on Jaahir Soochna.</p>
          <Button onClick={() => navigate("/signup")} className="bg-navy text-white hover:bg-navy-dark">
            Signup to Explore More
          </Button>
        </div>

        {/* Testimonials */}
        <section className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-dark-grey mb-2">What Our Users Say</h2>
          <p className="text-gray-600 mb-10">
            Trusted by lawyers and citizens across India for reliable legal notice management
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-white border rounded-xl p-6 text-left shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-700">
                  PS
                </div>
                <div>
                  <h4 className="font-semibold">Priya Sharma</h4>
                  <p className="text-sm text-gray-500">Advocate, Delhi High Court</p>
                </div>
              </div>
              <p className="italic text-gray-700 mb-4">
                "This platform has revolutionized how I handle public notices for my clients. The verification process
                is seamless and the search functionality is incredibly powerful."
              </p>
              <div className="text-yellow-500 text-lg">★★★★★</div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white border rounded-xl p-6 text-left shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-700">
                  R
                </div>
                <div>
                  <h4 className="font-semibold">Rajesh Kumar</h4>
                  <p className="text-sm text-gray-500">Property Investor</p>
                </div>
              </div>
              <p className="italic text-gray-700 mb-4">
                "I've been able to stay informed about all property-related notices in my area. The objection process is
                straightforward and has saved me from potential legal issues."
              </p>
              <div className="text-yellow-500 text-lg">★★★★☆</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0b1120] text-white mt-20 pt-12 pb-6 px-6 md:px-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          {/* Logo & About */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src={img1 || "/placeholder.svg"} alt="Logo" className="h-8 w-auto" />
              <h1 className="font-bold text-lg"></h1>
            </div>
            <p className="text-gray-400 mb-4">
              India's trusted platform for legal public notices, connecting lawyers and citizens for transparent legal
              processes.
            </p>
            <div className="flex space-x-4 text-gray-400 text-lg">
              <i className="fab fa-facebook"></i>
              <i className="fab fa-twitter"></i>
              <i className="fab fa-linkedin"></i>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="font-semibold mb-3">Quick Links</h2>
            <ul className="space-y-1 text-gray-400">
              <li>About</li>
              <li>Contact</li>
              <li>Terms</li>
              <li>Privacy Policy</li>
            </ul>
          </div>

          {/* For Lawyers */}
          <div>
            <h2 className="font-semibold mb-3">For Lawyers</h2>
            <ul className="space-y-1 text-gray-400">
              <li>Create Account</li>
              <li>Upload Notice</li>
              <li>Get Verified</li>
              <li>Support</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="font-semibold mb-3">Contact Info</h2>
            <ul className="space-y-1 text-gray-400">
              <li>📧 infoexcelegal@gmail.com</li>
              <li>📞 +91 9131365110</li>
              <li>📍 Indore, India</li>
            </ul>
          </div>
        </div>

        <hr className="my-6 border-gray-700" />
        <p className="text-center text-gray-500 text-xs">© 2025 Jaahir Soochna. All rights reserved.</p>
      </footer>
    </div>
  )
}
