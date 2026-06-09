/**
 * Service to fetch legal documents from the public/legal folder
 * Each document is a Markdown file that can be updated without code changes
 */

export interface LegalDocument {
  slug: string;
  title: string;
  content: string;
  // Optional metadata; not currently emitted by getLegalDocument (markdown-only source).
  version?: string;
  effectiveDate?: string;
  lastUpdated?: string;
}

export const LEGAL_DOCUMENTS = [
  "age-verification",
  "terms-and-conditions",
  "privacy-policy",
  "seller-agreement",
  "commission-information",
  "return-and-refund-policy",
  "cancellation-policy",
  "shipping-and-delivery-policy",
  "prohibited-products-policy",
  "cookie-tracking-notice",
  "reviews-and-guidelines",
  "grievance-redressal-policy",
  "legal-information",
  "buyer-protection-policy",
  "warranty-and-authenticity-policy",
  "seller-policy",
  "seller-code-of-conduct",
  "seller-payout-and-settlement-policy",
  "product-listing-rules",
  "seller-delivery-and-pickup-policy",
  "community-guidelines",
  "intellectual-property-policy",
  "payment-policy",
] as const;

export type LegalDocumentSlug = (typeof LEGAL_DOCUMENTS)[number];

/**
 * Fetch a single legal document by slug
 * @param slug - The document slug (e.g., 'terms-and-conditions')
 * @returns The legal document or null if not found
 */
export async function getLegalDocument(slug: string): Promise<LegalDocument | null> {
  try {
    const response = await fetch(`/legal/${slug}.md`);
    if (!response.ok) {
      console.error(`Failed to fetch legal document: ${slug}`, response.status);
      return null;
    }
    const content = await response.text();
    return {
      slug,
      title: extractTitle(content),
      content,
    };
  } catch (error) {
    console.error(`Error fetching legal document ${slug}:`, error);
    return null;
  }
}

/**
 * Extract the title from markdown content (first H1 heading)
 */
function extractTitle(markdown: string): string {
  const match = markdown.match(/^# (.+)$/m);
  return match?.[1] ?? "Document";
}

/**
 * Fetch all legal documents
 * @returns Array of legal documents
 */
export async function getAllLegalDocuments(): Promise<LegalDocument[]> {
  const documents: LegalDocument[] = [];

  for (const slug of LEGAL_DOCUMENTS) {
    const doc = await getLegalDocument(slug);
    if (doc) {
      documents.push(doc);
    }
  }

  return documents;
}

/**
 * Markdown is already formatted, return as-is
 */
export function formatLegalContent(content: string): string {
  return content;
}

/**
 * Get display name for a document slug
 * @param slug - The document slug
 * @returns Human-readable name
 */
export function getDocumentDisplayName(slug: string): string {
  const names: Record<string, string> = {
    "age-verification": "Age Verification & Legal Capacity",
    "terms-and-conditions": "Terms & Conditions",
    "privacy-policy": "Privacy Policy",
    "seller-agreement": "Seller Agreement",
    "commission-information": "Commission Information",
    "return-and-refund-policy": "Return & Refund Policy",
    "cancellation-policy": "Cancellation Policy",
    "shipping-and-delivery-policy": "Shipping & Delivery Policy",
    "prohibited-products-policy": "Prohibited Products Policy",
    "cookie-tracking-notice": "Cookie & Tracking Notice",
    "reviews-and-guidelines": "Reviews & Community Guidelines",
    "grievance-redressal-policy": "Grievance Redressal Policy",
    "legal-information": "Legal Information",
    "buyer-protection-policy": "Buyer Protection Policy",
    "warranty-and-authenticity-policy": "Warranty & Authenticity Policy",
    "seller-policy": "Seller Policy",
    "seller-code-of-conduct": "Seller Code of Conduct",
    "seller-payout-and-settlement-policy": "Seller Payout & Settlement Policy",
    "product-listing-rules": "Product Listing Rules",
    "seller-delivery-and-pickup-policy": "Seller Delivery & Pickup Policy",
    "community-guidelines": "Community Guidelines",
    "intellectual-property-policy": "Intellectual Property Policy",
    "payment-policy": "Payment Policy",
  };
  return names[slug] || slug;
}

/**
 * Check if a document slug is valid
 * @param slug - The document slug to check
 * @returns true if valid, false otherwise
 */
export function isValidDocumentSlug(slug: string): slug is LegalDocumentSlug {
  return LEGAL_DOCUMENTS.includes(slug as LegalDocumentSlug);
}
