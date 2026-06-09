"use client";

import React from "react";
import { useLegalDocument } from "@/hooks/useLegalDocument";
import { MarkdownContent } from "@/components/MarkdownContent";
import "./legal-document.css";

interface LegalDocumentProps {
  slug: string;
  className?: string;
  showHeader?: boolean;
}

export function LegalDocument({
  slug,
  className = "",
  showHeader = true,
}: LegalDocumentProps): React.ReactNode {
  const { document, loading, error } = useLegalDocument(slug);

  if (loading) {
    return (
      <div className={`legal-document-loader ${className}`}>
        <div className="legal-document-loader__skeleton legal-document-loader__skeleton--lg" />
        <div className="legal-document-loader__lines">
          <div className="legal-document-loader__skeleton legal-document-loader__skeleton--full" />
          <div className="legal-document-loader__skeleton legal-document-loader__skeleton--full" />
          <div className="legal-document-loader__skeleton legal-document-loader__skeleton--md" />
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className={`legal-document-error ${className}`}>
        <p className="legal-document-error__title">Error loading document</p>
        <p className="legal-document-error__text">
          {error?.message || "The legal document could not be loaded."}
        </p>
        <p className="legal-document-error__text">
          Please try refreshing the page or contact support.
        </p>
      </div>
    );
  }

  return (
    <div className={`legal-document ${className}`}>
      {showHeader && (
        <header className="legal-document__header">
          <h1 className="legal-document__title">{document.title}</h1>
          {(document.version || document.effectiveDate || document.lastUpdated) && (
            <div className="legal-document__meta">
              {document.version && (
                <p>
                  <strong>Version:</strong> {document.version}
                </p>
              )}
              {document.effectiveDate && (
                <p>
                  <strong>Effective Date:</strong> {formatDate(document.effectiveDate)}
                </p>
              )}
              {document.lastUpdated && (
                <p>
                  <strong>Last Updated:</strong> {formatDate(document.lastUpdated)}
                </p>
              )}
            </div>
          )}
        </header>
      )}

      <MarkdownContent content={document.content} />
    </div>
  );
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}
