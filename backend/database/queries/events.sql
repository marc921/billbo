-- name: InsertEvent :exec
INSERT INTO events (merchant_id, customer_id, sku_id, amount, sent_at)
VALUES ($1, $2, $3, $4, $5);

-- name: ListEventsByMerchantID :many
SELECT * FROM events WHERE merchant_id = $1;
