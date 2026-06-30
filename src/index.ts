import {
  type CommandsRegistry,
  registerCommand,
  runCommand,
  handlerLogin,
  handlerRegister,
  handlerReset,
  handlerUsers,
  handlerAgg,
  handlerAddFeed,
  handlerFeeds,
  handlerFollow,
  handlerFollowing,
  middlewareLoggedIn,
  handlerUnfollow,
  handlerBrowse,

} from "./commands";

async function main() {
  const registry: CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
  registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
  registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollow));
  registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));

  const rawArgs = process.argv.slice(2);

  if (rawArgs.length < 1) {
    console.error("Error: not enough arguments provided");
    process.exit(1);
  }

  const cmdName = rawArgs[0];
  const args = rawArgs.slice(1);

  try {
    await runCommand(registry, cmdName, ...args);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  process.exit(0);
}

main();