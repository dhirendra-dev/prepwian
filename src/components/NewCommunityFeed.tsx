import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowBigDown, ArrowBigUp, Bell, Bookmark, CheckCircle2, ChevronDown, Download,
  FileText, Flame, HelpCircle, Home, Image as ImageIcon, MessageSquare,
  MoreVertical, Plus, Send, Share2, Target, Trophy, User, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import {
  groupStories, useCreateComment, useCreatePost, useCreateStory, useDeletePost, useFeedPosts,
  useFeedStories, useLatestNotice, useMyFeedIdentity, useMyVotes, usePostComments,
  useVote, type FeedCommentNode, type FeedPostItem, type StoryGroup,
} from "@/lib/feed-data";
import { cn } from "@/lib/utils";
import { LinkifiedText } from "@/components/LinkifiedText";

const navItems = [
  { icon: Home, label: "Home Feed", to: "/feed" },
  { icon: HelpCircle, label: "Ask Doubts", to: "/community" },
  { icon: Target, label: "Mock Tests", to: "/tests" },
  { icon: FileText, label: "Study Material", to: "/materials" },
  { icon: Trophy, label: "Leaderboard", to: "/leaderboard" },
] as const;

function PersonAvatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  return (
    <Avatar className={cn("h-10 w-10 border border-border shadow-sm", className)}>
      {src ? <AvatarImage src={src} alt={name} loading="lazy" decoding="async" /> : null}
      <AvatarFallback className="bg-primary/10 font-bold text-primary">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

function StoryViewer({ group, index, onClose, onChange }: { group: StoryGroup; index: number; onClose: () => void; onChange: (next: number) => void }) {
  const item = group.items[index];
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/90 p-0 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={`${group.user}'s study goal`}>
      <div className="relative flex h-full max-h-[820px] w-full max-w-[420px] overflow-hidden bg-foreground shadow-2xl sm:rounded-2xl">
        <img src={item.contentImg} alt={`${group.user}'s study goal`} decoding="async" className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-foreground/70 to-transparent p-4 pt-5">
          <div className="mb-4 flex gap-1">
            {group.items.map((story, storyIndex) => <span key={story.id} className={cn("h-1 flex-1 rounded-full", storyIndex <= index ? "bg-background" : "bg-background/35")} />)}
          </div>
          <div className="flex items-center gap-3 text-background">
            <PersonAvatar src={group.avatar} name={group.user} className="h-9 w-9 border-background/50" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{group.user}</p><p className="text-xs opacity-80">{item.time}</p></div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close story" className="text-background hover:bg-background/15 hover:text-background"><X /></Button>
          </div>
        </div>
        {item.text ? <p className="absolute inset-x-6 bottom-20 rounded-xl bg-foreground/65 px-5 py-3 text-center text-base font-medium text-background backdrop-blur-md">{item.text}</p> : null}
        <button type="button" aria-label="Previous story" className="absolute inset-y-24 left-0 w-1/3" onClick={() => onChange(Math.max(0, index - 1))} />
        <button type="button" aria-label="Next story" className="absolute inset-y-24 right-0 w-2/3" onClick={() => index + 1 < group.items.length ? onChange(index + 1) : onClose()} />
      </div>
    </div>
  );
}

