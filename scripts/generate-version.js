import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8")
);

const versionInfo = {
  version: packageJson.version,
  buildTime: new Date().toISOString()
};

fs.writeFileSync(
  path.join(__dirname, "../public/version.json"),
  JSON.stringify(versionInfo, null, 2)
);
