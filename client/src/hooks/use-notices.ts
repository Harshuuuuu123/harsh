import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Notice } from "@shared/schema";

interface NoticesResponse {
  notices: Notice[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface UseNoticesOptions {
  search?: string;
  category?: string;
}

export function useNotices({ search, category }: UseNoticesOptions = {}) {
  const noticesQuery = useInfiniteQuery({
    queryKey: ["/api/notices", { search, category }],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: "15",
      });
      
      if (search) params.append("search", search);
      if (category && category !== "all") params.append("category", category);

      const response = await fetch(`/api/notices?${params}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch notices");
      }
      
      return response.json() as Promise<NoticesResponse>;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const categoryCountsQuery = useQuery({
    queryKey: ["/api/notices/categories"],
    queryFn: async () => {
      const response = await fetch("/api/notices/categories", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch category counts");
      }
      
      return response.json() as Promise<Record<string, number>>;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    notices: noticesQuery.data,
    isLoading: noticesQuery.isLoading,
    error: noticesQuery.error,
    hasNextPage: noticesQuery.hasNextPage,
    fetchNextPage: noticesQuery.fetchNextPage,
    isFetchingNextPage: noticesQuery.isFetchingNextPage,
    categoryCounts: categoryCountsQuery.data || {},
  };
}
