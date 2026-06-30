import { fetchFeed } from "./rss";
import {
  getNextFeedToFetch,
  markFeedFetched,
} from "./db/queries/feeds";
import { createPost } from "./db/queries/posts";

export function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error(
      `invalid duration: ${durationStr} (expected formats: 1ms, 1s, 1m, 1h)`,
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 1000 * 60;
    case "h":
      return value * 1000 * 60 * 60;
    default:
      throw new Error(`unknown duration unit: ${unit}`);
  }
}

function parsePublishedAt(pubDate: string | undefined): Date | null {
  if (!pubDate) {
    return null;
  }
  const parsed = new Date(pubDate);
  if (isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export async function scrapeFeeds() {
  const feed = await getNextFeedToFetch();
  if (!feed) {
    console.log("No feeds to fetch");
    return;
  }

  await markFeedFetched(feed.id);

  const rssFeed = await fetchFeed(feed.url);

  console.log(`\nScraping feed: ${feed.name}`);
  let savedCount = 0;

  for (const item of rssFeed.channel.item) {
    const post = await createPost({
      title: item.title,
      url: item.link,
      description: item.description ?? null,
      publishedAt: parsePublishedAt(item.pubDate),
      feedId: feed.id,
    });

    if (post) {
      savedCount++;
    }
  }

  console.log(`  Saved ${savedCount} new posts from ${feed.name}`);
}

export function handleError(err: unknown) {
  console.error(`Error during scrape: ${(err as Error).message}`);
}