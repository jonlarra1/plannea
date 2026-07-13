// Frontend half of the app diary (roadmap 2.4, decided 2026-07-07/13).
// The Rust side (tauri-plugin-log in lib.rs) is the only writer: terminal +
// log file. This module is the messenger — UI code calls these instead of
// console.*, so messages survive a closed window. Core stays pure: it never
// imports this.
import { debug, error, info, warn } from "@tauri-apps/plugin-log";

export { debug as logDebug, error as logError, info as logInfo, warn as logWarn };

// Forwards uncaught frontend crashes into the diary: errors nobody caught
// and promises that failed with nobody listening. Without this they only
// flash in the devtools console — invisible in a normal run.
export function initLogging(): void {
  window.addEventListener("error", (event) => {
    void error(`Uncaught error: ${event.message} (${event.filename}:${event.lineno})`);
  });

  window.addEventListener("unhandledrejection", (event) => {
    void error(`Unhandled promise rejection: ${String(event.reason)}`);
  });

  void info("frontend started");
}
