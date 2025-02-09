"use server";
// lib/notion.ts
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import {
  PageObjectResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";

// 初始化 Notion 客戶端
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// 初始化 NotionToMarkdown
const n2m = new NotionToMarkdown({ notionClient: notion });

// 定義一個介面來描述文章的 metadata
export interface PostMetaData {
  id: string;
  title: string;
  tags: string[];
  description: string;
  date: string;
  slug: string;
}

// 取得單一文章日期格式化
function formatDate(dateString?: string): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const date = dateString ? new Date(dateString) : new Date();
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

// 從 Notion 頁面資料中萃取所需的 metadata
const getPageMetaData = (page: PageObjectResponse): PostMetaData => {
  const getTags = (tags: { name: string }[]): string[] => {
    return tags.map((tag) => tag.name);
  };

  return {
    id: page.id,
    title:
      "title" in page.properties.Name
        ? page.properties.Name.title[0]?.plain_text || "No title"
        : "No title",
    tags:
      "multi_select" in page.properties.Tags
        ? getTags(page.properties.Tags.multi_select)
        : [],
    description:
      "rich_text" in page.properties.Description
        ? page.properties.Description.rich_text[0]?.plain_text || ""
        : "",
    date: formatDate(
      "date" in page.properties.Date && page.properties.Date.date
        ? page.properties.Date.date.start || page.last_edited_time
        : undefined
    ),
    slug:
      "rich_text" in page.properties.Slug
        ? page.properties.Slug.rich_text[0]?.plain_text || ""
        : "",
  };
};

// 取得所有已發佈的文章
export const getAllPublished = async (): Promise<PostMetaData[]> => {
  const response: QueryDatabaseResponse = await notion.databases.query({
    database_id: process.env.DATABASE_ID as string,
    filter: {
      property: "Published",
      checkbox: {
        equals: true,
      },
    },
    sorts: [
      {
        property: "Date",
        direction: "descending",
      },
    ],
  });

  return response.results
    .filter((post): post is PageObjectResponse => "properties" in post) // 過濾掉可能的 `partial support` responses
    .map((post) => getPageMetaData(post));
};

// 取得單一文章（根據 slug）
export const getSinglePost = async (
  slug: string
): Promise<{
  metadata: PostMetaData;
  markdown: string;
}> => {
  const response: QueryDatabaseResponse = await notion.databases.query({
    database_id: process.env.DATABASE_ID as string,
    filter: {
      property: "Slug",
      formula: {
        string: {
          equals: slug,
        },
      },
    },
  });

  const page = response.results.find(
    (result): result is PageObjectResponse => "properties" in result
  );

  if (!page) {
    throw new Error("Post not found");
  }

  const metadata = getPageMetaData(page);
  const mdblocks = await n2m.pageToMarkdown(page.id);
  const mdString = n2m.toMarkdownString(mdblocks);

  return {
    metadata,
    markdown: mdString.parent,
  };
};
