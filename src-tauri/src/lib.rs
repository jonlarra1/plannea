use tauri_plugin_log::{Target, TargetKind, TimezoneStrategy};
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Verbosity dial (decided 2026-07-13): full play-by-play while developing,
    // only notable events + errors in a packaged release build.
    let log_level = if cfg!(debug_assertions) {
        log::LevelFilter::Debug
    } else {
        log::LevelFilter::Info
    };

    // Schema migrations. Each is applied once, in version order, on startup.
    // The SQL lives in src-tauri/migrations/ (see docs/STORAGE.md for the design).
    let migrations = vec![Migration {
        version: 1,
        description: "create_initial_schema",
        sql: include_str!("../migrations/0001_init.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            // One diary, two targets: the terminal (dev runs) and a log file
            // (~/.local/share/com.plannea.app/logs/ on Linux) that survives
            // crashes and closed windows.
            tauri_plugin_log::Builder::new()
                .level(log_level)
                // Timestamps in local wall-clock time (the default is UTC,
                // which would look 2h off in summer-time Spain).
                .timezone_strategy(TimezoneStrategy::UseLocal)
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                ])
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:plannea.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
