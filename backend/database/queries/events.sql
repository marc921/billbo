-- name: InsertEvent :exec
INSERT INTO events (merchant_id, customer_id, sku_id, amount, sent_at)
VALUES ($1, $2, $3, $4, $5);

-- name: ListEvents :many
SELECT * FROM events;
