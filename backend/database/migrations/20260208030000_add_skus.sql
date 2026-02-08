-- migrate:up
CREATE TABLE skus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    name TEXT NOT NULL,
    unit TEXT,
    price_per_unit DOUBLE PRECISION NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE events
    ADD CONSTRAINT events_sku_id_fkey
    FOREIGN KEY (sku_id) REFERENCES skus(id);

-- migrate:down
ALTER TABLE events DROP CONSTRAINT events_sku_id_fkey;
DROP TABLE skus;
