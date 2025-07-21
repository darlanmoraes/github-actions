import core from "@actions/core";
import github from "@actions/github";
import { execSync } from "child_process";

try {
  const eventName = github.context.eventName;
  const payload = github.context.payload;
  let commitHash, versionTag;

  if (eventName === "push") {
    commitHash = payload.after;
  } else if (eventName === "release") {
    const tag = payload.release?.tag_name;

    if (!/^v\d+\.\d+\.\d+$/.test(tag)) {
      console.log(`Tag "${tag}" does not match semver pattern v*.*.*. Skipping job.`);
      process.exit(78);
    }
    versionTag = tag;
    commitHash = execSync(`git rev-list -n 1 ${tag}`).toString().trim();
  } else if (eventName === "workflow_dispatch") {
    commitHash = execSync(`git rev-parse HEAD`).toString().trim();
  } else {
    core.setFailed(`Unsupported event: ${eventName}`);
    process.exit(1);
  }

  versionTag = versionTag || commitHash;
  core.setOutput("commit_hash", commitHash);
  core.setOutput("version_tag", versionTag);
  console.log(`Resolved commit hash: ${commitHash}`);
  console.log(`Resolved version tag: ${versionTag}`);
} catch (error) {
  core.setFailed(error.message);
}
