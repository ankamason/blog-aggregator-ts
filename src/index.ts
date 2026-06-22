import {
  type CommandsRegistry,
  registerCommand,
  runCommand,
  handlerLogin,
} from "./commands";

function main() {
  const registry: CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);

  const rawArgs = process.argv.slice(2);

  if (rawArgs.length < 1) {
    console.error("Error: not enough arguments provided");
    process.exit(1);
  }

  const cmdName = rawArgs[0];
  const args = rawArgs.slice(1);

  try {
    runCommand(registry, cmdName, ...args);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

main();
