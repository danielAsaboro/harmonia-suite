select * from draft_tweets;
select * from draft_threads;
select * from scheduled_threads;
select * from scheduled_tweets;
select * from shared_draft_comments;
select * from shared_drafts;
select * from user_tokens;
select * from content_approvals;
select * from team_invites;
select * from team_members;
select * from teams;



-- First, drop tables with foreign key dependencies
DROP TABLE IF EXISTS shared_draft_comments CASCADE;
DROP TABLE IF EXISTS shared_drafts CASCADE;
DROP TABLE IF EXISTS content_approvals CASCADE;
DROP TABLE IF EXISTS team_invites CASCADE;

-- Drop the tweet/thread tables that aren't team-related
DROP TABLE IF EXISTS scheduled_tweets CASCADE;
DROP TABLE IF EXISTS scheduled_threads CASCADE;
DROP TABLE IF EXISTS draft_tweets CASCADE;
DROP TABLE IF EXISTS draft_threads CASCADE;
