import { makeApiGet } from "./generic";

export type Event = {
  ID: string;
  MerchantID: string;
  CustomerID: string;
  SkuID: string;
  Amount: number;
  SentAt: string;
};

const listEvents = makeApiGet<undefined, Event[]>("/api/v1/events/");

export const eventsApi = {
  listEvents: () => listEvents({}),
};
