import { Badge } from "@/components/ui/badge";

interface CategoryFiltersProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts: Record<string, number>;
}

const categories = [
  { key: "all", label: "All" },
  { key: "home", label: "Home" },
  { key: "land", label: "Land" },
  { key: "namechange", label: "Name Change" },
  { key: "property", label: "Property Dispute" },
  { key: "legal", label: "Legal" },
  { key: "public", label: "Public Notice" },
  { key: "court", label: "Court Notice" },
  { key: "tender", label: "Tender" },
];

export function CategoryFilters({ activeCategory, onCategoryChange, categoryCounts }: CategoryFiltersProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">

        <div className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const isActive = activeCategory === category.key;
            const count = categoryCounts[category.key] || 0;
            
            return (
              <button
                key={category.key}
                onClick={() => onCategoryChange(category.key)}
                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.label}
                {count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    isActive 
                      ? "bg-white bg-opacity-20 text-white" 
                      : "bg-gray-300 text-gray-700"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
