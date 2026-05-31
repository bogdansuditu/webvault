import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import mermaid from 'mermaid';

interface MarkdownPreviewProps {
  content: string;
  isDarkMode: boolean;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, isDarkMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    // Configure local renderer for marked
    const renderer = new marked.Renderer();
    
    // Intercept code blocks and customize mermaid output
    renderer.code = function (code: string, infostring: string | undefined) {
      const lang = (infostring || '').trim().toLowerCase();
      if (lang === 'mermaid') {
        // Return a clean unescaped div container for mermaid diagram code
        return `<div class="mermaid-container"><pre class="mermaid">${code}</pre></div>`;
      }
      return `<pre><code class="language-${lang}">${code}</code></pre>`;
    };

    // Parse the markdown asynchronously or synchronously
    try {
      const parsed = marked.parse(content, { renderer }) as string;
      setHtmlContent(parsed);
    } catch (err) {
      console.error('Failed to parse Markdown', err);
      setHtmlContent(`<p style="color: var(--text-error)">Failed to render markdown content.</p>`);
    }
  }, [content]);

  useEffect(() => {
    if (!htmlContent) return;

    const renderDiagrams = async () => {
      try {
        // Reset and re-initialize Mermaid options
        mermaid.initialize({
          startOnLoad: false,
          theme: isDarkMode ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          themeVariables: isDarkMode ? {
            background: 'rgba(28, 28, 30, 0.5)',
            primaryColor: '#0a84ff',
            nodeBorder: '#48484a',
            mainBkg: '#1c1c1e',
            lineColor: '#8e8e93'
          } : {
            background: 'rgba(255, 255, 255, 0.5)',
            primaryColor: '#007aff',
            nodeBorder: '#e5e5ea',
            mainBkg: '#ffffff',
            lineColor: '#8e8e93'
          }
        });

        // Run mermaid processing on all class="mermaid" tags
        await mermaid.run({
          querySelector: '.mermaid',
        });
      } catch (err) {
        console.error('Mermaid render error:', err);
      }
    };

    // Add a tiny delay to let React fully mount and insert html content in DOM
    const timer = setTimeout(() => {
      renderDiagrams();
    }, 50);

    return () => clearTimeout(timer);
  }, [htmlContent, isDarkMode]);

  return (
    <div 
      ref={containerRef}
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
