import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { withTempHome } from "./test-helpers.js";

describe("config backup restore", () => {
  it("restores the latest valid backup and preserves the invalid config", async () => {
    await withTempHome(async () => {
      const { createConfigIO, restoreLatestValidConfigBackup } = await import("./config.js");
      const io = createConfigIO();
      const configPath = io.configPath;
      const validConfig = { gateway: { mode: "local" } };
      const invalidConfig = { bogus: true };

      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(`${configPath}.bak`, JSON.stringify(validConfig, null, 2));
      await fs.writeFile(configPath, JSON.stringify(invalidConfig, null, 2));

      const result = await restoreLatestValidConfigBackup(
        { configPath },
        { preserveInvalid: true },
      );

      expect(result.restored).toBe(true);
      const restoredRaw = await fs.readFile(configPath, "utf-8");
      expect(JSON.parse(restoredRaw)).toMatchObject(validConfig);
      expect(result.invalidConfigPath).toBeTruthy();
      const invalidRaw = await fs.readFile(result.invalidConfigPath ?? "", "utf-8");
      expect(JSON.parse(invalidRaw)).toMatchObject(invalidConfig);
    });
  });
});
