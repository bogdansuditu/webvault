import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function nodeToMarkdown(node: Node, listDepth = 0): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
  if (!(node instanceof HTMLElement)) return '';

  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes).map(child => nodeToMarkdown(child, listDepth)).join('');

  switch (tag) {
    case 'strong': case 'b': return `**${children}**`;
    case 'em': case 'i': return `*${children}*`;
    case 'del': case 's': return `~~${children}~~`;
    case 'code': return node.parentElement?.tagName.toLowerCase() === 'pre' ? children : `\`${children}\``;
    case 'a': return `[${children}](${node.getAttribute('href') || ''}${node.title ? ` "${node.title}"` : ''})`;
    case 'img': return `![${node.getAttribute('alt') || ''}](${node.getAttribute('src') || ''})`;
    case 'h1': return `# ${children.trim()}\n\n`;
    case 'h2': return `## ${children.trim()}\n\n`;
    case 'h3': return `### ${children.trim()}\n\n`;
    case 'h4': return `#### ${children.trim()}\n\n`;
    case 'h5': return `##### ${children.trim()}\n\n`;
    case 'h6': return `###### ${children.trim()}\n\n`;
    case 'blockquote': return `${children.trim().split('\n').map(line => `> ${line}`).join('\n')}\n\n`;
    case 'li': {
      const parent = node.parentElement;
      const ordered = parent?.tagName.toLowerCase() === 'ol';
      const index = ordered && parent ? Array.from(parent.children).indexOf(node) + Number(parent.getAttribute('start') || 1) : 0;
      return `${'  '.repeat(listDepth)}${ordered ? `${index}. ` : '- '}${children.trim()}\n`;
    }
    case 'ul': case 'ol': return `${Array.from(node.childNodes).map(child => nodeToMarkdown(child, listDepth + 1)).join('')}\n`;
    case 'pre': {
      const code = node.querySelector('code');
      const language = code?.className.match(/language-([^\s]+)/)?.[1] || '';
      return `\`\`\`${language}\n${(code?.textContent || node.textContent || '').replace(/\n$/, '')}\n\`\`\`\n\n`;
    }
    case 'hr': return '---\n\n';
    case 'br': return '\n';
    case 'p': case 'div': return `${children}\n\n`;
    case 'table': return tableToMarkdown(node);
    default: return children;
  }
}

function tableToMarkdown(table: HTMLElement): string {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (!rows.length) return '';
  const values = rows.map(row => Array.from(row.querySelectorAll(':scope > th, :scope > td')).map(cell =>
    Array.from(cell.childNodes)
      .map(child => nodeToMarkdown(child))
      .join('')
      .trim()
      .replace(/\|/g, '\\|')
  ));
  const width = Math.max(...values.map(row => row.length));
  const line = (cells: string[]) => `| ${Array.from({ length: width }, (_, index) => cells[index] || '').join(' | ')} |`;
  const headerCells = Array.from(rows[0].querySelectorAll(':scope > th, :scope > td'));
  const separators = Array.from({ length: width }, (_, index) => {
    const cell = headerCells[index] as HTMLElement | undefined;
    const alignment = (cell?.getAttribute('align') || cell?.style.textAlign || '').toLowerCase();
    if (alignment === 'center') return ':---:';
    if (alignment === 'right') return '---:';
    if (alignment === 'left') return ':---';
    return '---';
  });
  return `${line(values[0])}\n${line(separators)}\n${values.slice(1).map(line).join('\n')}\n\n`;
}

function editorToMarkdown(editor: HTMLElement): string {
  return Array.from(editor.childNodes)
    .map(node => nodeToMarkdown(node))
    .join('')
    .replace(/\u200B/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n+$/g, '');
}

function sanitizeMarkdownHtml(html: string): string {
  const documentNode = new DOMParser().parseFromString(html, 'text/html');
  documentNode.querySelectorAll('script, style, iframe, object, embed').forEach(node => node.remove());
  documentNode.body.querySelectorAll('*').forEach(element => {
    Array.from(element.attributes).forEach(attribute => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
        element.removeAttribute(attribute.name);
      }
    });
  });
  return documentNode.body.innerHTML;
}

