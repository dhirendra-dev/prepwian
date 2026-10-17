<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep Community Feed UI in `NewCommunityFeed` while data mutations remain in shared feed hooks, so visual redesigns cannot replace persistence.
- Store personal-message replies with `direct_messages.reply_to_id`; keep legacy quoted bodies readable without creating a second messaging system.
- Keep the `PublicHeader` control row fixed. Do not add, remove, reorder, or repurpose header actions or feature shortcuts unless the user explicitly requests that exact header change; place new discovery elsewhere by default.
- Define page-specific social text and canonical links on content leaf routes, not shared layouts; this prevents inherited homepage previews and duplicate canonicals.
- Keep the Materials route public for server-rendered share metadata and its library inside ClientOnly; existing server functions retain account and password access checks.
