-- gemini-2.5-pro was retired ("no longer available to new users"); live-verified
-- gemini-3.6-flash as the working replacement when wiring up the real API key
-- (see lib/engines/google.ts). Google Search grounding on this key currently
-- returns 429s until billing is enabled on the linked Google AI Studio project.
update engines set model_id = 'gemini-3.6-flash' where slug = 'gemini';
