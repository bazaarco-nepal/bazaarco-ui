"use client";

import React from "react";

import { LoadMore, PageBar, SkeletonCard, EmptyState, ApiState } from "@/components/ui";
import { BargainProductCard, useBz } from "@/components/common";
import { useBargainableProductsPage } from "@/shared/hooks/use-catalog";
import { searchPath } from "@/config/routes";

const BARGAINABLE_PRODUCTS_PAGE_SIZE = 24;

/** Full listing of every product whose seller is open to bargaining. Reached from
 *  the home "Bargain with the seller" rail's "All bargainable products" CTA.
 *  Backed by GET /catalog/products?bargainable=true (paged). */
export function BargainableProducts() {
  const { openProduct } = useBz();
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, error, isFetching } = useBargainableProductsPage(
    page,
    BARGAINABLE_PRODUCTS_PAGE_SIZE,
  );

  const products = React.useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, data?.totalPages ?? 1);
  const from = total === 0 ? 0 : (page - 1) * BARGAINABLE_PRODUCTS_PAGE_SIZE + 1;
  const to = Math.min(page * BARGAINABLE_PRODUCTS_PAGE_SIZE, total);

  const goPage = React.useCallback(
    (nextPage: number) => {
      setPage(Math.min(Math.max(1, nextPage), pageCount));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [pageCount],
  );
  const paged = React.useMemo(
    () => ({
      visible: products,
      shown: to,
      total,
      pageSize: BARGAINABLE_PRODUCTS_PAGE_SIZE,
      hasMore: page < pageCount,
      nextBatch: Math.min(BARGAINABLE_PRODUCTS_PAGE_SIZE, Math.max(0, total - to)),
      page,
      pageCount,
      more: () => goPage(page + 1),
      goPage,
      reset: () => goPage(1),
    }),
    [goPage, page, pageCount, products, to, total],
  );

  return (
    <ApiState
      isLoading={isLoading}
      isError={isError}
      error={error}
      fallback={
        <div className="bz-container-pad bz-bargainable-page">
          <div className="bz-bargain-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      }
    >
      <div className="bz-container-pad bz-bargainable-page">
        <div className="bz-bargainable-page__head">
          <div>
            <h1 className="bz-bargainable-page__title">Bargainable products</h1>
            <p className="bz-bargainable-page__copy">
              Every listing where the seller is open to a better price. Make an offer and agree on a
              fair deal in the app.
            </p>
          </div>
          {products.length > 0 ? (
            <div className="bz-bargainable-page__meta" aria-live="polite">
              Showing {from}-{to} of {total} products
              {isFetching && !isLoading ? <span>Updating…</span> : null}
            </div>
          ) : null}
        </div>

        {products.length === 0 ? (
          <EmptyState
            title="No bargainable products yet"
            message="When sellers open their listings to offers, they show up here."
            cta="Browse all products"
            ctaHref={searchPath()}
          />
        ) : (
          <>
            <div className="bz-bargain-grid">
              {products.map((product) => (
                <BargainProductCard
                  key={product.id}
                  p={product}
                  onOpen={openProduct}
                  onOffer={(prod) => openProduct(prod, { offer: true })}
                />
              ))}
            </div>
            <LoadMore
              paged={paged}
              noun="products"
              pageBar={<PageBar page={page} pageCount={pageCount} onPage={goPage} />}
            />
          </>
        )}
      </div>
    </ApiState>
  );
}
