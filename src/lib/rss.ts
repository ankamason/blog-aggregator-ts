import { XMLParser } from "fast-xml-parser";

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
  }

  const xmlText = await response.text();

  const parser = new XMLParser({ processEntities: false });
  const parsed = parser.parse(xmlText);

  const channel = parsed.rss?.channel;
  if (!channel) {
    throw new Error("Could not find channel in RSS feed");
  }

  if (
    channel.title === undefined ||
    channel.link === undefined ||
    channel.description === undefined
  ) {
    throw new Error("Channel is missing required metadata");
  }

  let rawItems: any[] = [];
  if (Array.isArray(channel.item)) {
    rawItems = channel.item;
  } else if (channel.item) {
    rawItems = [channel.item];
  }

  const items: RSSItem[] = [];
  for (const item of rawItems) {
    if (
      item.title === undefined ||
      item.link === undefined ||
      item.description === undefined ||
      item.pubDate === undefined
    ) {
      continue;
    }
    items.push({
      title: item.title,
      link: item.link,
      description: item.description,
      pubDate: item.pubDate,
    });
  }

  return {
    channel: {
      title: channel.title,
      link: channel.link,
      description: channel.description,
      item: items,
    },
  };
}
