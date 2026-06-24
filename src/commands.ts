import { setUser } from "./config";
import { createUser, getUserByName } from "./lib/db/queries/users";
import { createUser, getUserByName, resetUsers } from "./lib/db/queries/users";

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
