import { Component, createMemo } from "solid-js"
import { Marked } from "marked"
import hljs from "highlight.js/lib/core"

// Register only common languages to keep bundle small
import javascript from "highlight.js/lib/languages/javascript"
import typescript from "highlight.js/lib/languages/typescript"
import python from "highlight.js/lib/languages/python"
import bash from "highlight.js/lib/languages/bash"
import json from "highlight.js/lib/languages/json"
import yaml from "highlight.js/lib/languages/yaml"
import xml from "highlight.js/lib/languages/xml"
import css from "highlight.js/lib/languages/css"
import sql from "highlight.js/lib/languages/sql"
import go from "highlight.js/lib/languages/go"
import rust from "highlight.js/lib/languages/rust"
import java from "highlight.js/lib/languages/java"
import dockerfile from "highlight.js/lib/languages/dockerfile"
import markdown from "highlight.js/lib/languages/markdown"

hljs.registerLanguage("javascript", javascript)
hljs.registerLanguage("js", javascript)
hljs.registerLanguage("typescript", typescript)
hljs.registerLanguage("ts", typescript)
hljs.registerLanguage("python", python)
hljs.registerLanguage("py", python)
hljs.registerLanguage("bash", bash)
hljs.registerLanguage("sh", bash)
hljs.registerLanguage("shell", bash)
hljs.registerLanguage("json", json)
hljs.registerLanguage("yaml", yaml)
hljs.registerLanguage("yml", yaml)
hljs.registerLanguage("xml", xml)
hljs.registerLanguage("html", xml)
hljs.registerLanguage("css", css)
hljs.registerLanguage("sql", sql)
hljs.registerLanguage("go", go)
hljs.registerLanguage("rust", rust)
hljs.registerLanguage("java", java)
hljs.registerLanguage("dockerfile", dockerfile)
hljs.registerLanguage("markdown", markdown)
hljs.registerLanguage("md", markdown)

const marked = new Marked({
  renderer: {
    code({ text, lang }) {
      const language = lang && hljs.getLanguage(lang) ? lang : undefined
      let highlighted: string
      try {
        highlighted = language
          ? hljs.highlight(text, { language }).value
          : hljs.highlightAuto(text).value
      } catch {
        highlighted = text.replace(/</g, "&lt;").replace(/>/g, "&gt;")
      }

      return `<div class="code-block">
        <div class="code-header">
          <span class="code-lang">${lang || "text"}</span>
          <button class="code-copy" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('code').textContent)">Copy</button>
        </div>
        <pre><code class="hljs${language ? ` language-${language}` : ""}">${highlighted}</code></pre>
      </div>`
    },
  },
  breaks: true,
  gfm: true,
})

interface MarkdownProps {
  content: string
}

export const Markdown: Component<MarkdownProps> = (props) => {
  const html = createMemo(() => {
    try {
      return marked.parse(props.content) as string
    } catch {
      return props.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")
    }
  })

  return <div class="markdown-body" innerHTML={html()} />
}
