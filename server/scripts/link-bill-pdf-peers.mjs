import { access, mkdir, symlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const sharedNodeModules = path.join(repoRoot, "shared/bill-pdf/node_modules");
const serverNodeModules = path.join(repoRoot, "server/node_modules");
const peerPackages = ["react", "@react-pdf/renderer", "date-fns"];

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function linkPeerPackage(packageName) {
  const source = path.join(serverNodeModules, packageName);
  const destination = path.join(sharedNodeModules, packageName);

  if (!(await pathExists(source))) {
    throw new Error(`Missing server dependency: ${packageName}`);
  }

  if (await pathExists(destination)) {
    return;
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await symlink(source, destination, "junction");
}

await mkdir(sharedNodeModules, { recursive: true });

for (const packageName of peerPackages) {
  await linkPeerPackage(packageName);
}

console.log("Linked shared/bill-pdf peer dependencies to server/node_modules");
