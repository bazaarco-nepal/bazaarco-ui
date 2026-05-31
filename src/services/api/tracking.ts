import { getData } from "./http";

export interface TrackingNode {
  t: string;
  loc: string;
  time: string;
  state: "done" | "current" | "future";
  detail: string;
}

export interface TrackingData {
  orderId: string;
  nodes: TrackingNode[];
}

export const trackingApi = {
  getByOrderId(orderId: string): Promise<TrackingData> {
    return getData<TrackingData>(`/tracking/${orderId}`);
  },
};
