-- migrate:up
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE events
    ADD CONSTRAINT events_merchant_id_fkey
    FOREIGN KEY (merchant_id) REFERENCES merchants(id);

-- migrate:down
ALTER TABLE events DROP CONSTRAINT events_merchant_id_fkey;
DROP TABLE merchants;
