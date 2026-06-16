"use client";

import React from "react";
import Link from "next/link";
import { pathFromScreen } from "@/config/routes";
import "./legal-page-layout.css";

interface LegalPageLayoutProps {
  slug: string;
  title: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="legal-page-container">
      {/* Header */}
      <header className="legal-page-header">
        <div className="legal-page-header__inner">
          <Link href={pathFromScreen("home")} className="legal-page-header__back bz-back-link">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to BazaarCo
          </Link>

          <div className="legal-page-header__title-wrap">
            <h1 className="legal-page-header__title">{title}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="legal-page-main">
        <article className="legal-page-article">
          <div className="legal-document">{children}</div>
        </article>

        {/* Footer Info */}
        <div className="legal-page-footer">
          <p style={{ marginBottom: 0 }}>
            If you have any questions, please contact us at{" "}
            <a href="mailto:support@bazaarco.com" className="legal-page-footer__link">
              support@bazaarco.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
