-- gpt-4o-search-preview was retired by OpenAI; live-verified gpt-5-search-api
-- as its replacement when wiring up the real API key (see lib/engines/openai.ts).
update engines set model_id = 'gpt-5-search-api' where slug = 'chatgpt';
