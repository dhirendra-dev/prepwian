import { POLICY_DOCS } from "@/lib/legal/content";
import { ROUTE_REGISTRY } from "@/features/search/routeRegistry.generated";

type Category =
  | "route"
  | "person"
  | "note"
  | "material"
  | "article"
  | "academic"
  | "notice"
  | "community"
  | "forum"
  | "message"
  | "private-message"
  | "test"
  | "video"
  | "topper"
  | "policy";

export type UniversalSearchResult = {
  id: string;
  title: string;
  description: string;
  snippet: string;
  category: Category;
  source: string;
  url: string;
  subject?: string | null;
  classLevel?: string | number | null;
  createdAt?: string | null;
  authorId?: string;
  authorName?: string;
  groupName?: string;
  score?: number;
};

export type SearchPage = {
  results: UniversalSearchResult[];
  total: number;
  page: number;
  pageSize: number;
  warnings: string[];
};

type DbRow = Record<string, unknown>;
type DbResponse = { data: DbRow[] | null; error: unknown | null; count: number | null };
type Query = PromiseLike<DbResponse> & {
  select: (columns: string, options?: { count?: "exact" }) => Query;
  eq: (column: string, value: string | number | boolean) => Query;
  gte: (column: string, value: string) => Query;
  in: (column: string, values: (string | number)[]) => Query;
  is: (column: string, value: null | boolean) => Query;
  or: (filters: string) => Query;
  order: (column: string, options?: { ascending?: boolean }) => Query;
  range: (from: number, to: number) => Query;
};
type SupabaseSearchClient = { from: (table: string) => Query };

const text = (value: unknown) => (typeof value === "string" ? value : "");
const optionalText = (value: unknown) => (typeof value === "string" ? value : null);
const safeId = (value: unknown) => text(value);
const dateValue = (value: unknown) => optionalText(value);

function normalizedQuery(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 96);
}

function excerpt(value: string, query: string, max = 220) {
  const plain = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const at = plain.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  const start = at < 0 ? 0 : Math.max(0, at - 65);
  return `${start ? "…" : ""}${plain.slice(start, start + max).trim()}${start + max < plain.length ? "…" : ""}`;
}

function result(
  row: DbRow,
  query: string,
  fields: {
    category: Category;
    source?: string;
    name?: string;
    title: string;
    body?: string;
    description?: string;
    url: string;
    subject?: string;
    classLevel?: string;
    createdAt?: string;
    authorColumn?: string;
    fields?: string[];
  },
): UniversalSearchResult {
  const sourceName = fields.source ?? fields.name ?? "PREPWIAN";
  const title = text(row[fields.title]) || sourceName;
  const detail = fields.description ? text(row[fields.description]) : "";
  const body = fields.body ? text(row[fields.body]) : "";
  const matchedText = fields.fields
    ?.map((field) => text(row[field]))
    .find((value) => value.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const snippet = excerpt(matchedText || body || detail || title, query);
  return {
    id: safeId(row.id) || `${fields.source ?? fields.name}:${title}`,
    title,
    description: detail || sourceName,
    snippet,
    category: fields.category,
    source: fields.source ?? fields.name ?? "PREPWIAN",
    url: fields.url
      .replaceAll("{id}", encodeURIComponent(safeId(row.id)))
      .replaceAll("{slug}", encodeURIComponent(text(row.slug)))
      .replaceAll("{groupId}", encodeURIComponent(text(row.group_id)))
      .replaceAll(
        "{peerId}",
        encodeURIComponent(
          text(row.sender_id === row.current_user_id ? row.recipient_id : row.sender_id),
        ),
      )
      .replaceAll("{chapter_id}", encodeURIComponent(text(row.chapter_id)))
      .replaceAll("{test_id}", encodeURIComponent(text(row.test_id)))
      .replaceAll("{post_id}", encodeURIComponent(text(row.post_id)))
      .replaceAll("{thread_id}", encodeURIComponent(text(row.thread_id)))
      .replaceAll("{video_id}", encodeURIComponent(text(row.video_id)))
      .replaceAll("{room_id}", encodeURIComponent(text(row.room_id)))
      .replaceAll("{user_id}", encodeURIComponent(text(row.user_id))),
    subject: fields.subject ? optionalText(row[fields.subject]) : null,
    classLevel: fields.classLevel ? (row[fields.classLevel] as string | number | null) : null,
    createdAt: fields.createdAt ? dateValue(row[fields.createdAt]) : null,
    authorId: fields.authorColumn ? text(row[fields.authorColumn]) : undefined,
  };
}

function titleScore(item: UniversalSearchResult, query: string) {
  const title = item.title.toLocaleLowerCase();
  const needle = query.toLocaleLowerCase();
  let score =
    title === needle ? 100 : title.startsWith(needle) ? 55 : title.includes(needle) ? 30 : 0;
  const terms = needle.split(/\s+/).filter(Boolean);
  for (const term of terms) {
    if (title.includes(term)) score += 8;
    if (item.description.toLocaleLowerCase().includes(term)) score += 3;
    if (item.snippet.toLocaleLowerCase().includes(term)) score += 1;
  }
  if (item.authorName && terms.some((term) => item.authorName!.toLocaleLowerCase().includes(term)))
    score += 18;
  if (item.groupName && terms.some((term) => item.groupName!.toLocaleLowerCase().includes(term)))
    score += 8;
  return score;
}

async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]!);
    }
  });
  await Promise.all(workers);
  return results;
}

function routeResults(
  query: string,
  authenticated: boolean,
  admin: boolean,
): UniversalSearchResult[] {
  const needle = query.toLocaleLowerCase();
  return ROUTE_REGISTRY.filter((route) => {
    if (route.requiresAuth && !authenticated) return false;
    if (route.requiresAdmin && !admin) return false;
    const haystack = `${route.title} ${route.description} ${route.keywords}`.toLocaleLowerCase();
    return (
      haystack.includes(needle) || needle.split(/\s+/).every((word) => haystack.includes(word))
    );
  }).map((route) => ({
    id: `route:${route.id}`,
    title: route.title,
    description: route.description || `Open ${route.path}`,
    snippet: route.description || `Open the ${route.title} section of PREPWIAN.`,
    category: "route",
    source: "PREPWIAN page",
    url: route.href,
    score: 0,
  }));
}

type SearchSource = {
  name: string;
  category: Category;
  table: string;
  columns: string;
  fields: string[];
  url: string;
  title: string;
  body?: string;
  description?: string;
  subject?: string;
  classLevel?: string;
  createdAt?: string;
  authorColumn?: string;
  authenticated?: boolean;
  ownerScoped?: boolean;
  filters?: Array<[string, string | number | boolean]>;
  nullFilters?: Array<[string, null | boolean]>;
};

