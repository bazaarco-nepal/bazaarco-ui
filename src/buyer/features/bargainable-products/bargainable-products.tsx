"use client";

import React from "react";

import { Icon, Button, SkeletonCard, EmptyState, ApiState, AppLink } from "@/components/ui";
import { BargainProductCard, useBz } from "@/components/common";
import { useBargainableProductsInfinite } from "@/shared/hooks/use-catalog";
import { pathFromScreen, searchPath } from "@/config/routes";

/** Full listing of every product whose seller is open to bargaining. Reached from
 *  the home "Bargain with the seller" rail's "All bargainable products" CTA.
 *  Backed by GET /catalog/products?bargainable=true (paged). */
export function BargainableProducts() {
  const { openProduct } = useBz();
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBargainableProductsInfinite();

  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

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
          <AppLink href={pathFromScreen("home")} className="bz-bargainable-page__back">
            <Icon name="chevronLeft" size={16} /> Home
          </AppLink>
          <h1 className="bz-bargainable-page__title">
            <span className="bz-bargain-panel__icon">
              <Icon name="bargain" size={19} color="#8a6a12" />
            </span>
            Bargainable products
          </h1>
          <p className="bz-bargainable-page__copy">
            Every listing where the seller is open to a better price. Make an offer and agree on a
            fair deal in the app.
          </p>
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
            {hasNextPage && (
              <div className="bz-bargainable-page__more">
                <Button
                  variant="secondary"
                  onClick={() => void fetchNextPage()}
                  loading={isFetchingNextPage}
                >
                  Load more ({products.length} of {total})
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ApiState>
  );
}
