# Reputation fixtures — SAMPLE DATA, NOT LIVE

Everything in this directory is **hand-authored sample ERC-8004 data** used so
the reputation service and leaderboard demo fully with **no GCP credentials**.

It is NOT read from chain and NOT live. Every API response built from these
fixtures carries `"source": "fixture"`. When `GOOGLE_APPLICATION_CREDENTIALS`
and `GCP_PROJECT_ID` are set, the service ignores these files and queries
BigQuery (`bigquery-public-data.crypto_ethereum.logs`) with the SAME SQL the
shape tests validate, and responses then carry `"source": "live"`.

Files mirror the BigQuery concern queries one-to-one (same column names):

| File                     | Mirrors query        | Event decoded                        |
|--------------------------|----------------------|--------------------------------------|
| `registrations.json`     | `registrationsQuery` | Identity `Registered`                |
| `feedback.json`          | `feedbackQuery`      | Reputation `NewFeedback`             |
| `revoked-feedback.json`  | `revokedFeedbackQuery` | Reputation `FeedbackRevoked`       |
| `validations.json`       | `validationsQuery`   | Validation `ValidationResponse`      |
| `activity.json`          | `activityOverTimeQuery` | daily NewFeedback counts          |

Addresses, agentIds, tx hashes and timestamps are fabricated and internally
consistent only. The mainnet registry addresses live in `bigquery/registry.ts`
(verbatim from the erc8004-bigquery skill); fixtures do not hard-code them.
