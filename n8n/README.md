# n8n workflows

Import the JSON files inside `workflows/` into your n8n instance.

## Env vars referenced
- `N8N_FROM_EMAIL`: Outbound email sender.
- `CARE_AMBER_EMAIL`: Email used to nudge the elder directly for Amber status.
- `CARE_GREEN_EMAIL`: Optional care circle digest target for Green status.
- `CARE_TEAM_EMAIL`: Escalation address for Red status.

## Webhook URLs
After import grab the production webhook URLs and set them as:
- `N8N_WEBHOOK_CARECIRCLE_URL`
- `N8N_WEBHOOK_SHARE_URL`

Both workflows respond immediately to amily server, and send notifications asynchronously.
