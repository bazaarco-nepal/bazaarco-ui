/**
 * Dynamic legal document page with professional BazaarCo theme
 * Route: /legal/[slug] (e.g., /legal/terms-and-conditions)
 */

import React from 'react';
import { notFound } from 'next/navigation';
import { LegalDocument } from '@/components/LegalDocument';
import { LegalPageLayout } from '@/components/LegalPageLayout';
import { isValidDocumentSlug, getDocumentDisplayName, LEGAL_DOCUMENTS } from '@/services/legal-documents.service';

interface LegalPageProps {
  params: {
    slug: string;
  };
}

export default function LegalPage({ params }: LegalPageProps): React.ReactNode {
  const { slug } = params;

  // Validate slug
  if (!isValidDocumentSlug(slug)) {
    notFound();
  }

  const displayName = getDocumentDisplayName(slug);

  return (
    <LegalPageLayout slug={slug} title={displayName}>
      <LegalDocument slug={slug} showHeader={false} />
    </LegalPageLayout>
  );
}

/**
 * Generate static params for all legal documents
 * This enables static generation for /legal/[slug] routes
 */
export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((slug) => ({
    slug,
  }));
}

/**
 * Set metadata for the page
 */
export async function generateMetadata({ params }: LegalPageProps) {
  const { slug } = params;

  if (!isValidDocumentSlug(slug)) {
    return {
      title: 'Not Found',
    };
  }

  const displayName = getDocumentDisplayName(slug);

  return {
    title: `${displayName} | BazaarCo`,
    description: `BazaarCo ${displayName}. Read our legal terms, policies, and agreements.`,
    robots: {
      index: true,
      follow: true,
    },
  };
}
