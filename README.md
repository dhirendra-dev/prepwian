# PREPWIAN — Personal Learning Field Guide

An independently created, offline-first study workspace. This project is built as its own product with its own interaction model and visual language; it does not reuse another project's code, brand assets, theme, or database schema.

## Included

- **Overview:** a compact daily snapshot and quick navigation.
- **Daily plan:** create and check off study tasks.
- **Concept atlas:** create personal concepts by subject and track them as Unseen, Learning, or Clear for now.
- **Review journal:** write short end-of-session reflections and label the session feel.
- **Practice lab:** one clearly labelled sample question to demonstrate answer feedback.
- **Resource shelf:** maintain a searchable index of study materials.
- **Progress:** transparent counts based on locally saved data.
- **Focus timer:** focus and break sessions.
- **Command bar:** try `help`, `plan`, `atlas`, `journal`, `practice`, `resources`, or `progress`.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Important limitations

This version stores tasks, concepts, reflections, and resource entries in the current browser using `localStorage`. It has no cloud account, shared sync, official syllabus dataset, real question bank, or server-side data protection yet. Do not use it as a backup for important notes. The sample question is demo content, not an official exam question.

## Next independent milestones

1. Define a new PREPWIAN data model for profiles, study plans, concepts, attempts, and reflection notes.
2. Add authenticated cloud sync and ownership rules after configuring a fresh backend project.
3. Add user-editable syllabus packs and question imports with provenance.
4. Add tested analytics only where there is real recorded study or assessment data.


## PREPWIAN backend foundation (optional setup)

A fresh Supabase schema is provided in `supabase/migrations/202610180001_prepwian_learning_core.sql`. It defines PREPWIAN's own tables for profiles, study plans, tasks, concepts, reflections, resources, practice attempts, and focus sessions. User-owned tables have row-level security policies based on `auth.uid()`.

1. Create a **new Supabase project for PREPWIAN**. Do not point it at another product's database.
2. In that project's SQL Editor, review and run the migration file.
3. Copy `.env.example` to `.env.local` and fill in the project URL and public publishable/anon key.
4. Run `npm install`, then `npm run dev`.

The client helper in `src/lib/supabase.js` is only a configuration scaffold; the current screens still use browser-local storage and have not yet been wired to cloud sync. This migration has not been applied to a live database or tested against your Supabase project. Never place a Supabase `service_role` key in browser code.
