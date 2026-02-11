/**
 * BBCode ↔ HTML conversion for profile/forum content.
 * Supports: [b], [i], [u], [s], [url=...], [img], [color=...], [size=...], [center], [left], [right], [code], [quote]
 */

const BBCODE_TAGS = [
  ["\\[b\\]([\\s\\S]*?)\\[/b\\]", "<strong>$1</strong>"],
  ["\\[i\\]([\\s\\S]*?)\\[/i\\]", "<em>$1</em>"],
  ["\\[u\\]([\\s\\S]*?)\\[/u\\]", "<u>$1</u>"],
  ["\\[s\\]([\\s\\S]*?)\\[/s\\]", "<s>$1</s>"],
  ["\\[url=(.*?)\\]([\\s\\S]*?)\\[/url\\]", "<a href=\"$1\" target=\"_blank\" rel=\"noopener noreferrer\">$2</a>"],
  ["\\[url\\](.*?)\\[/url\\]", "<a href=\"$1\" target=\"_blank\" rel=\"noopener noreferrer\">$1</a>"],
  ["\\[img\\](.*?)\\[/img\\]", "<img src=\"$1\" alt=\"\" style=\"max-width:100%;height:auto\" />"],
  ["\\[img=(.*?)\\](.*?)\\[/img\\]", "<img src=\"$1\" alt=\"$2\" style=\"max-width:100%;height:auto\" />"],
  ["\\[color=(.*?)\\]([\\s\\S]*?)\\[/color\\]", "<span style=\"color:$1\">$2</span>"],
  ["\\[size=(.*?)\\]([\\s\\S]*?)\\[/size\\]", "<span style=\"font-size:$1\">$2</span>"],
  ["\\[center\\]([\\s\\S]*?)\\[/center\\]", "<div style=\"text-align:center\">$1</div>"],
  ["\\[left\\]([\\s\\S]*?)\\[/left\\]", "<div style=\"text-align:left\">$1</div>"],
  ["\\[right\\]([\\s\\S]*?)\\[/right\\]", "<div style=\"text-align:right\">$1</div>"],
  ["\\[code\\]([\\s\\S]*?)\\[/code\\]", "<pre style=\"background:rgba(0,0,0,0.1);padding:0.5rem;overflow:auto\">$1</pre>"],
  ["\\[quote\\]([\\s\\S]*?)\\[/quote\\]", "<blockquote style=\"margin:0.5rem 0;padding-left:1rem;border-left:3px solid #7b6857\">$1</blockquote>"],
];

const BBCODE_REGEXES = BBCODE_TAGS.map(([pattern]) => new RegExp(pattern, "gi"));

/** Convert BBCode string to HTML (for display/save). */
export function bbcodeToHtml(bb) {
  if (!bb || typeof bb !== "string") return "";
  let html = bb;
  for (let i = 0; i < BBCODE_TAGS.length; i++) {
    const [pattern, replacement] = BBCODE_TAGS[i];
    html = html.replace(new RegExp(pattern, "gi"), replacement);
  }
  return html;
}

/** Convert HTML to BBCode (for editing in BBCode mode). Simple reverse mapping. */
export function htmlToBbcode(html) {
  if (!html || typeof html !== "string") return "";
  let bb = html
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, "[b]$1[/b]")
    .replace(/<b>([\s\S]*?)<\/b>/gi, "[b]$1[/b]")
    .replace(/<em>([\s\S]*?)<\/em>/gi, "[i]$1[/i]")
    .replace(/<i>([\s\S]*?)<\/i>/gi, "[i]$1[/i]")
    .replace(/<u>([\s\S]*?)<\/u>/gi, "[u]$1[/u]")
    .replace(/<s>([\s\S]*?)<\/s>/gi, "[s]$1[/s]")
    .replace(/<a href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, "[url=$1]$2[/url]")
    .replace(/<img[^>]*src=["']([^"']*)["'][^>]*\/?>/gi, "[img]$1[/img]")
    .replace(/<span style=["']color:([^"']+)["']>([\s\S]*?)<\/span>/gi, "[color=$1]$2[/color]")
    .replace(/<div style=["']text-align:center["']>([\s\S]*?)<\/div>/gi, "[center]$1[/center]")
    .replace(/<div style=["']text-align:left["']>([\s\S]*?)<\/div>/gi, "[left]$1[/left]")
    .replace(/<div style=["']text-align:right["']>([\s\S]*?)<\/div>/gi, "[right]$1[/right]")
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "[code]$1[/code]")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "[quote]$1[/quote]");
  return bb;
}
