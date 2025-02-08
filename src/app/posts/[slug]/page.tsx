import Head from "next/head";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { getAllPublished, getSinglePost } from "@/lib/notion";

export const revalidate = 60; // 每 60 秒重新驗證 ISR

// 語法高亮的 code 區塊元件
const CodeBlock: React.FC<{ language: string; value: string }> = ({
  language,
  value,
}) => {
  return (
    <SyntaxHighlighter language={language} style={vscDarkPlus} PreTag="div">
      {value}
    </SyntaxHighlighter>
  );
};

interface MarkdownCodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await Promise.resolve(params);
  const post = await getSinglePost(slug);

  if (!post) {
    return <div className="text-center mt-10">文章不存在</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>{post.metadata.title}</title>
        <meta name="description" content={post.metadata.description} />
      </Head>
      <article className="prose lg:prose-xl mx-auto">
        <h1>{post.metadata.title}</h1>
        <div className="text-sm text-gray-500 mb-4">{post.metadata.date}</div>
        <div className="mb-4 text-gray-600">
          標籤：{post.metadata.tags.join(", ")}
        </div>
        <ReactMarkdown
          components={{
            code({ inline, className, children, ...props }: MarkdownCodeProps) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <CodeBlock
                  language={match[1]}
                  value={String(children).replace(/\n$/, "")}
                />
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {post.markdown}
        </ReactMarkdown>
      </article>
    </div>
  );
}

// Next.js 13 app 路由中使用 generateStaticParams 來產生靜態路由參數
export async function generateStaticParams() {
  const posts = await getAllPublished();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}
