-- ═══════════════════════════════════════════════════════
-- REMUS  —  Analytics & Traffic Log Database
-- Server : Rome  (same SQL Server instance as Romulus)
-- Run    : once to set up; safe to re-run (IF NOT EXISTS guards)
-- ═══════════════════════════════════════════════════════

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'Remus')
    CREATE DATABASE Remus;
GO

USE Remus;
GO

-- ─── PageViews ──────────────────────────────────────────
-- One row per page load (beacon fired by remus-track.js).
-- Section values: public | admin | client | prospect
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PageViews')
CREATE TABLE PageViews (
    Id           INT           IDENTITY(1,1) PRIMARY KEY,
    LoggedAt     DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    Section      NVARCHAR(20)  NOT NULL,   -- public / admin / client / prospect
    Page         NVARCHAR(500) NULL,        -- e.g. /Client/timeline.html
    PageTitle    NVARCHAR(500) NULL,
    Referrer     NVARCHAR(2000) NULL,
    UtmSource    NVARCHAR(200) NULL,        -- google, instagram, email, etc.
    UtmMedium    NVARCHAR(200) NULL,        -- organic, paid, social
    UtmCampaign  NVARCHAR(200) NULL,
    UtmTerm      NVARCHAR(500) NULL,        -- search keyword (SEO gold)
    SessionId    NVARCHAR(64)  NULL,        -- random per-browser session
    CodeHash     NVARCHAR(100) NULL,        -- portal only (never public)
    LoadMs       INT           NULL         -- page load time in ms
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PageViews_Section'   AND object_id = OBJECT_ID('PageViews'))
    CREATE INDEX IX_PageViews_Section    ON PageViews(Section);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PageViews_LoggedAt'  AND object_id = OBJECT_ID('PageViews'))
    CREATE INDEX IX_PageViews_LoggedAt   ON PageViews(LoggedAt);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PageViews_UTMSource' AND object_id = OBJECT_ID('PageViews'))
    CREATE INDEX IX_PageViews_UTMSource  ON PageViews(UtmSource);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PageViews_Page'      AND object_id = OBJECT_ID('PageViews'))
    CREATE INDEX IX_PageViews_Page       ON PageViews(Page);
GO

-- ─── SyncState ──────────────────────────────────────────
-- Tracks which S3 daily log files have already been imported.
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SyncState')
CREATE TABLE SyncState (
    LogFile  NVARCHAR(100) PRIMARY KEY,  -- e.g. logs/visits-2026-04-10.ndjson
    SyncedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    Rows     INT       NOT NULL DEFAULT 0
);
GO

-- ─── Useful analytics views ─────────────────────────────

-- Daily visits by section
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'v_DailyVisits')
    DROP VIEW v_DailyVisits;
GO
CREATE VIEW v_DailyVisits AS
SELECT
    CAST(LoggedAt AS DATE) AS Day,
    Section,
    COUNT(*)               AS Visits,
    COUNT(DISTINCT SessionId) AS UniqueSessions
FROM PageViews
GROUP BY CAST(LoggedAt AS DATE), Section;
GO

-- Top referrers (SEO traffic sources)
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'v_TopReferrers')
    DROP VIEW v_TopReferrers;
GO
CREATE VIEW v_TopReferrers AS
SELECT
    CASE
        WHEN Referrer LIKE '%google%'    THEN 'Google'
        WHEN Referrer LIKE '%bing%'      THEN 'Bing'
        WHEN Referrer LIKE '%instagram%' THEN 'Instagram'
        WHEN Referrer LIKE '%facebook%'  THEN 'Facebook'
        WHEN Referrer LIKE '%tiktok%'    THEN 'TikTok'
        WHEN Referrer IS NULL OR Referrer = '' THEN 'Direct'
        ELSE 'Other'
    END AS Source,
    COUNT(*) AS Visits
FROM PageViews
WHERE Section = 'public'
GROUP BY
    CASE
        WHEN Referrer LIKE '%google%'    THEN 'Google'
        WHEN Referrer LIKE '%bing%'      THEN 'Bing'
        WHEN Referrer LIKE '%instagram%' THEN 'Instagram'
        WHEN Referrer LIKE '%facebook%'  THEN 'Facebook'
        WHEN Referrer LIKE '%tiktok%'    THEN 'TikTok'
        WHEN Referrer IS NULL OR Referrer = '' THEN 'Direct'
        ELSE 'Other'
    END;
GO

-- Top SEO search terms
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'v_SearchTerms')
    DROP VIEW v_SearchTerms;
GO
CREATE VIEW v_SearchTerms AS
SELECT UtmTerm AS SearchTerm, COUNT(*) AS Visits
FROM PageViews
WHERE UtmTerm IS NOT NULL AND UtmTerm <> ''
GROUP BY UtmTerm;
GO

-- Top pages visited on public site
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'v_TopPages')
    DROP VIEW v_TopPages;
GO
CREATE VIEW v_TopPages AS
SELECT Page, PageTitle, COUNT(*) AS Visits
FROM PageViews
WHERE Section = 'public'
GROUP BY Page, PageTitle;
GO

-- ─── Handy queries to run anytime ───────────────────────
/*
-- Last 30 days of traffic by section:
SELECT * FROM v_DailyVisits WHERE Day >= DATEADD(DAY, -30, GETDATE()) ORDER BY Day DESC, Section;

-- SEO traffic sources for public site:
SELECT * FROM v_TopReferrers ORDER BY Visits DESC;

-- Top search keywords driving traffic:
SELECT * FROM v_SearchTerms ORDER BY Visits DESC;

-- Most visited public pages:
SELECT * FROM v_TopPages ORDER BY Visits DESC;

-- Client portal activity (last 7 days):
SELECT CAST(LoggedAt AS DATE) AS Day, COUNT(*) AS PortalLoads
FROM PageViews WHERE Section = 'client' AND LoggedAt >= DATEADD(DAY,-7,GETDATE())
GROUP BY CAST(LoggedAt AS DATE) ORDER BY Day DESC;

-- Prospect funnel (who visits, what % convert):
SELECT Page, COUNT(*) AS Visits FROM PageViews WHERE Section = 'prospect' GROUP BY Page ORDER BY Visits DESC;
*/