function CommentItem({ node, postId, myVote, onReply }: { node: FeedCommentNode; postId: string; myVote: number; onReply: (id: string, name: string) => void }) {
  const vote = useVote();
  const cast = (value: number) => vote.mutate({ kind: "comment", id: node.id, value: myVote === value ? 0 : value }, { onError: (error) => toast.error(error.message) });
  return (
    <div className="mt-4 flex gap-3">
      <PersonAvatar src={node.author.avatar} name={node.author.name} className="h-8 w-8" />
      <div className="min-w-0 flex-1">
        <div className={cn("rounded-xl border p-3", node.isSolution ? "border-success/25 bg-success/10" : "border-border bg-muted/45")}>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">{node.author.name}</span>
            {node.author.verified ? <CheckCircle2 className="h-4 w-4 text-info" /> : null}
            {node.isSolution ? <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-success">Solution</span> : null}
            <span className="text-xs text-muted-foreground">{node.time}</span>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85"><LinkifiedText text={node.content} /></p>
        </div>
        <div className="mt-1 flex items-center gap-2 pl-1 text-muted-foreground">
          <Button variant="ghost" size="icon" className={cn("h-7 w-7", myVote === 1 && "text-vote-up")} onClick={() => cast(1)} aria-label="Upvote reply"><ArrowBigUp /></Button>
          <span className="min-w-5 text-center text-xs font-bold">{node.votes}</span>
          <Button variant="ghost" size="icon" className={cn("h-7 w-7", myVote === -1 && "text-vote-down")} onClick={() => cast(-1)} aria-label="Downvote reply"><ArrowBigDown /></Button>
          <Button variant="ghost" size="sm" className="h-7" onClick={() => onReply(node.id, node.author.name)}>Reply</Button>
        </div>
        {node.replies.map((reply) => <CommentItem key={reply.id} node={reply} postId={postId} myVote={myVote} onReply={onReply} />)}
      </div>
    </div>
  );
}

function Comments({ postId }: { postId: string }) {
  const comments = usePostComments(postId, true);
  const myVotes = useMyVotes();
  const create = useCreateComment(postId);
  const [text, setText] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    create.mutate({ body: text.trim(), parentId }, { onSuccess: () => { setText(""); setParentId(null); }, onError: (error) => toast.error(error.message) });
  };
  return (
    <div className="border-t border-border bg-muted/25 p-4 sm:p-5">
      <form onSubmit={submit} className="flex gap-2">
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder={parentId ? "Write your reply…" : "Write a helpful answer…"} maxLength={1000} className="min-w-0 flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <Button type="submit" size="icon" disabled={create.isPending || !text.trim()} aria-label="Post answer"><Send /></Button>
      </form>
      {parentId ? <Button variant="ghost" size="sm" className="mt-1" onClick={() => setParentId(null)}>Cancel reply</Button> : null}
      {comments.isLoading ? <p className="py-5 text-center text-sm text-muted-foreground">Loading answers…</p> : null}
      {comments.data?.map((node) => <CommentItem key={node.id} node={node} postId={postId} myVote={myVotes.data?.comments[node.id] ?? 0} onReply={(id, name) => { setParentId(id); setText(`@${name} `); }} />)}
    </div>
  );
}

function GoalComposer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateStory();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    requestAnimationFrame(() => fileRef.current?.focus());
  }, [open]);

  if (!open) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const goal = text.trim();
    if (!goal) return setError("Add a short study goal first.");
    if (!image) return setError("Choose an image for your study goal.");
    setError(null);
    create.mutate(
      { file: image, text: goal },
      {
        onSuccess: () => {
          setText("");
          setImage(null);
          onClose();
          toast.success("Study goal added to the community");
        },
        onError: (cause) => setError(cause instanceof Error ? cause.message : "Could not save the study goal."),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-foreground/40 p-3 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="add-goal-title">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h2 id="add-goal-title" className="font-bold">Add a study goal</h2><p className="mt-1 text-xs text-muted-foreground">Share what you are working toward today.</p></div><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close add goal"><X /></Button></div>
        <label className="mt-4 block text-sm font-medium" htmlFor="goal-text">Goal</label>
        <textarea id="goal-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={160} rows={3} placeholder="Complete electrostatics revision…" className="mt-2 w-full resize-none rounded-xl border border-input bg-muted/45 px-3 py-2.5 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-ring" />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
        <Button type="button" variant="outline" className="mt-3 w-full justify-start" onClick={() => fileRef.current?.click()}><ImageIcon />{image ? <span className="truncate">{image.name}</span> : "Choose goal image"}</Button>
        {error ? <p className="mt-2 text-xs text-destructive" role="alert">{error}</p> : null}
        <Button type="submit" disabled={create.isPending} className="mt-4 w-full">{create.isPending ? "Saving goal…" : "Save goal"}</Button>
      </form>
    </div>
  );
}

