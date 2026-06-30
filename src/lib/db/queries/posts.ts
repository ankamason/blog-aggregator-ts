import { eq, desc } from "drizzle-orm";
import { db } from "..";
import { posts, feeds, feedFollows } from "../schema";

export type NewPost = {
  title: string;
  url: string;
  description: string | null;
  publishedAt: Date | null;
  feedId: string;
};

export async function createPost(post: NewPost) {
  const [result] = await db
    .insert(posts)
    .values(post)
    .onConflictDoNothing({ target: posts.url })
    .returning();
  return result;
}

export async function getPostsForUser(userId: string, limit: number) {
  return await db
    .select({
      id: posts.id,
      title: posts.title,
      url: posts.url,
      description: posts.description,
      publishedAt: posts.publishedAt,
      feedName: feeds.name,
    })
    .from(posts)
    .innerJoin(feeds, eq(posts.feedId, feeds.id))
    .innerJoin(feedFollows, eq(feedFollows.feedId, feeds.id))
    .where(eq(feedFollows.userId, userId))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}
