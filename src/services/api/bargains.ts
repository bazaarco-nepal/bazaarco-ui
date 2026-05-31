import type { Product } from "@/types";
import { getData } from "./http";

export interface BargainOffer {
  id: string;
  productId: string;
  yourOffer: number;
  listed: number;
  sellerCounter: number | null;
  status: string;
  age: string;
  expires: string | null;
  p: Product;
}

export const bargainsApi = {
  list(): Promise<BargainOffer[]> {
    return getData<BargainOffer[]>("/bargains");
  },
};
