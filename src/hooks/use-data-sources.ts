import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { DataSource } from "@shared/schema";

export function useDataSources() {
  return useQuery({
    queryKey: ['/api/data-sources'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/data-sources');
      return response.json() as Promise<DataSource[]>;
    }
  });
}

export function useDataSource(id: number | null) {
  return useQuery({
    queryKey: ['/api/data-sources', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest('GET', `/api/data-sources/${id}`);
      return response.json() as Promise<DataSource>;
    },
    enabled: !!id
  });
}
