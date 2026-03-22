import { spawn } from "child_process";
import path from "path";

const args = process.argv.slice(2);
const isWeb = args[0] === "web";

if (isWeb) {
  console.log("Starting Web UI...");
  const dev = spawn("bun", ["dev"], {
    cwd: path.join(process.cwd(), "packages", "web"),
    stdio: "inherit",
    shell: true
  });
} else {
  console.log("Starting Rouge CLI/API...");
  const dev = spawn("bun", ["dev", ...args], {
    cwd: path.join(process.cwd(), "packages", "rouge"),
    stdio: "inherit",
    shell: true
  });
}
