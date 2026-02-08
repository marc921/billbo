-- name: CreateAPIKey :one
INSERT INTO api_keys (merchant_id, name, key_prefix, key_hash)
VALUES ($1, $2, $3, $4)
RETURNING id, merchant_id, name, key_prefix, created_at;

-- name: ListAPIKeysByMerchantID :many
SELECT id, name, key_prefix, revoked_at, created_at
FROM api_keys
WHERE merchant_id = $1
ORDER BY created_at DESC;

-- name: RevokeAPIKey :exec
UPDATE api_keys
SET revoked_at = now()
WHERE id = $1 AND merchant_id = $2 AND revoked_at IS NULL;

-- name: GetAPIKeyByHash :one
SELECT id, merchant_id, revoked_at
FROM api_keys
WHERE key_hash = $1;
