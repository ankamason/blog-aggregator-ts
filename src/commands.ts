import { setUser, readConfig } from "./config";
import {
  createUser,
  getUserByName,
  resetUsers,
  getUsers,
} from "./lib/db/queries/users";
import { fetchFeed } from "./lib/rss";
import type { Feed, User } from "./lib/db/schema";
import { createFeed, getFeeds, getFeedByURL } from "./lib/db/queries/feeds";
import {
  createFeedFollow,
  getFeedFollowsForUser,
  deleteFeedFollow,
} from "./lib/db/queries/feed_follows";
import { parseDuration, scrapeFeeds, handleError } from "./lib/scrape";


export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export async function handlerLogin(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("login requires a username argument");
  }

  const userName = args[0];

  const existingUser = await getUserByName(userName);
  if (!existingUser) {
    throw new Error(`user ${userName} does not exist`);
  }

  setUser(userName);
  console.log(`User has been set to: ${userName}`);
}

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

export function middlewareLoggedIn(
  handler: UserCommandHandler,
): CommandHandler {
  return async (cmdName: string, ...args: string[]): Promise<void> => {
    const config = readConfig();
    const currentUserName = config.currentUserName;
    if (!currentUserName) {
      throw new Error("no user is currently logged in");
    }

    const user = await getUserByName(currentUserName);
    if (!user) {
      throw new Error(`user ${currentUserName} not found`);
    }

    await handler(cmdName, user, ...args);
  };
}

export async function handlerRegister(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("register requires a username argument");
  }

  const userName = args[0];

  const existingUser = await getUserByName(userName);
  if (existingUser) {
    throw new Error(`user ${userName} already exists`);
  }

  const user = await createUser(userName);
  setUser(userName);

  console.log(`User ${userName} was created successfully`);
  console.log(user);
}

export async function handlerReset(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  try {
    await resetUsers();
    console.log("Database reset successfully");
  } catch (err) {
    console.error(`Error resetting database: ${(err as Error).message}`);
    process.exit(1);
  }
}

export async function handlerUsers(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const users = await getUsers();
  const config = readConfig();
  const currentUser = config.currentUserName;

  for (const user of users) {
    if (user.name === currentUser) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  }
}

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
): void {
  registry[cmdName] = handler;
}

export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];
  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }
  await handler(cmdName, ...args);
}

export async function handlerAgg(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("agg requires a duration (e.g. 1s, 1m, 1h)");
  }

  const timeBetweenRequests = parseDuration(args[0]);
  console.log(`Collecting feeds every ${args[0]}`);

  scrapeFeeds().catch(handleError);

  const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

export function printFeed(feed: Feed, user: User): void {
  console.log(`Feed ID:       ${feed.id}`);
  console.log(`Created At:    ${feed.createdAt}`);
  console.log(`Updated At:    ${feed.updatedAt}`);
  console.log(`Name:          ${feed.name}`);
  console.log(`URL:           ${feed.url}`);
  console.log(`User ID:       ${feed.userId}`);
  console.log(`User:          ${user.name}`);
}

export async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 2) {
    throw new Error("addfeed requires a name and a url");
  }

  const feedName = args[0];
  const feedURL = args[1];

  const feed = await createFeed(feedName, feedURL, user.id);
  const followRecord = await createFeedFollow(user.id, feed.id);

  console.log("Feed created successfully:");
  printFeed(feed, user);
  console.log(`Now following: ${followRecord.feedName} (user: ${followRecord.userName})`);
}

export async function handlerFeeds(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const feeds = await getFeeds();

  for (const feed of feeds) {
    console.log(`Name:    ${feed.feedName}`);
    console.log(`URL:     ${feed.feedURL}`);
    console.log(`User:    ${feed.userName}`);
    console.log("---");
  }
}
async function getCurrentUser() {
  const config = readConfig();
  const currentUserName = config.currentUserName;
  if (!currentUserName) {
    throw new Error("no user is currently logged in");
  }
  const user = await getUserByName(currentUserName);
  if (!user) {
    throw new Error(`user ${currentUserName} not found`);
  }
  return user;
}
export async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("follow requires a feed url");
  }

  const url = args[0];

  const feed = await getFeedByURL(url);
  if (!feed) {
    throw new Error(`no feed found with url ${url}`);
  }

  const followRecord = await createFeedFollow(user.id, feed.id);

  console.log(`Feed:  ${followRecord.feedName}`);
  console.log(`User:  ${followRecord.userName}`);
}

export async function handlerFollowing(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  const follows = await getFeedFollowsForUser(user.id);

  console.log(`Feeds followed by ${user.name}:`);
  for (const follow of follows) {
    console.log(`* ${follow.feedName}`);
  }
}
export async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("unfollow requires a feed url");
  }

  const url = args[0];

  const feed = await getFeedByURL(url);
  if (!feed) {
    throw new Error(`no feed found with url ${url}`);
  }

  await deleteFeedFollow(user.id, feed.id);

  console.log(`${user.name} unfollowed ${feed.name}`);
}