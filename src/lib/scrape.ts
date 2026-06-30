import { fetchFeed } from "./rss";
import {
  getNextFeedToFetch,
  markFeedFetched,
} from "./db/queries/feeds";

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

export async function scrapeFeeds() {
  const feed = await getNextFeedToFetch();
  if (!feed) {
    console.log("No feeds to fetch");
    return;
  }

  await markFeedFetched(feed.id);

  const rssFeed = await fetchFeed(feed.url);

  console.log(`\nFeed: ${feed.name} (${feed.url})`);
  for (const item of rssFeed.channel.item) {
    console.log(` - ${item.title}`);
  }
}

export function handleError(err: unknown) {
  console.error(`Error during scrape: ${(err as Error).message}`);
}
