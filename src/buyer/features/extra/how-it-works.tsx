"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AppLink, Button, Icon, SectionHead } from "@/components/ui";
import { pathFromScreen, sellerSignupPath } from "@/config/routes";
import "./how-it-works.css";

type GuideTab = "buyers" | "sellers";

type GuideStep = {
  title: string;
  icon: string;
  text: string;
  note?: string;
};

const buyerSteps: GuideStep[] = [
  {
    title: "Discover",
    icon: "search",
    text: "Browse products through videos, categories, search, and seller pages.",
  },
  {
    title: "Watch & check details",
    icon: "video",
    text: "Watch product videos and check the name, price, description, options, seller details, and delivery information.",
  },
  {
    title: "Bargain if available",
    icon: "handshake",
    text: "Send an offer only when a product allows bargaining. The seller can accept, reject, or respond.",
    note: "Not every product has bargaining. Some products have fixed prices.",
  },
  {
    title: "Add to cart / Buy now",
    icon: "cart",
    text: "Add items to cart or buy directly when you are ready to order.",
  },
  {
    title: "Choose delivery & payment",
    icon: "wallet",
    text: "At checkout, review the delivery option, delivery charge, and payment method before confirming.",
  },
  {
    title: "Receive order",
    icon: "truck",
    text: "After the seller prepares the product, the order moves through the BazaarCo Nepal delivery process.",
  },
  {
    title: "Get support if needed",
    icon: "headphones",
    text: "If something is damaged, incorrect, fake, or not as described, contact BazaarCo Nepal support.",
    note: "Complaints and returns are reviewed according to BazaarCo Nepal policies.",
  },
];

const sellerSteps: GuideStep[] = [
  {
    title: "Join",
    icon: "store",
    text: "Apply to sell as a local shop, small business, home-based brand, social seller, or growing Nepali brand.",
  },
  {
    title: "List products",
    icon: "package",
    text: "Add product names, prices, stock, variants, descriptions, photos, and pickup or delivery information.",
  },
  {
    title: "Upload real videos",
    icon: "camera",
    text: "Show the real product, size, color, condition, and packaging so buyers can trust what they see.",
  },
  {
    title: "Receive orders or bargain requests",
    icon: "handshake",
    text: "Buyers can order directly. If bargaining is enabled, sellers can accept, reject, or manage offers.",
    note: "Bargaining is optional. Sellers choose whether to allow it on selected products.",
  },
  {
    title: "Prepare & pack",
    icon: "badgeCheck",
    text: "Prepare the correct item, check quality, pack it safely, and keep it ready for delivery.",
  },
  {
    title: "Hub drop-off or pickup",
    icon: "mapPin",
    text: "Depending on the order and availability, sellers may drop the product at a hub or use a pickup option.",
  },
  {
    title: "Delivery",
    icon: "truck",
    text: "The order moves through the delivery flow. BazaarCo Nepal may combine products from multiple sellers where available.",
  },
  {
    title: "Payout",
    icon: "wallet",
    text: "Seller payout is released after successful delivery and after refund or dispute checks are cleared.",
    note: "Commission is based on the final product selling price. Delivery charges are handled separately.",
  },
];

const sharedNotes = [
  {
    title: "Marketplace role",
    text: "BazaarCo Nepal connects buyers and independent sellers in one marketplace.",
  },
  {
    title: "Product videos",
    text: "Videos help buyers understand products and help sellers build trust.",
  },
  {
    title: "Optional bargaining",
    text: "Bargaining is optional and available only on selected products.",
  },
  {
    title: "Delivery and support",
    text: "BazaarCo Nepal may help with delivery, complaints, and support according to its policies.",
  },
];

