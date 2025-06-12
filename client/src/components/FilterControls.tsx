
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, ArrowUpDown } from "lucide-react";

interface FilterControlsProps {
  dateFilter: string;
  sortBy: string;
  onDateFilterChange: (value: string) => void;
  onSortByChange: (value: string) => void;
}

export function FilterControls({ 
  dateFilter, 
  sortBy, 
  onDateFilterChange, 
  onSortByChange 
}: FilterControlsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Date Filter */}
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Date Filter</label>
          </div>
          <Select value={dateFilter} onValueChange={onDateFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="thismonth">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <ArrowUpDown className="h-4 w-4 mr-2 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Sort By</label>
          </div>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
