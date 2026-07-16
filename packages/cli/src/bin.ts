#!/usr/bin/env node
import { runMain } from "./index.js";

runMain().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
