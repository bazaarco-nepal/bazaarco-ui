import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the shared HTTP layer so no network happens; assert the Watch feed
// mapper and the view-recording call hit the right endpoints with the right
// shapes (videoId, not the product id).
vi.mock("@/shared/api/http", () => ({
  getData: vi.fn(),
  postData: vi.fn(),
}));

import { getData, postData } from "@/shared/api/http";
import { videosApi } from "@/buyer/api/videos";

const mockedGet = getData as unknown as ReturnType<typeof vi.fn>;
const mockedPost = postData as unknown as ReturnType<typeof vi.fn>;

describe("Watch feed API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards productId and videoId from the feed response (id stays product id)", async () => {
    mockedGet.mockResolvedValue({
      tab: "foryou",
      items: [
        {
          id: "prod-1",
          productId: "prod-1",
          videoId: "vid-1",
          store: { id: "store-1", name: "Shop", rating: 0, reviewsCount: 0, avatar: "" },
          engagement: { views: 10, comments: 0, shares: 0, saves: 0 },
        },
      ],
    });

    const feed = await videosApi.getFeed("foryou");

    expect(feed.items[0].id).toBe("prod-1");
    expect(feed.items[0].productId).toBe("prod-1");
    expect(feed.items[0].videoId).toBe("vid-1");
  });

  it("falls back to id for productId and null for videoId when absent", async () => {
    mockedGet.mockResolvedValue({
      tab: "foryou",
      items: [{ id: "prod-9", store: {}, engagement: { views: 0 } }],
    });

    const feed = await videosApi.getFeed("foryou");

    expect(feed.items[0].productId).toBe("prod-9");
    expect(feed.items[0].videoId).toBeNull();
  });

  it("records a view against the store video id with the qualified-view payload", async () => {
    mockedPost.mockResolvedValue({ videoId: "vid-1", viewed: true, counted: true, viewCount: 5 });

    await videosApi.recordView("vid-1", {
      eventType: "qualified_view",
      source: "watch_feed",
      playbackPercent: 42,
      watchMs: 3000,
      videoDurationMs: 9000,
    });

    expect(mockedPost).toHaveBeenCalledWith(
      "/videos/vid-1/view",
      expect.objectContaining({ eventType: "qualified_view", playbackPercent: 42 }),
    );
  });
});
