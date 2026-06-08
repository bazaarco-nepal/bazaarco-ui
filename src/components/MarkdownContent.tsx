import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './legal-document.css';

interface MarkdownContentProps {
  content: string;
}

/**
 * Shared markdown renderer for all legal document pages.
 * Single source of truth so every /legal/[slug] page renders
 * pixel-identically. The first H1 is hidden because it's shown in the page header.
 */
export function MarkdownContent({ content }: MarkdownContentProps): React.ReactNode {
  return (
    <div className="legal-document__content">
      <div className="legal-document__blocks">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: () => null,
            h2: ({ children }) => <h2 className="legal-document__h2">{children}</h2>,
            h3: ({ children }) => <h3 className="legal-document__h3">{children}</h3>,
            p: ({ children }) => <p className="legal-document__paragraph">{children}</p>,
            ul: ({ children }) => <ul className="legal-document__list">{children}</ul>,
            li: ({ children }) => <li className="legal-document__list-item">{children}</li>,
            blockquote: ({ children }) => <blockquote className="legal-document__blockquote">{children}</blockquote>,
            code: ({ children }) => <code className="legal-document__inline-code">{children}</code>,
            pre: ({ children }) => <pre className="legal-document__code-block">{children}</pre>,
            table: ({ children }) => <table className="legal-document__table">{children}</table>,
            thead: ({ children }) => <thead>{children}</thead>,
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => <tr>{children}</tr>,
            th: ({ children }) => <th className="legal-document__table-header">{children}</th>,
            td: ({ children }) => <td className="legal-document__table-cell">{children}</td>,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="legal-document__link">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
