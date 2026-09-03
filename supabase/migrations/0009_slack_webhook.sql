-- Slack alerts (Growth+) via Incoming Webhooks — simplest self-serve
-- integration: each org pastes their own workspace's webhook URL, no
-- Slack OAuth app / App Store review needed on our side.
alter table organizations add column slack_webhook_url text;