function StepCard({ step, index }: { step: GuideStep; index: number }) {
  return (
    <li className="bz-how__step">
      <div className="bz-how__step-card">
        <div className="bz-how__step-head">
          <span className="bz-how__step-number">{index + 1}</span>
          <span className="bz-how__icon">
            <Icon name={step.icon} size={18} />
          </span>
        </div>
        <div className="bz-how__step-copy">
          <h3>{step.title}</h3>
          <p>{step.text}</p>
          {step.note ? (
            <div className="bz-how__note">
              <span>Note:</span>
              <span>{step.note}</span>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function TabButton({
  id,
  activeTab,
  onSelect,
  children,
}: {
  id: GuideTab;
  activeTab: GuideTab;
  onSelect: (tab: GuideTab) => void;
  children: ReactNode;
}) {
  const selected = activeTab === id;
  return (
    <button
      type="button"
      className={selected ? "bz-how__tab is-active" : "bz-how__tab"}
      role="tab"
      id={`how-tab-${id}`}
      aria-selected={selected}
      aria-controls={`how-panel-${id}`}
      onClick={() => onSelect(id)}
    >
      {children}
    </button>
  );
}

function GuidePanel({ activeTab }: { activeTab: GuideTab }) {
  const isBuyer = activeTab === "buyers";
  const steps = isBuyer ? buyerSteps : sellerSteps;
  return (
    <section
      className="bz-how__panel"
      role="tabpanel"
      id={`how-panel-${activeTab}`}
      aria-labelledby={`how-tab-${activeTab}`}
    >
      <div className="bz-how__panel-head">
        <SectionHead title={isBuyer ? "For buyers" : "For sellers"} />
        <p>
          {isBuyer
            ? "A simple flow for discovering, checking, ordering, receiving, and getting help."
            : "A clear flow for joining, listing, preparing orders, delivery, commission, and payout."}
        </p>
      </div>
      <ol className="bz-how__timeline">
        {steps.map((step, index) => (
          <StepCard key={step.title} step={step} index={index} />
        ))}
      </ol>
      <div className="bz-how__actions">
        {isBuyer ? (
          <>
            <Button variant="primary" size="lg" href={pathFromScreen("home")}>
              Start shopping
            </Button>
            <Button variant="secondary" size="lg" href={pathFromScreen("faq")}>
              Visit FAQs
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" size="lg" href={sellerSignupPath()}>
              Become a seller
            </Button>
            <Button variant="secondary" size="lg" href="/legal/seller-policy">
              Seller policy
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

export function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<GuideTab>("buyers");

  return (
    <div className="bz-how">
      <section className="container">
        <div className="bz-how__hero">
          <h1>How BazaarCo Nepal Works</h1>
          <p>Buyers and sellers use BazaarCo Nepal in different ways.</p>
        </div>
      </section>

      <section className="container">
        <div className="bz-how__guide">
          <div className="bz-how__tabs" role="tablist" aria-label="How BazaarCo Nepal works">
            <TabButton id="buyers" activeTab={activeTab} onSelect={setActiveTab}>
              <Icon name="cart" size={18} />
              For Buyers
            </TabButton>
            <TabButton id="sellers" activeTab={activeTab} onSelect={setActiveTab}>
              <Icon name="store" size={18} />
              For Sellers
            </TabButton>
          </div>
          <GuidePanel activeTab={activeTab} />
        </div>
      </section>

      <section className="container">
        <div className="bz-how__shared">
          <SectionHead title="What both buyers and sellers should know" />
          <div className="bz-how__shared-grid">
            {sharedNotes.map((note) => (
              <div key={note.title} className="bz-how__shared-card">
                <h3>{note.title}</h3>
                <p>{note.text}</p>
              </div>
            ))}
          </div>
          <p className="bz-how__policy">
            For formal rules, read the{" "}
            <AppLink href="/legal/terms-and-conditions">Terms and Conditions</AppLink>,{" "}
            <AppLink href="/legal/return-and-refund-policy">Return and Refund Policy</AppLink>, and{" "}
            <AppLink href="/legal/grievance-redressal-policy">Grievance Redressal Policy</AppLink>.
          </p>
        </div>
      </section>
    </div>
  );
}
