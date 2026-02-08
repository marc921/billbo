import { useQuery } from "@tanstack/react-query";
import { skusApi } from "@/api/skus";

export function useListSKUs() {
  return useQuery({
    queryKey: ["skus"],
    queryFn: skusApi.list,
  });
}