const SOURCES: SearchSource[] = [
  {
    name: "Articles",
    category: "article",
    table: "articles",
    columns: "id,title,summary,body_markdown,slug,category,published_at,author_id",
    fields: ["title", "summary", "body_markdown", "category"],
    url: "/articles/{slug}",
    title: "title",
    body: "body_markdown",
    description: "summary",
    subject: "category",
    createdAt: "published_at",
    authorColumn: "author_id",
    filters: [["status", "published"]],
  },
  {
    name: "Article comments",
    category: "article",
    table: "article_comments",
    columns:
      "id,article_id,author_id,author_name,body,created_at,status,article:articles!article_comments_article_id_fkey(slug,title)",
    fields: ["body"],
    url: "/articles",
    title: "body",
    body: "body",
    createdAt: "created_at",
    authorColumn: "author_id",
    filters: [["status", "visible"]],
  },
  {
    name: "Notes chapters",
    category: "note",
    table: "notes_chapters",
    columns: "id,name,description,subject,class_level,chapter_number,updated_at",
    fields: ["name", "description"],
    url: "/notes/chapter/{id}",
    title: "name",
    body: "description",
    description: "description",
    subject: "subject",
    classLevel: "class_level",
    createdAt: "updated_at",
    authenticated: true,
    filters: [["status", "published"]],
  },
  {
    name: "Notes resources",
    category: "note",
    table: "notes_resources",
    columns: "id,chapter_id,title,description,content_md,resource_type,updated_at",
    fields: ["title", "description", "content_md", "resource_type"],
    url: "/notes/chapter/{chapter_id}",
    title: "title",
    body: "content_md",
    description: "description",
    createdAt: "updated_at",
    authenticated: true,
    filters: [["published", true]],
  },
  {
    name: "Study materials",
    category: "material",
    table: "materials",
    columns: "id,title,description,topic,subject,class_level,resource_type,created_at",
    fields: ["title", "description", "topic"],
    url: "/materials",
    title: "title",
    body: "description",
    description: "topic",
    subject: "subject",
    classLevel: "class_level",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Public profiles",
    category: "person",
    table: "public_profiles",
    columns: "id,full_name,username,bio,class_level,created_at",
    fields: ["full_name", "username", "bio"],
    url: "/u/{id}",
    title: "full_name",
    body: "bio",
    description: "username",
    classLevel: "class_level",
    createdAt: "created_at",
  },
  {
    name: "Community posts",
    category: "community",
    table: "feed_posts",
    columns: "id,body,document_title,post_type,tags,created_at,user_id",
    fields: ["body", "document_title"],
    url: "/community",
    title: "document_title",
    body: "body",
    description: "post_type",
    createdAt: "created_at",
    authorColumn: "user_id",
  },
  {
    name: "Profile posts",
    category: "community",
    table: "profile_posts",
    columns: "id,user_id,caption,created_at",
    fields: ["caption"],
    url: "/u/{user_id}#posts",
    title: "caption",
    body: "caption",
    createdAt: "created_at",
    authorColumn: "user_id",
  },
  {
    name: "Profile-post comments",
    category: "community",
    table: "profile_post_comments",
    columns: "id,post_id,user_id,body,created_at",
    fields: ["body"],
    url: "/pulse",
    title: "body",
    body: "body",
    createdAt: "created_at",
    authorColumn: "user_id",
  },
  {
    name: "Community replies",
    category: "community",
    table: "feed_comments",
    columns: "id,body,post_id,created_at,user_id",
    fields: ["body"],
    url: "/community?post={post_id}&comment={id}",
    title: "body",
    body: "body",
    createdAt: "created_at",
    authorColumn: "user_id",
  },
  {
    name: "Community Live",
    category: "message",
    table: "chat_messages",
    columns:
      "id,body,subject,topic,kind,parent_id,reply_to_id,created_at,deleted_at,deleted_for_everyone,user_id",
    fields: ["body", "subject", "topic"],
    url: "/community?message={id}",
    title: "subject",
    body: "body",
    description: "topic",
    subject: "subject",
    createdAt: "created_at",
    authorColumn: "user_id",
    authenticated: true,
    nullFilters: [["deleted_at", null]],
    filters: [["deleted_for_everyone", false]],
  },
  {
    name: "Groups and squads",
    category: "community",
    table: "groups",
    columns: "id,name,description,category,community_id,privacy,owner_id",
    fields: ["name", "description"],
    url: "/squad/{id}",
    title: "name",
    body: "description",
    description: "category",
    authorColumn: "owner_id",
    authenticated: true,
  },
  {
    name: "Study group messages",
    category: "message",
    table: "study_group_messages",
    columns: "id,group_id,body,attachment_name,created_at,deleted_at,deleted_for_everyone,user_id",
    fields: ["body", "attachment_name"],
    url: "/squad/{groupId}?message={id}",
    title: "body",
    body: "body",
    createdAt: "created_at",
    authorColumn: "user_id",
    authenticated: true,
    nullFilters: [["deleted_at", null]],
    filters: [["deleted_for_everyone", false]],
  },
  {
    name: "Direct messages",
    category: "private-message",
    table: "direct_messages",
    columns: "id,sender_id,recipient_id,body,created_at,deleted_at,deleted_for_everyone",
    fields: ["body"],
    url: "/messages/{peerId}?message={id}",
    title: "body",
    body: "body",
    createdAt: "created_at",
    authenticated: true,
    nullFilters: [["deleted_at", null]],
    filters: [["deleted_for_everyone", false]],
  },
  {
    name: "Watch rooms",
    category: "video",
    table: "watch_rooms",
    columns: "id,title,description,subject,status,visibility,updated_at",
    fields: ["title", "description", "subject"],
    url: "/watch/{id}",
    title: "title",
    body: "description",
    subject: "subject",
    createdAt: "updated_at",
    authenticated: true,
  },
  {
    name: "Watch-room chat",
    category: "message",
    table: "watch_room_messages",
    columns: "id,room_id,body,created_at,user_id,deleted_at",
    fields: ["body"],
    url: "/watch/{room_id}?message={id}",
    title: "body",
    body: "body",
    createdAt: "created_at",
    authorColumn: "user_id",
    authenticated: true,
    nullFilters: [["deleted_at", null]],
  },
  {
    name: "Forum topics",
    category: "forum",
    table: "forum_threads",
    columns: "id,title,body,subject,tags,created_at,updated_at,user_id",
    fields: ["title", "body"],
    url: "/forum?thread={id}",
    title: "title",
    body: "body",
    description: "subject",
    subject: "subject",
    createdAt: "created_at",
    authorColumn: "user_id",
    authenticated: true,
  },
  {
    name: "Forum replies",
    category: "forum",
    table: "forum_replies",
    columns: "id,body,thread_id,created_at,user_id",
    fields: ["body"],
    url: "/forum?thread={thread_id}&reply={id}",
    title: "body",
    body: "body",
    createdAt: "created_at",
    authorColumn: "user_id",
    authenticated: true,
  },
  {
    name: "Public polls",
    category: "community",
    table: "polls",
    columns: "id,question,created_at,closes_at,location",
    fields: ["question"],
    url: "/community",
    title: "question",
    body: "question",
    createdAt: "created_at",
  },
  {
    name: "Feedback wall",
    category: "community",
    table: "feedback_wall_posts",
    columns: "id,message,user_id,created_at,hidden",
    fields: ["message"],
    url: "/feedback",
    title: "message",
    body: "message",
    createdAt: "created_at",
    authorColumn: "user_id",
    filters: [["hidden", false]],
  },
  {
    name: "Feedback forms",
    category: "notice",
    table: "feedback_forms",
    columns: "id,title,description,url,created_at,active",
    fields: ["title", "description"],
    url: "/feedback",
    title: "title",
    body: "description",
    createdAt: "created_at",
    filters: [["active", true]],
  },
  {
    name: "My feedback submissions",
    category: "private-message",
    table: "feedback_submissions",
    columns: "id,user_id,subject,message,category,kind,status,created_at",
    fields: ["subject", "message", "category"],
    url: "/feedback",
    title: "subject",
    body: "message",
    description: "category",
    createdAt: "created_at",
    authorColumn: "user_id",
    authenticated: true,
  },
  {
    name: "Contact and support history",
    category: "private-message",
    table: "contact_messages",
    columns: "id,user_id,subject,body,admin_reply,status,created_at",
    fields: ["subject", "body", "admin_reply"],
    url: "/contact",
    title: "subject",
    body: "body",
    description: "status",
    createdAt: "created_at",
    authorColumn: "user_id",
    authenticated: true,
  },
  {
    name: "My notifications",
    category: "notice",
    table: "notifications",
    columns: "id,title,body,link,created_at,audience",
    fields: ["title", "body"],
    url: "/notifications",
    title: "title",
    body: "body",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Quiz achievements",
    category: "test",
    table: "quiz_achievements",
    columns: "name,description,code,active,sort_order",
    fields: ["name", "description", "code"],
    url: "/quiz",
    title: "name",
    body: "description",
    filters: [["active", true]],
  },
  {
    name: "Quiz missions",
    category: "test",
    table: "quiz_missions",
    columns: "name,description,code,active,period",
    fields: ["name", "description", "code"],
    url: "/quiz",
    title: "name",
    body: "description",
    filters: [["active", true]],
  },
  {
    name: "JEE live sessions",
    category: "video",
    table: "live_sessions",
    columns: "id,title,description,subject,status,scheduled_at,created_at",
    fields: ["title", "description"],
    url: "/jee360",
    title: "title",
    body: "description",
    subject: "subject",
    createdAt: "scheduled_at",
  },
  {
    name: "Published platform announcements",
    category: "notice",
    table: "official_bot_posts",
    columns: "id,title,body,follow_up_comment,published_at,status",
    fields: ["title", "body", "follow_up_comment"],
    url: "/notices",
    title: "title",
    body: "body",
    createdAt: "published_at",
    filters: [["status", "published"]],
  },
  {
    name: "Video comments",
    category: "video",
    table: "video_comments",
    columns: "id,video_id,comment_text,created_at,user_id",
    fields: ["comment_text"],
    url: "/pulse?video={video_id}",
    title: "comment_text",
    body: "comment_text",
    createdAt: "created_at",
    authorColumn: "user_id",
  },
  {
    name: "Tests",
    category: "test",
    table: "tests",
    columns: "id,name,description,subject,exam_type,created_at,status,visibility",
    fields: ["name", "description"],
    url: "/tests/{id}",
    title: "name",
    body: "description",
    description: "subject",
    subject: "subject",
    createdAt: "created_at",
  },
  {
    name: "Practice questions",
    category: "test",
    table: "test_questions",
    columns: "id,test_id,question_text,chapter,topic,subject,created_at,archived",
    fields: ["question_text", "chapter", "topic"],
    url: "/tests/{test_id}",
    title: "question_text",
    body: "question_text",
    description: "topic",
    subject: "subject",
    createdAt: "created_at",
    filters: [["archived", false]],
  },
  {
    name: "Published lectures",
    category: "video",
    table: "video_lectures",
    columns: "id,title,description,subject,chapter,created_at,is_published",
    fields: ["title", "description", "subject", "chapter"],
    url: "/jee360",
    title: "title",
    body: "description",
    description: "chapter",
    subject: "subject",
    createdAt: "created_at",
    filters: [["is_published", true]],
  },
  {
    name: "Notices and announcements",
    category: "notice",
    table: "notices",
    columns: "id,title,body,category,created_at,expires_at",
    fields: ["title", "body", "category"],
    url: "/notices?notice={id}",
    title: "title",
    body: "body",
    description: "category",
    createdAt: "created_at",
  },
  {
    name: "Official NTA notices",
    category: "academic",
    table: "nta_documents",
    columns:
      "id,title,normalized_title,category,document_type,exam_year,session,paper,published_at,official,is_active",
    fields: ["title", "normalized_title", "category", "document_type", "session", "paper"],
    url: "/nta",
    title: "title",
    description: "category",
    createdAt: "published_at",
    filters: [
      ["official", true],
      ["is_active", true],
    ],
  },
  {
    name: "Official question papers",
    category: "academic",
    table: "nta_question_papers",
    columns: "id,title,year,session,shift,paper_type,subject,exam_date",
    fields: ["title", "session", "shift", "paper_type", "subject"],
    url: "/nta",
    title: "title",
    description: "paper_type",
    subject: "subject",
    createdAt: "exam_date",
  },
  {
    name: "Official alerts",
    category: "academic",
    table: "nta_alerts",
    columns: "id,title,summary,alert_type,priority,published_at,is_published",
    fields: ["title", "summary", "alert_type"],
    url: "/nta",
    title: "title",
    body: "summary",
    description: "alert_type",
    createdAt: "published_at",
    filters: [["is_published", true]],
  },
  {
    name: "PYQ questions",
    category: "academic",
    table: "jee_pyq_questions",
    columns:
      "id,question_text,source_label,paper,session,year,exam,difficulty,subject,chapter_id,topic_id,created_at",
    fields: ["question_text", "source_label", "paper", "session"],
    url: "/jee-predictor/pyq?question={id}",
    title: "question_text",
    body: "question_text",
    description: "source_label",
    subject: "subject",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "JEE syllabus chapters",
    category: "academic",
    table: "jee_syllabus_chapters",
    columns: "id,chapter_name,chapter_code,description,subject,exam,is_active,updated_at",
    fields: ["chapter_name", "chapter_code", "description"],
    url: "/jee-predictor/syllabus?chapter={id}",
    title: "chapter_name",
    body: "description",
    description: "chapter_code",
    subject: "subject",
    createdAt: "updated_at",
    authenticated: true,
    filters: [["is_active", true]],
  },
  {
    name: "JEE syllabus topics",
    category: "academic",
    table: "jee_syllabus_topics",
    columns: "id,chapter_id,topic_name,is_active,updated_at",
    fields: ["topic_name"],
    url: "/jee-predictor/syllabus?topic={id}",
    title: "topic_name",
    body: "topic_name",
    createdAt: "updated_at",
    authenticated: true,
    filters: [["is_active", true]],
  },
  {
    name: "Open JEE lectures",
    category: "academic",
    table: "jee_public_lectures",
    columns:
      "id,lecture_title,description,topic,speaker_name,speaker_affiliation,department_name,official_url,event_date,open_to_public",
    fields: [
      "lecture_title",
      "description",
      "topic",
      "speaker_name",
      "speaker_affiliation",
      "department_name",
    ],
    url: "/jee360",
    title: "lecture_title",
    body: "description",
    description: "topic",
    createdAt: "event_date",
    filters: [["open_to_public", true]],
  },
  {
    name: "JEE institution profiles",
    category: "academic",
    table: "jee_institutes",
    columns:
      "id,institute_name,short_name,institute_code,institute_type,city,state,accreditation,accreditation_grade,official_url,active",
    fields: [
      "institute_name",
      "short_name",
      "institute_code",
      "institute_type",
      "city",
      "state",
      "accreditation",
      "accreditation_grade",
    ],
    url: "/jee-predictor/college",
    title: "institute_name",
    description: "institute_type",
    createdAt: "created_at",
    authenticated: true,
    filters: [["active", true]],
  },
  {
    name: "JEE academic programs",
    category: "academic",
    table: "jee_academic_programs",
    columns:
      "id,institute_id,program_name,program_code,degree,degree_type,department,department_name,discipline,specialization,eligibility_summary,eligibility_notes,admission_exam,active,program_slug,updated_at",
    fields: [
      "program_name",
      "program_code",
      "degree",
      "department_name",
      "discipline",
      "specialization",
      "eligibility_summary",
      "eligibility_notes",
    ],
    url: "/jee-predictor/programs",
    title: "program_name",
    body: "eligibility_summary",
    description: "department_name",
    createdAt: "updated_at",
    authenticated: true,
    filters: [["active", true]],
  },
  {
    name: "Academic regulations and policies",
    category: "academic",
    table: "jee_academic_regulations",
    columns:
      "id,institute_id,regulation_name,regulation_type,rule_text,applicable_programs,source_label,year,effective_from,effective_to",
    fields: ["regulation_name", "regulation_type", "rule_text", "source_label"],
    url: "/jee-predictor/institutes",
    title: "regulation_name",
    body: "rule_text",
    description: "regulation_type",
    createdAt: "effective_from",
    authenticated: true,
  },
  {
    name: "JEE admission rules",
    category: "academic",
    table: "jee_admission_rules",
    columns:
      "id,institute_id,program_id,rule_type,rule_text,source_label,age_rule,attempt_rule,qualification_requirement,minimum_exam_requirement,subject_requirement,certificate_requirement,quota,counselling,year,effective_from,effective_to",
    fields: [
      "rule_text",
      "source_label",
      "age_rule",
      "attempt_rule",
      "qualification_requirement",
      "minimum_exam_requirement",
      "subject_requirement",
      "certificate_requirement",
    ],
    url: "/jee-predictor/admission-fit",
    title: "rule_type",
    body: "rule_text",
    description: "counselling",
    createdAt: "effective_from",
    authenticated: true,
  },
  {
    name: "Admission documents and requirements",
    category: "academic",
    table: "jee_application_documents",
    columns:
      "id,document_name,document_code,acceptable_format,alternative_documents,applicable_categories,applicable_quota,issuing_authority,validity_rule,verification_stage,source_label,year",
    fields: [
      "document_name",
      "document_code",
      "acceptable_format",
      "issuing_authority",
      "validity_rule",
      "verification_stage",
    ],
    url: "/jee-predictor/documents",
    title: "document_name",
    body: "validity_rule",
    description: "issuing_authority",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Application steps and status guidance",
    category: "academic",
    table: "jee_application_steps",
    columns:
      "id,application_window_id,step_name,description,document_requirements,source_label,mandatory,verification_required",
    fields: ["step_name", "description", "source_label"],
    url: "/jee-predictor/documents",
    title: "step_name",
    body: "description",
    description: "description",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Application status rules",
    category: "academic",
    table: "jee_application_status_rules",
    columns:
      "id,status_name,status_code,meaning,next_action,deadline_rule,consequence_if_missed,source_label,counselling,year",
    fields: [
      "status_name",
      "status_code",
      "meaning",
      "next_action",
      "deadline_rule",
      "consequence_if_missed",
      "source_label",
    ],
    url: "/jee-predictor/documents",
    title: "status_name",
    body: "meaning",
    description: "next_action",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Application windows",
    category: "academic",
    table: "jee_application_windows",
    columns:
      "id,application_name,application_type,counselling,applicable_institute_types,eligible_categories,fee_notes,source_label,start_at,end_at,correction_start_at,correction_end_at,year",
    fields: ["application_name", "application_type", "counselling", "fee_notes", "source_label"],
    url: "/jee-predictor/documents",
    title: "application_name",
    body: "fee_notes",
    description: "application_type",
    createdAt: "start_at",
    authenticated: true,
  },
  {
    name: "Reservation category rules",
    category: "academic",
    table: "jee_category_rules",
    columns:
      "id,category_code,category_name,certificate_required,certificate_type,certificate_validity_rule,counselling,gender_pool,notes,rank_type,source_label,year",
    fields: [
      "category_code",
      "category_name",
      "certificate_type",
      "certificate_validity_rule",
      "counselling",
      "gender_pool",
      "notes",
      "source_label",
    ],
    url: "/jee-predictor/counselling-checklist",
    title: "category_name",
    body: "notes",
    description: "certificate_validity_rule",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Financial-aid eligibility rules",
    category: "academic",
    table: "jee_aid_eligibility_rules",
    columns: "id,category,condition_description,condition_type,value_text,source_label,year",
    fields: ["category", "condition_description", "value_text", "source_label"],
    url: "/jee-predictor/scholarships",
    title: "condition_description",
    body: "value_text",
    description: "category",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Financial-aid renewal rules",
    category: "academic",
    table: "jee_aid_renewal_rules",
    columns:
      "id,continuation_text,disciplinary_condition,renewal_deadline,minimum_attendance,minimum_cgpa,minimum_percentage,source_label,year",
    fields: ["continuation_text", "disciplinary_condition", "renewal_deadline", "source_label"],
    url: "/jee-predictor/scholarships",
    title: "continuation_text",
    body: "disciplinary_condition",
    description: "renewal_deadline",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Student academic resources",
    category: "academic",
    table: "jee_academic_resource_access",
    columns:
      "id,resource_name,resource_type,description,eligibility,access_scope,provider,authentication_method,subscription_status,source_label,year",
    fields: [
      "resource_name",
      "description",
      "eligibility",
      "access_scope",
      "provider",
      "source_label",
    ],
    url: "/jee-predictor/institutes",
    title: "resource_name",
    body: "description",
    description: "eligibility",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Transparency and official documents",
    category: "academic",
    table: "jee_transparency_documents",
    columns:
      "id,document_title,document_number,document_type,summary,source_label,publication_date,year",
    fields: ["document_title", "document_number", "document_type", "summary", "source_label"],
    url: "/jee-predictor/institutes",
    title: "document_title",
    body: "summary",
    description: "document_type",
    createdAt: "publication_date",
    authenticated: true,
  },
  {
    name: "Student research opportunities",
    category: "academic",
    table: "jee_student_research_opportunities",
    columns:
      "id,opportunity_name,opportunity_type,description,eligibility,departments,duration_text,source_label,application_start,application_deadline,year",
    fields: [
      "opportunity_name",
      "opportunity_type",
      "description",
      "eligibility",
      "duration_text",
      "source_label",
    ],
    url: "/jee-predictor/campus",
    title: "opportunity_name",
    body: "description",
    description: "eligibility",
    createdAt: "application_start",
    authenticated: true,
  },
  {
    name: "Student support services",
    category: "academic",
    table: "jee_student_support_services",
    columns:
      "id,service_name,service_type,description,eligibility,availability,hours_text,source_label",
    fields: [
      "service_name",
      "description",
      "eligibility",
      "availability",
      "hours_text",
      "source_label",
    ],
    url: "/jee-predictor/campus",
    title: "service_name",
    body: "description",
    description: "eligibility",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Personal formula vault",
    category: "academic",
    table: "jee_formula_vault",
    columns:
      "id,user_id,title,formula,explanation,subject,difficulty,chapter_id,topic_id,updated_at",
    fields: ["title", "formula", "explanation"],
    url: "/jee-predictor/syllabus",
    title: "title",
    body: "explanation",
    subject: "subject",
    createdAt: "updated_at",
    ownerScoped: true,
    authenticated: true,
  },
  {
    name: "Institutional research (admin access only)",
    category: "academic",
    table: "jee_research_outputs",
    columns:
      "id,title,description,authors,venue_or_journal,output_type,publication_date,official_url",
    fields: ["title", "description", "authors", "venue_or_journal", "output_type"],
    url: "/admin",
    title: "title",
    body: "description",
    description: "venue_or_journal",
    createdAt: "publication_date",
    authenticated: true,
  },
  {
    name: "Hall of Fame",
    category: "topper",
    table: "toppers",
    columns: "id,name,exam,year,rank,marks,percentile,city,state,notes",
    fields: ["name", "exam", "city", "state", "notes"],
    url: "/toppers",
    title: "name",
    body: "notes",
    description: "exam",
    subject: "exam",
    createdAt: "year",
  },
  {
    name: "Community channels",
    category: "community",
    table: "community_groups",
    columns: "id,name,description,category,platform,is_active",
    fields: ["name", "description"],
    url: "/community",
    title: "name",
    body: "description",
    description: "category",
    authenticated: true,
    filters: [["is_active", true]],
  },
  {
    name: "Communities",
    category: "community",
    table: "communities",
    columns: "id,name,tagline,announcement,created_at",
    fields: ["name", "tagline", "announcement"],
    url: "/community",
    title: "name",
    body: "announcement",
    description: "tagline",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "My study goals",
    category: "note",
    table: "study_planner_goals",
    columns: "id,title,subject,topic,status,target_date,updated_at,user_id",
    fields: ["title", "topic"],
    url: "/planner",
    title: "title",
    body: "topic",
    description: "subject",
    subject: "subject",
    createdAt: "updated_at",
    ownerScoped: true,
    authenticated: true,
  },
  {
    name: "My study tasks",
    category: "note",
    table: "study_planner_tasks",
    columns: "id,title,description,subject,topic,status,scheduled_date,updated_at,user_id",
    fields: ["title", "description", "topic"],
    url: "/planner",
    title: "title",
    body: "description",
    description: "topic",
    subject: "subject",
    createdAt: "updated_at",
    ownerScoped: true,
    authenticated: true,
  },
  {
    name: "My study sessions",
    category: "note",
    table: "study_sessions",
    columns: "id,subject,note,created_at,ended_at,user_id",
    fields: ["note"],
    url: "/my-activity",
    title: "note",
    body: "note",
    subject: "subject",
    createdAt: "created_at",
    ownerScoped: true,
    authenticated: true,
  },
  {
    name: "My SahAI conversations",
    category: "private-message",
    table: "sahai_messages",
    columns: "id,content,role,created_at,user_id",
    fields: ["content"],
    url: "/sahai",
    title: "content",
    body: "content",
    createdAt: "created_at",
    ownerScoped: true,
    authenticated: true,
  },
  {
    name: "My certificates",
    category: "person",
    table: "user_certificates",
    columns:
      "id,user_id,test_name,custom_title,custom_description,issuer_name,rank_text,awarded_at,revoked_at",
    fields: ["test_name", "custom_title", "custom_description", "issuer_name", "rank_text"],
    url: "/my-activity",
    title: "custom_title",
    body: "custom_description",
    description: "test_name",
    createdAt: "awarded_at",
    ownerScoped: true,
    authenticated: true,
    nullFilters: [["revoked_at", null]],
  },
  {
    name: "Admission document requirements",
    category: "academic",
    table: "jee_admission_documents",
    columns:
      "id,document_name,document_code,issuing_authority,mandatory_for,replacement_or_alternative,validity_rule,applicable_categories,counselling,source_label,year,created_at",
    fields: [
      "document_name",
      "document_code",
      "issuing_authority",
      "mandatory_for",
      "replacement_or_alternative",
      "validity_rule",
      "source_label",
    ],
    url: "/jee-predictor/documents",
    title: "document_name",
    body: "validity_rule",
    description: "issuing_authority",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "JEE application fees",
    category: "academic",
    table: "jee_application_fees",
    columns: "id,fee_type,candidate_category,counselling,quota,notes,source_label,year,created_at",
    fields: ["fee_type", "candidate_category", "counselling", "quota", "notes", "source_label"],
    url: "/jee-predictor/fees",
    title: "fee_type",
    body: "notes",
    description: "counselling",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Financial-aid document requirements",
    category: "academic",
    table: "jee_aid_documents",
    columns:
      "id,aid_id,document_name,format_requirement,notes,required_for,acceptable_alternatives,issuing_authority,source_label,created_at",
    fields: [
      "document_name",
      "format_requirement",
      "notes",
      "required_for",
      "acceptable_alternatives",
      "issuing_authority",
      "source_label",
    ],
    url: "/jee-predictor/scholarships",
    title: "document_name",
    body: "notes",
    description: "required_for",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Financial-aid programs",
    category: "academic",
    table: "jee_financial_aid_programs",
    columns:
      "id,aid_name,aid_type,provider_name,provider_type,description,eligibility_summary,academic_requirement,attendance_requirement,continuation_conditions,application_method,required_documents,selection_process,source_label,updated_at",
    fields: [
      "aid_name",
      "aid_type",
      "provider_name",
      "description",
      "eligibility_summary",
      "academic_requirement",
      "attendance_requirement",
      "continuation_conditions",
      "application_method",
      "required_documents",
      "selection_process",
      "source_label",
    ],
    url: "/jee-predictor/scholarships",
    title: "aid_name",
    body: "description",
    description: "eligibility_summary",
    createdAt: "updated_at",
    authenticated: true,
  },
  {
    name: "JEE academic calendars",
    category: "academic",
    table: "jee_academic_calendars",
    columns: "id,institute_id,calendar_name,academic_year,source_label,created_at,updated_at",
    fields: ["calendar_name", "academic_year", "source_label"],
    url: "/jee-predictor/college",
    title: "calendar_name",
    description: "academic_year",
    createdAt: "updated_at",
    authenticated: true,
  },
  {
    name: "Institutional policies",
    category: "academic",
    table: "jee_institutional_policies",
    columns:
      "id,institute_id,policy_name,policy_summary,policy_type,applicable_scope,source_document,source_label,effective_from,effective_to,updated_at",
    fields: [
      "policy_name",
      "policy_summary",
      "policy_type",
      "applicable_scope",
      "source_document",
      "source_label",
    ],
    url: "/jee-predictor/documents",
    title: "policy_name",
    body: "policy_summary",
    description: "policy_type",
    createdAt: "updated_at",
    authenticated: true,
  },
  {
    name: "Institution regulations",
    category: "academic",
    table: "jee_institution_regulations",
    columns:
      "id,institute_id,title,summary,regulation_number,regulation_type,scope,source_label,effective_from,effective_until,created_at",
    fields: ["title", "summary", "regulation_number", "regulation_type", "scope", "source_label"],
    url: "/jee-predictor/documents",
    title: "title",
    body: "summary",
    description: "regulation_type",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Institution public notices",
    category: "notice",
    table: "jee_institution_public_notices",
    columns:
      "id,institute_id,title,summary,notice_type,audience,priority,source_label,notice_date,valid_until,created_at",
    fields: ["title", "summary", "notice_type", "audience", "priority", "source_label"],
    url: "/jee-predictor/documents",
    title: "title",
    body: "summary",
    description: "notice_type",
    createdAt: "notice_date",
    authenticated: true,
  },
  {
    name: "Institution prospectuses",
    category: "academic",
    table: "jee_institution_prospectuses",
    columns:
      "id,institute_id,title,summary,prospectus_type,academic_year,admission_cycle,source_label,publication_date,created_at",
    fields: [
      "title",
      "summary",
      "prospectus_type",
      "academic_year",
      "admission_cycle",
      "source_label",
    ],
    url: "/jee-predictor/documents",
    title: "title",
    body: "summary",
    description: "prospectus_type",
    createdAt: "publication_date",
    authenticated: true,
  },
  {
    name: "Institution governance documents",
    category: "academic",
    table: "jee_governance_documents",
    columns:
      "id,institute_id,title,document_type,approval_body,source_document,source_label,effective_from,effective_until,created_at",
    fields: ["title", "document_type", "approval_body", "source_document", "source_label"],
    url: "/jee-predictor/documents",
    title: "title",
    description: "document_type",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Institution documents",
    category: "academic",
    table: "jee_institution_documents",
    columns:
      "id,institute_id,title,summary,document_number,document_type,source_label,file_format,publication_date,official_document,created_at",
    fields: ["title", "summary", "document_number", "document_type", "source_label", "file_format"],
    url: "/jee-predictor/documents",
    title: "title",
    body: "summary",
    description: "document_type",
    createdAt: "publication_date",
    authenticated: true,
    filters: [["official_document", true]],
  },
  {
    name: "Student financial rules",
    category: "academic",
    table: "jee_student_financial_rules",
    columns:
      "id,institute_id,rule_name,rule_text,rule_type,applicable_scope,source_document,source_label,effective_from,effective_until,created_at",
    fields: [
      "rule_name",
      "rule_text",
      "rule_type",
      "applicable_scope",
      "source_document",
      "source_label",
    ],
    url: "/jee-predictor/fees",
    title: "rule_name",
    body: "rule_text",
    description: "rule_type",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "JEE quota rules",
    category: "academic",
    table: "jee_quota_rules",
    columns:
      "id,quota_code,quota_name,description,applicable_institute_type,applicable_states,counselling,source_label,created_at",
    fields: [
      "quota_code",
      "quota_name",
      "description",
      "applicable_institute_type",
      "applicable_states",
      "counselling",
      "source_label",
    ],
    url: "/jee-predictor/counselling-checklist",
    title: "quota_name",
    body: "description",
    description: "counselling",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Seat-allocation rules",
    category: "academic",
    table: "jee_seat_allocation_rules",
    columns:
      "id,rule_code,rule_name,action_type,applicable_round,consequences,deadline_rule,eligibility_condition,fee_requirement,refund_rule,counselling,source_label,created_at",
    fields: [
      "rule_code",
      "rule_name",
      "action_type",
      "applicable_round",
      "consequences",
      "deadline_rule",
      "eligibility_condition",
      "fee_requirement",
      "refund_rule",
      "counselling",
      "source_label",
    ],
    url: "/jee-predictor/counselling-checklist",
    title: "rule_name",
    body: "consequences",
    description: "counselling",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Program eligibility rules",
    category: "academic",
    table: "jee_program_eligibility_rules",
    columns:
      "id,program_id,qualification,required_subjects,candidate_category,nationality_rule,age_rule,attempts_rule,domicile_rule,gender_rule,other_conditions,source_label,created_at",
    fields: [
      "qualification",
      "required_subjects",
      "candidate_category",
      "nationality_rule",
      "age_rule",
      "attempts_rule",
      "domicile_rule",
      "gender_rule",
      "other_conditions",
      "source_label",
    ],
    url: "/jee-predictor/admission-fit",
    title: "qualification",
    body: "other_conditions",
    description: "candidate_category",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Scholarships",
    category: "academic",
    table: "jee_scholarship_data",
    columns:
      "id,scholarship_name,scholarship_type,institute_name,institute_type,description,eligibility,applicable_programs,application_method,category,state,source_label,updated_at",
    fields: [
      "scholarship_name",
      "scholarship_type",
      "institute_name",
      "institute_type",
      "description",
      "eligibility",
      "applicable_programs",
      "application_method",
      "category",
      "state",
      "source_label",
    ],
    url: "/jee-predictor/scholarships",
    title: "scholarship_name",
    body: "description",
    description: "eligibility",
    createdAt: "updated_at",
    authenticated: true,
  },
  {
    name: "Institute profiles",
    category: "academic",
    table: "jee_institute_profiles",
    columns:
      "id,institute_id,description,mission,campus_overview,notable_features,academic_reputation,research_strength,source_label,updated_at",
    fields: [
      "description",
      "mission",
      "campus_overview",
      "notable_features",
      "academic_reputation",
      "research_strength",
      "source_label",
    ],
    url: "/jee-predictor/college",
    title: "description",
    body: "campus_overview",
    description: "mission",
    createdAt: "updated_at",
    authenticated: true,
  },
  {
    name: "Institute facilities",
    category: "academic",
    table: "jee_institute_facilities",
    columns:
      "id,institute_id,facility_name,facility_type,details,available,source_label,created_at",
    fields: ["facility_name", "facility_type", "details", "source_label"],
    url: "/jee-predictor/campus",
    title: "facility_name",
    body: "details",
    description: "facility_type",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "Institute events",
    category: "academic",
    table: "jee_institute_events",
    columns:
      "id,institute_id,event_name,event_type,description,eligibility,department_name,organizer_name,participation_mode,venue,city,source_label,start_at,created_at",
    fields: [
      "event_name",
      "event_type",
      "description",
      "eligibility",
      "department_name",
      "organizer_name",
      "participation_mode",
      "venue",
      "city",
      "source_label",
    ],
    url: "/jee-predictor/campus",
    title: "event_name",
    body: "description",
    description: "event_type",
    createdAt: "start_at",
    authenticated: true,
  },
  {
    name: "Institute rankings",
    category: "academic",
    table: "jee_institute_rankings",
    columns: "id,institute_id,ranking_body,ranking_category,notes,source_label,year,created_at",
    fields: ["ranking_body", "ranking_category", "notes", "source_label"],
    url: "/jee-predictor/college",
    title: "ranking_body",
    body: "notes",
    description: "ranking_category",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "JEE concept dependencies",
    category: "academic",
    table: "jee_concept_dependencies",
    columns: "id,subject,exam,notes,created_at",
    fields: ["subject", "exam", "notes"],
    url: "/jee-predictor/concept-map",
    title: "subject",
    body: "notes",
    description: "exam",
    createdAt: "created_at",
    authenticated: true,
  },
  {
    name: "My JEE backlog",
    category: "note",
    table: "jee_backlog_items",
    columns: "id,user_id,title,subject,status,priority,notes,deadline,updated_at",
    fields: ["title", "subject", "status", "priority", "notes"],
    url: "/jee-predictor/backlog",
    title: "title",
    body: "notes",
    subject: "subject",
    createdAt: "updated_at",
    ownerScoped: true,
    authenticated: true,
  },
  {
    name: "My revision tasks",
    category: "note",
    table: "jee_revision_tasks",
    columns: "id,user_id,title,notes,revision_type,status,scheduled_for,updated_at",
    fields: ["title", "notes", "revision_type", "status"],
    url: "/jee-predictor/revision",
    title: "title",
    body: "notes",
    description: "revision_type",
    createdAt: "updated_at",
    ownerScoped: true,
    authenticated: true,
  },
  {
    name: "My mistake book",
    category: "note",
    table: "jee_mistake_book",
    columns: "id,user_id,correct_approach,learning_note,mistake_type,subject,created_at,updated_at",
    fields: ["correct_approach", "learning_note", "mistake_type", "subject"],
    url: "/jee-predictor/mistake-book",
    title: "learning_note",
    body: "correct_approach",
    description: "mistake_type",
    subject: "subject",
    createdAt: "updated_at",
    ownerScoped: true,
    authenticated: true,
  },
  {
    name: "My saved question notes",
    category: "note",
    table: "jee_question_bookmarks",
    columns: "id,user_id,question_id,note,status,updated_at",
    fields: ["note", "status"],
    url: "/jee-predictor/question-bookmarks",
    title: "note",
    body: "note",
    createdAt: "updated_at",
    ownerScoped: true,
    authenticated: true,
  },
  {
    name: "My counselling preferences",
    category: "note",
    table: "jee_preference_lists",
    columns: "id,user_id,name,counselling,exam,status,year,updated_at",
    fields: ["name", "counselling", "exam", "status"],
    url: "/jee-predictor/preferences",
    title: "name",
    description: "counselling",
    createdAt: "updated_at",
    ownerScoped: true,
    authenticated: true,
  },
  {
    name: "My syllabus progress notes",
    category: "note",
    table: "jee_syllabus_progress",
    columns: "user_id,chapter_id,notes,status,updated_at",
    fields: ["notes", "status"],
    url: "/jee-predictor/syllabus",
    title: "notes",
    body: "notes",
    createdAt: "updated_at",
    ownerScoped: true,
    authenticated: true,
  },
];

