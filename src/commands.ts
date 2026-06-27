import { setUser, readConfig } from "./config";
import {
  createUser,
  getUserByName,
  resetUsers,
  getUsers,
  
} from "./lib/db/queries/users";
import { createUser, getUserByName } from "./lib/db/queries/users";
import { createUser, getUserByName, resetUsers } from "./lib/db/queries/users";
import { fetchFeed } from "./lib/rss";
import { createFeed } from "./lib/db/queries/feeds";
import type { Feed, User } from "./lib/db/schema";
import { createFeed, getFeeds } from "./lib/db/queries/feeds";


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
  const feedURL = "https://www.wagslane.dev/index.xml";
  const feed = await fetchFeed(feedURL);
  console.log(JSON.stringify(feed, null, 2));
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
  ...args: string[]
): Promise<void> {
  if (args.length < 2) {
    throw new Error("addfeed requires a name and a url");
  }

  const feedName = args[0];
  const feedURL = args[1];

  const config = readConfig();
  const currentUserName = config.currentUserName;
  if (!currentUserName) {
    throw new Error("no user is currently logged in");
  }

  const user = await getUserByName(currentUserName);
  if (!user) {
    throw new Error(`user ${currentUserName} not found`);
  }

  const feed = await createFeed(feedName, feedURL, user.id);

  console.log("Feed created successfully:");
  printFeed(feed, user);
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