import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { normalizeArticleContent } from "@/lib/article-content";

type StudyMarkdownProps = {
  content: string | null | undefined;
};

const safeUrl = (url: string): string => {
  const value = url.trim();
  return /^(?:https?:\/\/|mailto:|tel:|#|\/)/i.test(value) ? value : "";
};

const markdownComponents: Components = {
  h1: ({ children }) => <h1>{children}</h1>,
  h2: ({ children }) => <h2>{children}</h2>,
  h3: ({ children }) => <h3>{children}</h3>,
  h4: ({ children }) => <h4>{children}</h4>,
  p: ({ children }) => <p>{children}</p>,
  strong: ({ children }) => <strong>{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  ul: ({ children }) => <ul>{children}</ul>,
  ol: ({ children }) => <ol>{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  table: ({ children }) => (
    <div className="study-markdown-table-wrap">
      <table>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => <td>{children}</td>,
  img: ({ src, alt }) => {
    const safeSrc = typeof src === "string" ? safeUrl(src) : "";
    return safeSrc ? <img src={safeSrc} alt={alt ?? "Article image"} loading="lazy" /> : null;
  },
  a: ({ children, href }) => {
    const safeHref = typeof href === "string" ? safeUrl(href) : "";
    return safeHref ? (
      <a
        href={safeHref}
        target={safeHref.startsWith("#") ? undefined : "_blank"}
        rel={safeHref.startsWith("#") ? undefined : "noopener noreferrer"}
      >
        {children}
      </a>
    ) : (
      <>{children}</>
    );
  },
  pre: ({ children }) => <pre>{children}</pre>,
  code: ({ children, className }) => <code className={className ?? undefined}>{children}</code>,
  hr: () => <hr />,
};

export function StudyMarkdown({ content }: StudyMarkdownProps) {
  const normalizedContent = normalizeArticleContent(content);

  return (
    <div className="study-markdown max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
        rehypePlugins={[
          [rehypeKatex, { errorColor: "inherit", strict: "ignore", throwOnError: false }],
        ]}
        urlTransform={safeUrl}
        components={markdownComponents}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
