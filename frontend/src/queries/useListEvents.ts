import { eventsApi } from "@/api/events";
import { useQuery } from "@tanstack/react-query";

export function useListEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: eventsApi.listEvents,
  });
}
