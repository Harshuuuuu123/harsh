import { Badge } from "@/components/ui/badge";

interface CategoryFiltersProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts: Record<string, number>;
}

const categories = [
  { key: "all", label: "Home" },
  { key: "land", label: "Land" },
  { key: "namechange", label: "Name Change" },
  { key: "property", label: "Property Dispute" },
  { key: "legal", label: "Legal Claim" },
];

export function CategoryFilters({ activeCategory, onCategoryChange, categoryCounts }: CategoryFiltersProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = activeCategory === category.key;
            const count = categoryCounts[category.key] || 0;
            
            return (
              <button
                key={category.key}
                onClick={() => onCategoryChange(category.key)}
                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-navy text-white"
                    : "bg-gray-100 text-slate hover:bg-gray-200"
                }`}
              >
                {category.label}
                <Badge 
                  variant="secondary" 
                  className={`ml-2 text-xs ${
                    isActive 
                      ? "bg-white bg-opacity-20 text-white" 
                      : "bg-slate bg-opacity-20 text-slate"
                  }`}
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
