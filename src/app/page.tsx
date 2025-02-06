// src/app/page.tsx
import Link from "next/link";
import Head from "next/head";
import { getAllPublished, PostMetaData } from "@/lib/notion";

export const revalidate = 60; // 每 60 秒重新驗證 ISR

export default async function HomePage() {
  // 取得所有已發佈文章
  const posts: PostMetaData[] = await getAllPublished();

  if (!posts || posts.length === 0) {
    return <h1 className="text-center text-2xl mt-10">No posts available</h1>;
  }

  return (
    <div className="container mx-auto px-4">
      <Head>
        <title>My Notion Blog</title>
        <meta
          name="description"
          content="A blog built with Next.js, TypeScript, Tailwind CSS and Notion as CMS"
        />
      </Head>
      <main className="py-8">
        <h1 className="text-4xl font-bold mb-8">部落格</h1>
        <div className="grid gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-6 border rounded hover:border-blue-500"
            >
              <h2 className="text-2xl font-semibold mb-2">
                <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              </h2>
              <div className="text-sm text-gray-500 mb-2">{post.date}</div>
              <p className="text-gray-700">{post.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
