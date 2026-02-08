import { makeApiDelete, makeApiGet, makeApiPost } from "./generic";

export type APIKey = {
  ID: string;
  Name: string;
  KeyPrefix: string;
  RevokedAt: string | null;
  CreatedAt: string;
};

export type CreateAPIKeyResponse = {
  id: string;
  name: string;
  key: string;
  key_prefix: string;
};

type CreateAPIKeyBody = {
  name: string;
};

const listAPIKeys = makeApiGet<undefined, APIKey[]>("/api/v1/api-keys/");
const createAPIKey = makeApiPost<CreateAPIKeyBody, CreateAPIKeyResponse>(
  "/api/v1/api-keys/",
);
const revokeAPIKey = makeApiDelete<void, { id: string }>(
  "/api/v1/api-keys/:id",
);

export const apiKeysApi = {
  list: () => listAPIKeys({}),
  create: (body: CreateAPIKeyBody) => createAPIKey({ body }),
  revoke: (id: string) => revokeAPIKey({ path: { id } }),
};
