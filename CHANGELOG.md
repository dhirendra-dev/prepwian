# Changelog

Notable changes to JEE Prep Hub are recorded here. Release tags follow Semantic Versioning (`vMAJOR.MINOR.PATCH`). GitHub Releases are source snapshots; the release workflow does not deploy the application.

## [Unreleased]

### Added

- Ongoing improvements are recorded here before the next version is tagged.

## [0.1.0] - 2026-10-16

### Added

- First versioned development release of the JEE Prep Hub source repository.
- Automated quality checks, dependency-update configuration, release notes, and security-reporting guidance.

### Changed

- Refresh the generated search-route registry from current route metadata and access settings.

### Notes

- This is a pre-1.0 development release; features and interfaces may change.
- This release does not indicate that the application has been deployed or that any external service has been provisioned.

## Unreleased — Adaptive Study Plan

- Added a Prep Lab Study Plan tab that creates a suggested daily sequence from recorded practice activity.
- Added chapter-level accuracy summaries based on locally saved attempts.
- Added a spaced-review queue with suggested revisit dates for topics missed during practice.
- Added responsive layouts for the plan view. These insights use browser-local practice history and are not synced to the account backend.

## Adaptive Syllabus Tracker

- Added a Syllabus Tracker tab for JEE Main, JEE Advanced, and NEET UG tracks using chapter coverage currently present in Prep Lab's question bank.
- Added per-chapter statuses: Not started, In progress, Completed, and Needs revision.
- Added subject/status filters, completion summary, practice-accuracy signals, and a shortcut to practise a chapter.
- Syllabus status is saved in browser-local Prep Lab storage and remains separate for each exam track.
- Clearly labels the tracker as practice-bank coverage rather than a complete official syllabus checklist.

## Unreleased — Mock Test Intelligence Engine

- Added manual mock-result logging with exam track, question counts, score, maximum marks, and duration.
- Added JSON/CSV import, local result history, delete and JSON export actions.
- Added score-rate and attempt-accuracy summaries, unattempted-question visibility, and recommendations based on recent results and Prep Lab subject accuracy.
- Added example CSV and JSON import templates under `docs/templates/`.
- Results remain browser-local; this change does not modify Supabase schema, policies, RPCs, or backend data.

## Unreleased — Error Pattern Analyser

- Added an Error Analysis tab for classifying recent incorrect practice answers.
- Added category counts and revision advice based on the most frequently labelled error type.
- Saved error labels with the existing browser-local Prep Lab state; no database schema or backend changes were made.