function moveCaretToEnd(element: Node) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function applyInlineMarkdown(editor: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  const textNode = range.startContainer;
  if (textNode.nodeType !== Node.TEXT_NODE || !editor.contains(textNode)) return false;

  const text = textNode.textContent || '';
  const caret = range.startOffset;
  const before = text.slice(0, caret);
  const patterns: Array<{ regex: RegExp; create: (match: RegExpMatchArray) => HTMLElement }> = [
    { regex: /!\[([^\]]*)\]\(([^)]+)\)$/, create: match => {
      const image = document.createElement('img'); image.alt = match[1]; image.src = match[2]; return image;
    }},
    { regex: /\[([^\]]+)\]\(([^)]+)\)$/, create: match => {
      const link = document.createElement('a'); link.textContent = match[1]; link.href = match[2]; return link;
    }},
    { regex: /\*\*([^*\n]+)\*\*$/, create: match => {
      const strong = document.createElement('strong'); strong.textContent = match[1]; return strong;
    }},
    { regex: /~~([^~\n]+)~~$/, create: match => {
      const del = document.createElement('del'); del.textContent = match[1]; return del;
    }},
    { regex: /`([^`\n]+)`$/, create: match => {
      const code = document.createElement('code'); code.textContent = match[1]; return code;
    }},
    { regex: /(?<!\*)\*([^*\n]+)\*$/, create: match => {
      const em = document.createElement('em'); em.textContent = match[1]; return em;
    }},
    { regex: /(?<!_)_([^_\n]+)_$/, create: match => {
      const em = document.createElement('em'); em.textContent = match[1]; return em;
    }}
  ];

  for (const pattern of patterns) {
    const match = before.match(pattern.regex);
    if (!match || match.index === undefined || !textNode.parentNode) continue;
    const prefix = text.slice(0, match.index);
    const suffix = text.slice(caret);
    const fragment = document.createDocumentFragment();
    if (prefix) fragment.append(document.createTextNode(prefix));
    fragment.append(pattern.create(match));
    const trailing = document.createTextNode(suffix || '\u200B');
    fragment.append(trailing);
    textNode.parentNode.replaceChild(fragment, textNode);
    const nextRange = document.createRange();
    nextRange.setStart(trailing, suffix ? 0 : 1);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    return true;
  }
  return false;
}

function transformBlockOnEnter(editor: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return false;
  const range = selection.getRangeAt(0);
  const startElement = range.startContainer instanceof HTMLElement ? range.startContainer : range.startContainer.parentElement;
  const block = startElement?.closest('p, div, blockquote, li') as HTMLElement | null;
  const target = block && editor.contains(block) ? block : editor;
  const source = (target === editor ? target.textContent : target.innerText) || '';
  const trimmed = source.trim();
  const isHeading = /^#{1,6}\s+\S/.test(trimmed);
  const isQuote = /^>\s+\S/.test(trimmed);
  const isList = /^(?:[-+*]|\d+[.)])\s+\S/.test(trimmed);
  const isRule = /^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed);
  const markdown = editorToMarkdown(editor);
  const isClosedFence = /```[\w-]*\n[\s\S]*\n```\s*$/.test(markdown);
  if (!isHeading && !isQuote && !isList && !isRule && !isClosedFence) return false;

  if (isClosedFence) {
    editor.innerHTML = sanitizeMarkdownHtml(marked.parse(markdown, { async: false, gfm: true }) as string);
  } else {
    const holder = document.createElement('div');
    holder.innerHTML = sanitizeMarkdownHtml(marked.parse(trimmed, { async: false, gfm: true }) as string);
    if (target === editor) {
      editor.replaceChildren(...Array.from(holder.childNodes));
    } else {
      target.replaceWith(...Array.from(holder.childNodes));
    }
  }

  const paragraph = document.createElement('p');
  paragraph.append(document.createElement('br'));
  editor.append(paragraph);
  moveCaretToEnd(paragraph);
  return true;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialValueRef = useRef(value);
  const composingRef = useRef(false);

  useEffect(() => {
    if (editorRef.current) {
      if (initialValueRef.current) {
        editorRef.current.innerHTML = sanitizeMarkdownHtml(marked.parse(initialValueRef.current, { async: false, gfm: true }) as string);
      }
      editorRef.current.focus();
    }
  }, []);

  const updateDocument = () => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!composingRef.current) applyInlineMarkdown(editor);
    const markdown = editorToMarkdown(editor);
    onChange(markdown);
  };

  return (
    <div
      ref={editorRef}
      className="markdown-editor markdown-body"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label="Markdown note content"
      aria-multiline="true"
      data-placeholder="Start writing your note…"
      spellCheck
      onInput={updateDocument}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.shiftKey && editorRef.current && transformBlockOnEnter(editorRef.current)) {
          event.preventDefault();
          onChange(editorToMarkdown(editorRef.current));
        }
      }}
      onCompositionStart={() => { composingRef.current = true; }}
      onCompositionEnd={() => {
        composingRef.current = false;
        updateDocument();
      }}
      onPaste={(event) => {
        event.preventDefault();
        const markdown = event.clipboardData.getData('text/plain');
        const html = sanitizeMarkdownHtml(marked.parse(markdown, { async: false, gfm: true, breaks: false }) as string);
        document.execCommand('insertHTML', false, html);
        queueMicrotask(updateDocument);
      }}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('a')) event.preventDefault();
      }}
      onBlur={() => {
        if (editorRef.current) onChange(editorToMarkdown(editorRef.current));
      }}
    />
  );
};
