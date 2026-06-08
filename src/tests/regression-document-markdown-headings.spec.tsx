import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownContent } from "@/components/MarkdownContent";

// REGRESSION: the commission document once rendered markdown with a hand-rolled
// converter (markdownToHtml). Its list step wrapped
// EVERYTHING between the first <li> and the last <li> in a single greedy <ul>:
//   html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
// Because the first bullet was in "## 4. Payment & Settlement" and the last in
// "## 6. Questions?", the "## 5. Special Cases" and "## 6. Questions?" headings
// (and the paragraph between them) got absorbed INSIDE one big list, losing
// their heading layout/spacing — exactly the broken render in the bug report.
//
// The fix routes /legal/[slug] through the shared
// MarkdownContent component (ReactMarkdown + remark-gfm). This test pins the
// desired structure: every section heading is a real heading element and lives
// OUTSIDE any list.

// The relevant slice of public/legal/commission-information.md (sections 4-6),
// which is where the greedy <ul> swallowed the headings.
const DOC = `## 4. Payment & Settlement

- Seller payouts are processed **within 3-5 business days** after order delivery
- Commission is deducted at the time of payout
- Detailed commission breakdowns are available in your seller dashboard

## 5. Special Cases

- **Cancelled Orders:** No commission is charged
- **Refunded Orders:** Commission is refunded to the seller within 3-5 business days
- **Return/Refund:** Commission on returned items is credited back to the seller

## 6. Questions?

For more information about commission structure or to discuss custom rates for high-volume sellers:

- **Email:** bazaarco.business@gmail.com
`;

function renderDoc() {
  return render(<MarkdownContent content={DOC} />);
}

describe("Regression: document markdown headings not swallowed by lists", () => {
  it("renders each section title as a real heading element", () => {
    renderDoc();

    const special = screen.getByRole("heading", { name: /5\. Special Cases/i });
    const questions = screen.getByRole("heading", { name: /6\. Questions\?/i });

    expect(special.tagName).toBe("H2");
    expect(questions.tagName).toBe("H2");
  });

  it("keeps section headings OUTSIDE any list (the original bug)", () => {
    const { container } = renderDoc();

    const special = screen.getByRole("heading", { name: /5\. Special Cases/i });
    const questions = screen.getByRole("heading", { name: /6\. Questions\?/i });

    // The greedy <ul> bug nested these headings inside a <ul>/<li>.
    expect(special.closest("ul, li")).toBeNull();
    expect(questions.closest("ul, li")).toBeNull();

    // Each "## N." section is its own list, not one giant merged list.
    expect(container.querySelectorAll("ul").length).toBe(3);
  });

  it("renders the inter-section paragraph as a <p>, not a list item", () => {
    renderDoc();

    const intro = screen.getByText(/For more information about commission structure/i);
    expect(intro.tagName).toBe("P");
    expect(intro.closest("li")).toBeNull();
  });
});
