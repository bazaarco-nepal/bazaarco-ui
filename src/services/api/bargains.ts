import type { Product } from "@/types";
import { getData, postData } from "./http";

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

export interface CreateBargainOfferPayload {
  productId: string;
  yourOffer: number;
}

export const bargainsApi = {
  list(): Promise<BargainOffer[]> {
    return getData<BargainOffer[]>("/bargains");
  },
  create(payload: CreateBargainOfferPayload): Promise<BargainOffer> {
    return postData<BargainOffer>("/bargains", payload);
  },
};
