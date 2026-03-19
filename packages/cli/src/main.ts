#!/usr/bin/env node
import { runCli } from "./cli";
import { defaultCliIO } from "./io";

runCli(process.argv.slice(2), defaultCliIO)
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    defaultCliIO.stderr(`CLI execution failed: ${(error as Error).message}`);
    process.exitCode = 1;
  });
