import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

// A markdown file with YAML frontmatter looks like:
//   ---
//   key: value
//   ---
//   body text...
// These two functions split that into { data, body } and join it back.
// We hand-roll this instead of using gray-matter, which crashes in the
// browser/webview with "Buffer is not defined".

const DELIMITER = "---";

export interface ParsedFile {
  data: Record<string, unknown>;
  body: string;
}

export function splitFrontmatter(raw: string): ParsedFile {
  if (!raw.startsWith(DELIMITER)) {
    return { data: {}, body: raw };
  }

  const closing = raw.indexOf(`\n${DELIMITER}`, DELIMITER.length);
  if (closing === -1) {
    return { data: {}, body: raw };
  }

  const yamlBlock = raw.slice(DELIMITER.length, closing).trim();
  const body = raw.slice(closing + DELIMITER.length + 1).replace(/^\n/, "");
  const data = (parseYaml(yamlBlock) as Record<string, unknown> | null) ?? {};

  return { data, body };
}

export function joinFrontmatter(data: Record<string, unknown>, body: string): string {
  const yamlBlock = stringifyYaml(data).trim();
  return `${DELIMITER}\n${yamlBlock}\n${DELIMITER}\n\n${body}`;
}
