// BBCode parser extracted for use in both editor and profile view
export default function parseBBCode(str) {
  if (!str) return "";
  let plainBlocks = [];
  let html = str.replace(
    /\[plain\]([\s\S]*?)\[\/plain\]/gi,
    function (_, code) {
      const key = `__PLAIN_BLOCK_${plainBlocks.length}__`;
      plainBlocks.push(
        '<span class="bbcode-plain">' +
          code
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>") +
          "</span>"
      );
      return key;
    }
  );
  html = html
    // ALIGN tags first (most specific)
    .replace(
      /\[ALIGN=CENTER\](.*?)\[\/ALIGN\]/gis,
      '<div style="text-align:center">$1</div>'
    )
    .replace(
      /\[ALIGN=LEFT\](.*?)\[\/ALIGN\]/gis,
      '<div style="text-align:left">$1</div>'
    )
    .replace(
      /\[ALIGN=RIGHT\](.*?)\[\/ALIGN\]/gis,
      '<div style="text-align:right">$1</div>'
    )
    .replace(
      /\[align=CENTER\](.*?)\[\/align\]/gis,
      '<div style="text-align:center">$1</div>'
    )
    .replace(
      /\[align=LEFT\](.*?)\[\/align\]/gis,
      '<div style="text-align:left">$1</div>'
    )
    .replace(
      /\[align=RIGHT\](.*?)\[\/align\]/gis,
      '<div style="text-align:right">$1</div>'
    )
    // Table support
    .replace(
      /\[table\]([\s\S]*?)\[\/table\]/gi,
      '<table class="bbcode-table">$1</table>'
    )
    .replace(/\[tr\]([\s\S]*?)\[\/tr\]/gi, "<tr>$1</tr>")
    .replace(/\[th\]([\s\S]*?)\[\/th\]/gi, "<th>$1</th>")
    .replace(/\[td\]([\s\S]*?)\[\/td\]/gi, "<td>$1</td>")
    .replace(/\[b\](.*?)\[\/b\]/gis, "<strong>$1</strong>")
    .replace(/\[i\](.*?)\[\/i\]/gis, "<em>$1</em>")
    .replace(/\[u\](.*?)\[\/u\]/gis, "<u>$1</u>")
    .replace(/\[s\](.*?)\[\/s\]/gis, "<s>$1</s>")
    .replace(/\[strike\](.*?)\[\/strike\]/gis, "<s>$1</s>")
    .replace(/\[del\](.*?)\[\/del\]/gis, "<s>$1</s>")
    .replace(/\[em\](.*?)\[\/em\]/gis, "<em>$1</em>")
    .replace(/\[strong\](.*?)\[\/strong\]/gis, "<strong>$1</strong>")
    .replace(/\[bold\](.*?)\[\/bold\]/gis, "<strong>$1</strong>")
    .replace(/\[italic\](.*?)\[\/italic\]/gis, "<em>$1</em>")
    .replace(/\[underline\](.*?)\[\/underline\]/gis, "<u>$1</u>")
    .replace(
      /\[color=(.*?)\](.*?)\[\/color\]/gis,
      '<span style="color:$1">$2</span>'
    )
    .replace(
      /\[size=(\d+)\](.*?)\[\/size\]/gis,
      '<span style="font-size:$1px">$2</span>'
    )
    .replace(
      /\[font=([\w\s\-]+)\](.*?)\[\/font\]/gis,
      '<span style="font-family:$1">$2</span>'
    )
    .replace(
      /\[center\](.*?)\[\/center\]/gis,
      '<div style="text-align:center">$1</div>'
    )
    .replace(
      /\[left\](.*?)\[\/left\]/gis,
      '<div style="text-align:left">$1</div>'
    )
    .replace(
      /\[right\](.*?)\[\/right\]/gis,
      '<div style="text-align:right">$1</div>'
    )
    .replace(
      /\[align=center\](.*?)\[\/align\]/gis,
      '<div class="bbcode-center" style="text-align:center !important">$1</div>'
    )
    .replace(
      /\[align=left\](.*?)\[\/align\]/gis,
      '<div class="bbcode-left" style="text-align:left !important">$1</div>'
    )
    .replace(
      /\[align=right\](.*?)\[\/align\]/gis,
      '<div class="bbcode-right" style="text-align:right !important">$1</div>'
    )
    .replace(
      /\[url=(.*?)\](.*?)\[\/url\]/gis,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>'
    )
    // [img=WIDTHxHEIGHT]url[/img] (must come first)
    .replace(/\[img=(\d+)(?:x(\d+))?\](.*?)\[\/img\]/gis, (m, w, h, url) => {
      let style = `max-width:100%;`;
      if (w) style += `width:${w}px;`;
      if (h) style += `height:${h}px;`;
      return `<img src="${url}" alt="BBCode image" style="${style}">`;
    })
    // [img width=... height=...]url[/img] (must come second)
    .replace(
      /\[img(?=\s)(?:\s+width=(\d+))?(?:\s+height=(\d+))?\](.*?)\[\/img\]/gis,
      (m, w, h, url) => {
        let style = `max-width:100%;`;
        if (w) style += `width:${w}px;`;
        if (h) style += `height:${h}px;`;
        return `<img src="${url}" alt="BBCode image" style="${style}">`;
      }
    )
    // Standard [img]url[/img] (must come last and only match if no = or width/height)
    .replace(
      /\[img\](?![=\s])(.*?)\[\/img\]/gis,
      '<img src="$1" alt="BBCode image" style="max-width:100%">'
    )
    .replace(/\[video\](.*?)\[\/video\]/gis, function (_, url) {
      url = url.trim();
      const yt = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
      );
      if (yt) {
        return `<iframe width="420" height="236" src="https://www.youtube.com/embed/${yt[1]}" frameborder="0" allowfullscreen style="max-width:100%"></iframe>`;
      }
      if (url.match(/\.mp4($|\?)/i)) {
        return `<video controls style="max-width:100%"><source src="${url}" type="video/mp4"></video>`;
      }
      return `<a href="${url}" target="_blank">${url}</a>`;
    })
    .replace(/\[quote\](.*?)\[\/quote\]/gis, "<blockquote>$1</blockquote>")
    .replace(/\[list\](.*?)\[\/list\]/gis, "<ul>$1</ul>")
    .replace(/\[list=1\](.*?)\[\/list\]/gis, "<ol>$1</ol>")
    .replace(/\[list=a\](.*?)\[\/list\]/gis, "<ol type='a'>$1</ol>")
    .replace(/\[list=A\](.*?)\[\/list\]/gis, "<ol type='A'>$1</ol>")
    .replace(/\[list=i\](.*?)\[\/list\]/gis, "<ol type='i'>$1</ol>")
    .replace(/\[list=I\](.*?)\[\/list\]/gis, "<ol type='I'>$1</ol>")
    .replace(/\[\*\](.*?)(?=\[\*\]|\[\/list\]|$)/gis, "<li>$1</li>")
    .replace(/\[code\](.*?)\[\/code\]/gis, "<pre><code>$1</code></pre>")
    .replace(/\[pre\](.*?)\[\/pre\]/gis, "<pre>$1</pre>")
    .replace(/\[hr\]/gis, "<hr>")
    .replace(/\[br\]/gis, "<br>")
    .replace(/\[newline\]/gis, "<br>")
    .replace(/\[nl\]/gis, "<br>")
    .replace(/\[sub\](.*?)\[\/sub\]/gis, "<sub>$1</sub>")
    .replace(/\[sup\](.*?)\[\/sup\]/gis, "<sup>$1</sup>")
    .replace(/\[small\](.*?)\[\/small\]/gis, "<small>$1</small>")
    .replace(/\[big\](.*?)\[\/big\]/gis, "<big>$1</big>")
    .replace(/\[h1\](.*?)\[\/h1\]/gis, "<h1>$1</h1>")
    .replace(/\[h2\](.*?)\[\/h2\]/gis, "<h2>$1</h2>")
    .replace(/\[h3\](.*?)\[\/h3\]/gis, "<h3>$1</h3>")
    .replace(/\[h4\](.*?)\[\/h4\]/gis, "<h4>$1</h4>")
    .replace(/\[h5\](.*?)\[\/h5\]/gis, "<h5>$1</h5>")
    .replace(/\[h6\](.*?)\[\/h6\]/gis, "<h6>$1</h6>");
  // Restore [plain] blocks
  plainBlocks.forEach((block, i) => {
    html = html.replace(`__PLAIN_BLOCK_${i}__`, block);
  });
  
  // Convert line breaks to <br> tags
  html = html.replace(/\n/g, "<br>");
  
  return html;
}
