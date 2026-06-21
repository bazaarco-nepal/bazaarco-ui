import { liteClient as algoliasearch } from "algoliasearch/lite";

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? "";
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY ?? "";
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME ?? "ProductIndex";

export const algoliaSearchClient = algoliasearch(appId, searchKey);

export const primaryIndexName = indexName;

export const replicaIndexNames = {
  ratingDesc: `${indexName}_rating_desc`,
  priceAsc: `${indexName}_price_asc`,
  priceDesc: `${indexName}_price_desc`,
  createdDesc: `${indexName}_created_desc`,
} as const;

export type AlgoliaSort = "" | "price:asc" | "price:desc" | "rating:desc" | "created:desc";

export function resolveSortIndex(sort: AlgoliaSort): string {
  switch (sort) {
    case "rating:desc":
      return replicaIndexNames.ratingDesc;
    case "price:asc":
      return replicaIndexNames.priceAsc;
    case "price:desc":
      return replicaIndexNames.priceDesc;
    case "created:desc":
      return replicaIndexNames.createdDesc;
    default:
      return primaryIndexName;
  }
}

export function isAlgoliaConfigured(): boolean {
  return Boolean(appId && searchKey && indexName);
}
