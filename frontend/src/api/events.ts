import { makeApiGet, makeApiPost } from "./generic";

export type Event = {
  ID: string;
  MerchantID: string;
  CustomerID: string;
  SkuID: string;
  Amount: number;
  SentAt: string;
};

type PostEventRequest = {
  customer_id: string;
  sku_id: string;
  amount: number;
  sent_at: string;
};

const listEvents = makeApiGet<undefined, Event[]>("/api/v1/events/");
const postEvent = makeApiPost<PostEventRequest>("/api/v1/events/");

export const eventsApi = {
  listEvents: () => listEvents({}),
  postEvent: (body: PostEventRequest) => postEvent({ body }),
};
