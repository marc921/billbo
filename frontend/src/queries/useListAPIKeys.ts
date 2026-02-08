import { apiKeysApi } from "@/api/apiKeys";
import { useQuery } from "@tanstack/react-query";

export function useListAPIKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: apiKeysApi.list,
  });
}
