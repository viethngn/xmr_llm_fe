import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, del } from "@/lib/api";
import type { DataSource, InsertDataSource } from "@/types/shared";

export function useDataSources() {
  return useQuery({
    queryKey: ['/api/data-sources'],
    queryFn: async () => {
      return get<DataSource[]>('/data-sources');
    }
  });
}

export function useDataSource(id: number | null) {
  return useQuery({
    queryKey: ['/api/data-sources', id],
    queryFn: async () => {
      if (!id) return null;
      return get<DataSource>(`/data-sources/${id}`);
    },
    enabled: !!id
  });
}

export function useCreateDataSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertDataSource) => {
      return post<DataSource>('/data-sources', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
    }
  });
}

export function useDeleteDataSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return del(`/data-sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
    }
  });
}