function PostCard({ post }: { post: FeedPostItem }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const deletePost = useDeletePost();
  const votes = useMyVotes();
  const vote = useVote();
  const myVote = votes.data?.posts[post.id] ?? 0;
  const [saved, setSaved] = useState(() => typeof window !== "undefined" && localStorage.getItem(`feed-saved:${post.id}`) === "1");
  const cast = (value: number) => vote.mutate({ kind: "post", id: post.id, value: myVote === value ? 0 : value }, { onError: (error) => toast.error(error.message) });
  const bookmark = () => {
    const next = !saved;
    setSaved(next);
    try { next ? localStorage.setItem(`feed-saved:${post.id}`, "1") : localStorage.removeItem(`feed-saved:${post.id}`); } catch { /* no-op */ }
    toast.success(next ? "Post saved on this device" : "Removed from saved posts");
  };
  const share = async () => {
    const url = `${window.location.origin}/feed?post=${post.id}`;
    try { if (navigator.share) await navigator.share({ title: "JEE Prep Hub post", text: post.content, url }); else { await navigator.clipboard.writeText(url); toast.success("Post link copied"); } } catch { /* cancelled */ }
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/feed?post=${post.id}`);
      toast.success("Post link copied");
    } catch {
      toast.error("Could not copy the post link");
    }
    setMenuOpen(false);
  };
  const remove = () => {
    if (!window.confirm("Delete this post?")) return;
    deletePost.mutate(post.id, { onSuccess: () => toast.success("Post deleted"), onError: (error) => toast.error(error.message) });
    setMenuOpen(false);
  };
  return (
    <article id={`post-${post.id}`} className="community-feed-post overflow-hidden border-y border-border bg-card shadow-sm sm:rounded-2xl sm:border">
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-start gap-3">
          <Link to="/u/$userId" params={{ userId: post.author.id }}><PersonAvatar src={post.author.avatar} name={post.author.name} /></Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5"><Link to="/u/$userId" params={{ userId: post.author.id }} className="truncate text-sm font-bold hover:underline">{post.author.name}</Link>{post.author.verified ? <CheckCircle2 className="h-4 w-4 text-info" /> : null}{post.author.role ? <span className="rounded bg-role/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-role">{post.author.role}</span> : null}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><span>{post.time}</span>{post.type === "doubt" ? <><span>•</span><span className={post.solved ? "text-success" : "text-warning"}>{post.solved ? "Solved" : "Unsolved"}</span></> : null}</div>
          </div>
          <div className="relative"><Button variant="ghost" size="icon" aria-label="Post options" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><MoreVertical /></Button>{menuOpen ? <div className="absolute right-0 top-11 z-20 min-w-36 rounded-xl border border-border bg-popover p-1 text-sm shadow-xl"><button type="button" onClick={copyLink} className="w-full rounded-lg px-3 py-2 text-left hover:bg-muted">Copy link</button>{user?.id === post.author.id ? <button type="button" disabled={deletePost.isPending} onClick={remove} className="w-full rounded-lg px-3 py-2 text-left text-destructive hover:bg-destructive/10">{deletePost.isPending ? "Deleting…" : "Delete post"}</button> : null}</div> : null}</div>
        </div>
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground/90"><LinkifiedText text={post.content} /></p>
        {post.image ? <img src={post.image} alt="Post attachment" loading="lazy" decoding="async" className="mt-3 max-h-[520px] w-full rounded-xl border border-border object-cover" /> : null}
        {post.document ? <a href={post.document.url} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-muted/45 p-3 hover:bg-muted"><span className="grid h-10 w-10 place-items-center rounded-lg bg-destructive/10 text-destructive"><FileText /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{post.document.title}</span><span className="text-xs text-muted-foreground">{post.document.size}{post.document.pages ? ` • ${post.document.pages} pages` : ""}</span></span><Download className="h-4 w-4 text-muted-foreground" /></a> : null}
        {post.tags.length ? <div className="mt-3 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">#{tag}</span>)}</div> : null}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex items-center rounded-full border border-border bg-muted/45">
            <Button variant="ghost" size="icon" className={cn("rounded-full", myVote === 1 && "bg-vote-up/10 text-vote-up")} onClick={() => cast(1)} aria-label="Upvote post"><ArrowBigUp /></Button><span className="min-w-7 text-center text-sm font-bold">{post.votes}</span><Button variant="ghost" size="icon" className={cn("rounded-full", myVote === -1 && "bg-vote-down/10 text-vote-down")} onClick={() => cast(-1)} aria-label="Downvote post"><ArrowBigDown /></Button>
          </div>
          <Button variant="ghost" className={cn("rounded-full", open && "bg-primary/10 text-primary")} onClick={() => setOpen((value) => !value)}><MessageSquare /> {post.comments} <span className="hidden sm:inline">Replies</span></Button>
          <div className="flex"><Button variant="ghost" size="icon" onClick={share} aria-label="Share post"><Share2 /></Button><Button variant="ghost" size="icon" onClick={bookmark} aria-label={saved ? "Remove saved post" : "Save post"} className={saved ? "text-primary" : undefined}><Bookmark className={saved ? "fill-current" : undefined} /></Button></div>
        </div>
      </div>
      {open ? <Comments postId={post.id} /> : null}
    </article>
  );
}

function Composer({ focusSignal }: { focusSignal: number }) {
  const identity = useMyFeedIdentity();
  const create = useCreatePost();
  const imageRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState<"note" | "doubt" | "update">("update");
  const [image, setImage] = useState<File | null>(null);
  const [document, setDocument] = useState<File | null>(null);
  useEffect(() => { if (focusSignal) requestAnimationFrame(() => { textRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); textRef.current?.focus(); }); }, [focusSignal]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    create.mutate({ body: body.trim(), tags: [], postType, imageFile: image, documentFile: document }, { onSuccess: () => { setBody(""); setImage(null); setDocument(null); toast.success("Posted to the community"); }, onError: (error) => toast.error(error.message) });
  };
  return (
    <form onSubmit={submit} className="border-y border-border bg-card p-4 shadow-sm sm:rounded-2xl sm:border">
      <div className="flex gap-3"><PersonAvatar src={identity.data?.avatar} name={identity.data?.name ?? "You"} /><textarea ref={textRef} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share a doubt, note, or update…" maxLength={1000} rows={2} className="min-h-12 flex-1 resize-none rounded-xl border border-input bg-muted/45 px-4 py-3 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-ring" /></div>
      {(image || document) ? <div className="ml-13 mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">{image ? <span>{image.name}</span> : null}{document ? <span>{document.name}</span> : null}</div> : null}
      <div className="mt-3 flex items-center justify-between gap-2 pl-12">
        <div className="flex items-center gap-1"><input ref={imageRef} type="file" accept="image/*" hidden onChange={(event) => setImage(event.target.files?.[0] ?? null)} /><input ref={documentRef} type="file" accept="application/pdf" hidden onChange={(event) => setDocument(event.target.files?.[0] ?? null)} /><Button type="button" variant="ghost" size="sm" onClick={() => imageRef.current?.click()}><ImageIcon /> <span className="hidden sm:inline">Image</span></Button><Button type="button" variant="ghost" size="sm" onClick={() => documentRef.current?.click()}><FileText /> <span className="hidden sm:inline">PDF</span></Button><select value={postType} onChange={(event) => setPostType(event.target.value as typeof postType)} className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold"><option value="update">Update</option><option value="doubt">Doubt</option><option value="note">Note</option></select></div>
        <Button type="submit" disabled={create.isPending || !body.trim()} className="rounded-full px-5">{create.isPending ? "Posting…" : "Post"}</Button>
      </div>
    </form>
  );
}

export default function NewCommunityFeed() {
  const { user } = useAuth();
  const [sort, setSort] = useState<"Hot" | "New" | "Top">("Hot");
  const [story, setStory] = useState<{ group: number; item: number } | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [focusSignal, setFocusSignal] = useState(0);
  const posts = useFeedPosts(sort);
  const stories = useFeedStories();
  const identity = useMyFeedIdentity();
  const notice = useLatestNotice();
  const groupedStories = useMemo(() => groupStories(stories.data ?? []), [stories.data]);
  const visiblePosts = posts.data ?? [];
  const openComposer = () => user ? setFocusSignal((value) => value + 1) : toast.error("Sign in to post");
  const openGoalComposer = () => user ? setGoalOpen(true) : toast.error("Sign in to add a study goal");
  return (
    <div className="community-feed-glass min-h-screen pb-20 lg:pb-0">
      <div className="mx-auto mt-4 flex max-w-[1400px] gap-6 px-2 sm:px-4 lg:mt-6">
        <aside className="sticky top-28 hidden h-[calc(100vh-8rem)] w-64 shrink-0 flex-col gap-1 lg:flex">{navItems.map((item) => <Button key={item.label} asChild variant={item.to === "/feed" ? "default" : "ghost"} className="h-11 justify-start rounded-xl"><Link to={item.to}><item.icon />{item.label}</Link></Button>)}</aside>
        <main className="mx-auto min-w-0 w-full max-w-[680px] space-y-5">
          {notice.data ? <a href={notice.data.link_url ?? "/notices"} className="mx-4 flex items-center gap-3 rounded-2xl bg-destructive p-4 text-destructive-foreground shadow-sm sm:mx-0"><span className="grid h-10 w-10 place-items-center rounded-full bg-background/20"><Bell /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{notice.data.title}</strong><span className="line-clamp-1 text-xs opacity-90">{notice.data.body}</span></span><span className="text-xs font-bold">View</span></a> : null}
          <section className="border-y border-border bg-card p-4 shadow-sm sm:rounded-2xl sm:border" aria-label="Live study goals"><div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-bold uppercase text-muted-foreground">Live study goals</h2></div><div className="community-touch-strip hide-scrollbar flex gap-4 overflow-x-auto pb-1"><button type="button" onClick={openGoalComposer} className="flex w-16 shrink-0 flex-col items-center gap-1.5"><span className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-border bg-muted text-muted-foreground"><Plus /></span><span className="w-full truncate text-center text-[11px] font-medium">Add Goal</span></button>{groupedStories.map((group, index) => <button type="button" key={group.userId} onClick={() => setStory({ group: index, item: 0 })} className="flex w-16 shrink-0 flex-col items-center gap-1.5"><span className="rounded-full bg-story-ring p-0.5"><span className="block rounded-full bg-card p-0.5"><PersonAvatar src={group.avatar} name={group.user} className="h-12 w-12 border-0" /></span></span><span className="w-full truncate text-center text-[11px] font-medium">{group.user}</span></button>)}</div></section>
          <Composer focusSignal={focusSignal} />
          <div className="flex items-center justify-between px-4 sm:px-0"><h1 className="text-lg font-extrabold">Community Feed</h1><label className="relative flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5"><Flame className="h-4 w-4 text-warning" /><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="appearance-none bg-transparent pr-5 text-sm font-bold outline-none"><option value="Hot">Hot Posts</option><option value="New">Newest</option><option value="Top">Top All Time</option></select><ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-muted-foreground" /></label></div>
          {posts.isLoading ? <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading the community…</div> : null}
          {posts.isError ? <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">The community could not load. Please try again.</div> : null}
          <div className="community-feed-post-list space-y-4">{visiblePosts.map((post) => <PostCard key={post.id} post={post} />)}</div>
          {!posts.isLoading && !posts.isError && visiblePosts.length === 0 ? <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No posts yet. Be the first to share something with the community.</div> : null}
        </main>
        <aside className="sticky top-28 hidden h-fit w-80 shrink-0 space-y-5 xl:block"><div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 font-bold"><Target className="text-primary" /> Today’s progress</h2><div className="flex items-center justify-between text-sm"><span>Daily streak</span><strong className="text-warning">{identity.data?.streak ?? 0} days</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-3/5 rounded-full bg-primary" /></div><Button asChild variant="outline" className="mt-4 w-full"><Link to="/progress">View progress</Link></Button></div><div className="rounded-2xl border border-border bg-card p-5 text-sm shadow-sm"><h2 className="mb-2 font-bold">Community spaces</h2><p className="text-muted-foreground">Join live discussions and get help with difficult concepts.</p><Button asChild className="mt-4 w-full"><Link to="/community">Open Community Live</Link></Button></div></aside>
      </div>
      <GoalComposer open={goalOpen} onClose={() => setGoalOpen(false)} />
      <nav className="community-feed-mobile-nav fixed inset-x-0 bottom-0 z-40 flex items-end justify-around border-t border-border bg-card/95 px-4 py-2 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/95 lg:hidden"><Button asChild variant="ghost" size="sm" className="h-12 flex-col gap-0.5 text-primary"><Link to="/feed"><Home /><span className="text-[10px]">Home</span></Link></Button><Button asChild variant="ghost" size="sm" className="h-12 flex-col gap-0.5"><Link to="/community"><HelpCircle /><span className="text-[10px]">Doubts</span></Link></Button><Button onClick={openComposer} size="icon" className="-mt-7 h-14 w-14 rounded-full border-4 border-background" aria-label="Create post"><Plus className="h-6 w-6" /></Button><Button asChild variant="ghost" size="sm" className="h-12 flex-col gap-0.5"><Link to="/materials"><FileText /><span className="text-[10px]">Notes</span></Link></Button><Button asChild variant="ghost" size="sm" className="h-12 flex-col gap-0.5"><Link to={user ? "/u/$userId" : "/auth"} params={user ? { userId: user.id } : {}}><User /><span className="text-[10px]">Profile</span></Link></Button></nav>
      {story ? <StoryViewer group={groupedStories[story.group]} index={story.item} onClose={() => setStory(null)} onChange={(item) => setStory((current) => current ? { ...current, item } : null)} /> : null}
    </div>
  );
}
