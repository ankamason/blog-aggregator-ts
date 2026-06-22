import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

const CONFIG_FILE_NAME = ".gatorconfig.json";

export function readConfig(): Config {
  const fullPath = getConfigFilePath();

  const data = fs.readFileSync(fullPath, "utf-8");
  const rawConfig = JSON.parse(data);

  return validateConfig(rawConfig);
}

export function setUser(userName: string): void {
  const config = readConfig();
  config.currentUserName = userName;
  writeConfig(config);
}

function getConfigFilePath(): string {
  const home = os.homedir();
  return path.join(home, CONFIG_FILE_NAME);
}

function writeConfig(cfg: Config): void {
  const fullPath = getConfigFilePath();

  const rawConfig = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };

  const data = JSON.stringify(rawConfig, null, 2);
  fs.writeFileSync(fullPath, data);
}

function validateConfig(rawConfig: any): Config {
  if (!rawConfig.db_url || typeof rawConfig.db_url !== "string") {
    throw new Error("db_url is required in config file");
  }

  const config: Config = {
    dbUrl: rawConfig.db_url,
  };

  if (
    rawConfig.current_user_name &&
    typeof rawConfig.current_user_name === "string"
  ) {
    config.currentUserName = rawConfig.current_user_name;
  }

  return config;
}