async function adminStatus(db: SupabaseSearchClient, userId: string | null) {
  if (!userId) return false;
  try {
    const response = await (db
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .range(0, 0) as Query);
    return !response.error && (response.data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

async function matchingPublicAuthorIds(db: SupabaseSearchClient, query: string, limit: number) {
  try {
    const like = `%${query}%`;
    const response = await db
      .from("public_profiles")
      .select("id")
      .or(`full_name.ilike.${like},username.ilike.${like},bio.ilike.${like}`)
      .range(0, Math.min(99, limit - 1));
    if (response.error) return [];
    return [...new Set((response.data ?? []).map((row) => text(row.id)).filter(Boolean))];
  } catch {
    return [];
  }
}

async function publicAuthorNames(db: SupabaseSearchClient, authorIds: string[]) {
  if (!authorIds.length) return new Map<string, string>();
  try {
    const response = await db
      .from("public_profiles")
      .select("id,full_name,username")
      .in("id", authorIds.slice(0, 100))
      .range(0, Math.min(99, authorIds.length - 1));
    if (response.error) return new Map<string, string>();
    return new Map(
      (response.data ?? []).map((row) => [
        text(row.id),
        text(row.full_name) || text(row.username) || "Student",
      ]),
    );
  } catch {
    return new Map<string, string>();
  }
}

export async function searchUniversalWithClient(
  client: unknown,
  {
    query: rawQuery,
    userId = null,
    page = 1,
    pageSize = 10,
    category = "all",
    since,
    sortBy = "relevance",
  }: {
    query: string;
    userId?: string | null;
    page?: number;
    pageSize?: number;
    category?: string;
    since?: string | null;
    sortBy?: "relevance" | "newest";
  },
): Promise<SearchPage> {
  const db = client as SupabaseSearchClient;
  const query = normalizedQuery(rawQuery);
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(30, Math.max(1, Math.floor(pageSize)));
  if (query.length < 2)
    return { results: [], total: 0, page: safePage, pageSize: safePageSize, warnings: [] };

  const like = `%${query}%`;
  const sourceLimit = Math.min(100, safePage * safePageSize);
  const matchingAuthorsPromise = matchingPublicAuthorIds(db, query, sourceLimit);
  const selectedSources = SOURCES.filter(
    (source) => category === "all" || source.category === category,
  ).filter((source) => !source.authenticated || Boolean(userId));
  const sourceResultsPromise = mapConcurrent(selectedSources, 10, async (source) => {
    try {
      if (source.ownerScoped && !userId)
        return {
          source: source.name,
          rows: [] as UniversalSearchResult[],
          count: 0,
          warning: null as string | null,
        };
      const authorIds = source.authorColumn ? await matchingAuthorsPromise : [];
      const columns =
        source.createdAt && !source.columns.split(",").includes(source.createdAt)
          ? `${source.columns},${source.createdAt}`
          : source.columns;
      let request = db.from(source.table).select(columns, { count: "exact" });
      if (source.table === "direct_messages" && userId) {
        request = request.or(
          `and(body.ilike.${like},sender_id.eq.${userId}),and(body.ilike.${like},recipient_id.eq.${userId})`,
        );
      } else {
        const expressions = source.fields.map((field) => `${field}.ilike.${like}`);
        if (source.authorColumn && authorIds.length)
          expressions.push(`${source.authorColumn}.in.(${authorIds.join(",")})`);
        request = request.or(expressions.join(","));
      }
      if (source.ownerScoped && userId) request = request.eq("user_id", userId);
      if (since && source.createdAt && source.createdAt !== "year")
        request = request.gte(source.createdAt, since);
      for (const [column, value] of source.filters ?? []) request = request.eq(column, value);
      for (const [column, value] of source.nullFilters ?? []) request = request.is(column, value);
      if (source.table === "study_group_messages" && userId) {
        // Group-message RLS limits rows to groups the signed-in user can read.
        request = request.order("created_at", { ascending: false });
      } else if (source.createdAt && source.createdAt !== "year") {
        request = request.order(source.createdAt, { ascending: false });
      }
      request = request.range(0, sourceLimit - 1);
      const response = await request;
      if (response.error) throw response.error;
      const rows = (response.data ?? []).map((row) => {
        const mapped = result(row, query, { ...source, source: source.name });
        if (source.table === "direct_messages" && userId) {
          const peerId = row.sender_id === userId ? row.recipient_id : row.sender_id;
          mapped.url = `/messages/${encodeURIComponent(text(peerId))}?message=${encodeURIComponent(text(row.id))}`;
          mapped.title = "Direct message";
        }
        if (source.table === "forum_replies")
          mapped.url = `/forum?thread=${encodeURIComponent(text(row.thread_id))}&reply=${encodeURIComponent(text(row.id))}`;
        if (source.table === "feed_comments")
          mapped.url = `/community?post=${encodeURIComponent(text(row.post_id))}&comment=${encodeURIComponent(text(row.id))}`;
        if (source.table === "study_group_messages") {
          mapped.groupName = "Study group";
          mapped.title = mapped.groupName;
          mapped.url = `/squad/${encodeURIComponent(text(row.group_id))}?message=${encodeURIComponent(text(row.id))}`;
        }
        if (source.table === "chat_messages") {
          const kind = text(row.kind);
          if (kind === "general")
            mapped.url = `/community?tab=general&message=${encodeURIComponent(text(row.id))}`;
          else {
            const doubtId = kind === "doubt_reply" ? text(row.parent_id) : text(row.id);
            mapped.url = `/community?tab=doubts${doubtId ? `&message=${encodeURIComponent(doubtId)}` : ""}`;
          }
        }
        if (source.table === "article_comments") {
          const article =
            row.article && typeof row.article === "object" ? (row.article as DbRow) : {};
          const slug = text(article.slug);
          if (slug)
            mapped.url = `/articles/${encodeURIComponent(slug)}?comment=${encodeURIComponent(text(row.id))}#comment-${encodeURIComponent(text(row.id))}`;
        }
        if (source.table === "profile_post_comments") {
          const post = row.post && typeof row.post === "object" ? (row.post as DbRow) : {};
          const profileId = text(post.user_id);
          mapped.url = profileId
            ? `/u/${encodeURIComponent(profileId)}#post-${encodeURIComponent(text(row.post_id))}`
            : "/pulse";
        }
        if (source.table === "profile_posts")
          mapped.url = `/u/${encodeURIComponent(text(row.user_id))}#posts`;
        if (source.table === "watch_room_messages")
          mapped.url = `/watch/${encodeURIComponent(text(row.room_id))}?message=${encodeURIComponent(text(row.id))}`;
        if (source.table === "video_comments")
          mapped.url = `/pulse?video=${encodeURIComponent(text(row.video_id))}`;
        if (source.table === "feed_posts" && !mapped.title) mapped.title = "Community post";
        if (source.table === "toppers")
          mapped.description = `${text(row.exam)} · ${text(row.year)} · Rank ${text(row.rank)}`;
        return mapped;
      });
      return {
        source: source.name,
        rows,
        count: response.count ?? rows.length,
        warning: null as string | null,
      };
    } catch (error) {
      if (import.meta.env.DEV) console.warn(`[universal-search] ${source.name} unavailable`, error);
      return {
        source: source.name,
        rows: [] as UniversalSearchResult[],
        count: 0,
        warning: source.name,
      };
    }
  });

  const [sourceResults, isAdmin] = await Promise.all([
    sourceResultsPromise,
    adminStatus(db, userId),
  ]);
  const dbRows = sourceResults.flatMap((item) => item.rows);
  const authorNames = await publicAuthorNames(db, [
    ...new Set(dbRows.map((item) => item.authorId).filter((id): id is string => Boolean(id))),
  ]);
  for (const row of dbRows) if (row.authorId) row.authorName = authorNames.get(row.authorId);
  const policies =
    !since && (category === "all" || category === "policy")
      ? POLICY_DOCS.filter((doc) =>
          `${doc.title} ${doc.summary} ${doc.sections.flatMap((section) => [section.heading, ...section.body]).join(" ")}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()),
        ).map((doc) => {
          const body =
            doc.sections
              .flatMap((section) => [section.heading, ...section.body])
              .find((part) => part.toLocaleLowerCase().includes(query.toLocaleLowerCase())) ??
            doc.summary;
          return {
            id: `policy:${doc.id}`,
            title: doc.title,
            description: doc.summary,
            snippet: excerpt(body, query),
            category: "policy" as const,
            source: "Policy and community rules",
            url: `/legal/${encodeURIComponent(doc.id)}`,
            score: 0,
          };
        })
      : [];
  const routes =
    !since && (category === "all" || category === "route")
      ? routeResults(query, Boolean(userId), isAdmin)
      : [];
  const combined = [...dbRows, ...policies, ...routes];
  const seen = new Set<string>();
  const unique = combined
    .filter((item) => {
      const key = `${item.category}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => ({ ...item, score: titleScore(item, query) }))
    .sort((a, b) => {
      const dateA = "createdAt" in a ? (a.createdAt ?? "") : "";
      const dateB = "createdAt" in b ? (b.createdAt ?? "") : "";
      return sortBy === "newest"
        ? dateB.localeCompare(dateA) ||
            (b.score ?? 0) - (a.score ?? 0) ||
            a.title.localeCompare(b.title)
        : (b.score ?? 0) - (a.score ?? 0) ||
            dateB.localeCompare(dateA) ||
            a.title.localeCompare(b.title);
    });

  const sourceCount = sourceResults.reduce((sum, item) => sum + item.count, 0);
  const policyCount = policies.length;
  const routeCount = routes.length;
  const total =
    category === "all"
      ? sourceCount + policyCount + routeCount
      : sourceCount +
        (category === "policy" ? policyCount : 0) +
        (category === "route" ? routeCount : 0);
  const start = (safePage - 1) * safePageSize;
  return {
    results: unique.slice(start, start + safePageSize),
    total,
    page: safePage,
    pageSize: safePageSize,
    warnings: sourceResults.flatMap((item) => (item.warning ? [item.warning] : [])),
  };
}

export function getSearchCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    route: "Feature",
    person: "Profile",
    note: "Notes",
    material: "Study material",
    article: "Article",
    academic: "Official JEE resource",
    notice: "Announcement",
    community: "Community",
    forum: "Forum",
    message: "Group message",
    "private-message": "Private message",
    test: "Practice",
    video: "Lecture",
    topper: "Topper",
    policy: "Policy",
  };
  return labels[category] ?? "Search result";
}

export async function getQuickSearchRoutesWithClient(
  client: unknown,
  userId: string | null,
  limit = 6,
) {
  const admin = await adminStatus(client as SupabaseSearchClient, userId);
  const routes = ROUTE_REGISTRY.filter(
    (route) => (!route.requiresAuth || Boolean(userId)) && (!route.requiresAdmin || admin),
  );
  const seen = new Set<string>();
  return routes
    .filter((route) => {
      if (seen.has(route.href)) return false;
      seen.add(route.href);
      return true;
    })
    .sort(
      (a, b) =>
        a.href.split("/").filter(Boolean).length - b.href.split("/").filter(Boolean).length ||
        a.title.localeCompare(b.title),
    )
    .slice(0, Math.max(1, limit))
    .map((route) => ({
      id: `route:${route.id}`,
      title: route.title,
      description: route.description || `Open ${route.path}`,
      snippet: route.description || `Open the ${route.title} section of PREPWIAN.`,
      category: "route" as const,
      source: "PREPWIAN page",
      url: route.href,
    }));
}
