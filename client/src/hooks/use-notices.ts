import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Notice } from "@shared/db/schema";

export interface NoticeWithObjection extends Notice {
  objectionCount: number;
}

interface NoticesResponse {
  notices: NoticeWithObjection[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface UseNoticesOptions {
  search?: string;
  category?: string;
  dateFilter?: string;
  sortBy?: string;
}

export function useNotices({
  search,
  category,
  dateFilter,
  sortBy,
}: UseNoticesOptions = {}) {
  const noticesQuery = useInfiniteQuery<NoticesResponse, Error>({
    queryKey: ["/api/notices", { search, category, dateFilter, sortBy }],
    queryFn: async ({ pageParam }): Promise<NoticesResponse> => {
      const currentPage = (pageParam as number) || 1;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "15",
      });

      if (search) params.append("search", search);
      if (category && category !== "all") params.append("category", category);
      if (dateFilter && dateFilter !== "all") params.append("dateFilter", dateFilter);
      if (sortBy) params.append("sortBy", sortBy);

      const response = await fetch(`/api/notices?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notices");
      }

      return await response.json();
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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

      return (await response.json()) as Record<string, number>;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
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
