-- migrate:up
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    sku_id UUID NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- migrate:down
DROP TABLE events;
