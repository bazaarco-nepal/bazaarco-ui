import type { ReactNode } from "react";

export interface WriteReviewProps {
  productId?: string;
}

export interface OrderSuccessProps {
  total: number;
}

export interface SellerShellProps {
  screen: string;
  children: ReactNode;
}
