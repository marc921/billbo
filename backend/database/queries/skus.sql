-- name: CreateSKU :one
INSERT INTO skus (merchant_id, name, unit, price_per_unit)
VALUES ($1, $2, sqlc.narg('unit'), $3)
RETURNING *;

-- name: ListSKUsByMerchantID :many
SELECT * FROM skus
WHERE merchant_id = $1
ORDER BY created_at DESC;

-- name: RevokeSKU :exec
UPDATE skus
SET revoked_at = now()
WHERE id = $1 AND merchant_id = $2 AND revoked_at IS NULL;
