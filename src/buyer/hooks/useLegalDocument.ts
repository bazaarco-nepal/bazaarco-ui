/**
 * React hook to fetch and manage legal documents
 */

import { useEffect, useState } from "react";
import {
  getLegalDocument,
  type LegalDocument,
  type LegalDocumentSlug,
} from "@/services/legal-documents.service";

interface UseLegalDocumentState {
  document: LegalDocument | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch a single legal document
 * @param slug - The document slug (e.g., 'terms-and-conditions')
 * @returns Object with document, loading state, and error
 */
export function useLegalDocument(slug: LegalDocumentSlug | string): UseLegalDocumentState {
  const [state, setState] = useState<UseLegalDocumentState>({
    document: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const doc = await getLegalDocument(slug);

        if (!doc) {
          throw new Error(`Legal document not found: ${slug}`);
        }

        setState({
          document: doc,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          document: null,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    };

    fetchDocument();
  }, [slug]);

  return state;
}
