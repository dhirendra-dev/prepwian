# Articles feature setup

This feature is added as a normal app route and reuses the existing Supabase authentication. Before deploying the article UI, apply `migrations/20261011153000_articles_pro.sql` to the project database (for example, through the approved Supabase migration workflow). Do not run the SQL manually against production without reviewing it and confirming the target project.

Optional sample content is in `seed/articles_seed.sql`. It is deliberately separate from the migration so sample rows are not inserted automatically into a production database. Run it only where sample articles are wanted.

After applying the migration, verify public article reads, owner-only drafts, author updates, comments, likes/bookmarks, and view tracking with an anonymous session and two regular accounts.
