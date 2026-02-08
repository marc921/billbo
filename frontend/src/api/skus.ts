import { makeApiDelete, makeApiGet, makeApiPost } from "./generic";

export type SKU = {
  ID: string;
  Name: string;
  Unit: string | null;
  PricePerUnit: number;
  RevokedAt: string | null;
  CreatedAt: string;
};

type CreateSKUBody = {
  name: string;
  unit?: string;
  price_per_unit: number;
};

const listSKUs = makeApiGet<undefined, SKU[]>("/api/v1/skus/");
const createSKU = makeApiPost<CreateSKUBody, SKU>("/api/v1/skus/");
const revokeSKU = makeApiDelete<void, { id: string }>("/api/v1/skus/:id");

export const skusApi = {
  list: () => listSKUs({}),
  create: (body: CreateSKUBody) => createSKU({ body }),
  revoke: (id: string) => revokeSKU({ path: { id } }),
};
