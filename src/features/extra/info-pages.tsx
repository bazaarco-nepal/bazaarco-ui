"use client";

import React from "react";
import { AppLink } from "@/components/ui";
import { pathFromScreen, searchPath } from "@/config/routes";

type InfoPageProps = {
  title: string;
  children: React.ReactNode;
};

function InfoPageShell({ title, children }: InfoPageProps) {
  return (
    <div
      className="bz-container-pad"
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "28px 28px 80px" }}
    >
      <AppLink
        href={pathFromScreen("profile")}
        className="bz-back-link"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--ink-500)",
          fontWeight: 600,
          fontSize: ".875rem",
          textDecoration: "none",
          marginBottom: 20,
        }}
      >
        ← Back to profile
      </AppLink>
      <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--blue-deep)" }}>
        {title}
      </h1>
      <div
        style={{
          color: "var(--ink-700)",
          fontSize: ".9375rem",
          lineHeight: 1.75,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function HelpSupportPage() {
  return (
    <InfoPageShell title="Help & support">
      <p>
        Need help with an order, payment, or seller? We&apos;re here for shoppers and sellers across
        Nepal.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Contact us</h2>
      <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
        <li>
          Support Email:{" "}
          <a href="mailto:support@bazaarconepal.com" style={{ color: "var(--blue)" }}>
            support@bazaarconepal.com
          </a>
        </li>
        <li>
          WhatsApp & Phone:{" "}
          <a href="https://wa.me/9779700053075" style={{ color: "var(--blue)" }}>
            +977 9700053075
          </a>
        </li>
      </ul>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Common topics</h2>
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        <li>
          <strong>Track an order</strong> — open{" "}
          <AppLink href={pathFromScreen("orders")} style={{ color: "var(--blue)" }}>
            My orders
          </AppLink>{" "}
          from your profile.
        </li>
        <li>
          <strong>Returns</strong> — eligible items can be returned within 7 days of delivery;
          contact the seller first via Messages.
        </li>
        <li>
          <strong>Cash on delivery</strong> — pay the rider when your package arrives; keep exact
          change when possible.
        </li>
        <li>
          <strong>Become a seller</strong> — register as a seller account and complete shop
          verification from the seller dashboard.
        </li>
      </ul>
    </InfoPageShell>
  );
}

export function FAQPage() {
  return (
    <InfoPageShell title="Frequently Asked Questions">
      <p>Find answers to common questions about shopping on BazaarCo.</p>

      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Payment & orders</h2>
      <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
        <li>
          <strong>What payment methods does BazaarCo accept?</strong> — We accept Cash on Delivery
          (COD), credit/debit cards, digital wallets, and online banking. Choose your preferred
          method at checkout.
        </li>
        <li>
          <strong>How long does delivery take?</strong> — Standard delivery takes 5–7 business days.
          Expedited options are available in selected areas. Track your order in real-time from{" "}
          <AppLink href={pathFromScreen("orders")} style={{ color: "var(--blue)" }}>
            My orders
          </AppLink>
          .
        </li>
      </ul>

      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Returns & refunds</h2>
      <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
        <li>
          <strong>What is your return policy?</strong> — Items can be returned within 7 days of
          delivery if unused and in original condition. Contact the seller via Messages to initiate
          a return; refunds process within 5–7 business days.
        </li>
        <li>
          <strong>Can I cancel my order?</strong> — Cancel before the seller ships. After shipping,
          use the return process. Refunds are credited to your original payment method.
        </li>
      </ul>

      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Account & security</h2>
      <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
        <li>
          <strong>Is my personal information safe?</strong> — Yes. We use industry-standard
          encryption, never store payment data, and comply with international security standards.
        </li>
        <li>
          <strong>How do I reset my password?</strong> — Use the &ldquo;Forgot password&rdquo; link
          on the sign-in page. We&apos;ll send a reset link to your email.
        </li>
      </ul>

      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>General support</h2>
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        <li>
          <strong>How do I contact support?</strong> &mdash; Email{" "}
          <a href="mailto:support@bazaarco.com" style={{ color: "var(--blue)" }}>
            support@bazaarco.com
          </a>{" "}
          or WhatsApp{" "}
          <a href="https://wa.me/9779700053075" style={{ color: "var(--blue)" }}>
            +977 9700053075
          </a>
          .
        </li>
        <li>
          <strong>How do I become a seller?</strong> — Register a seller account and complete shop
          verification from the seller dashboard.
        </li>
      </ul>
    </InfoPageShell>
  );
}

export function PrivacyPolicyPage() {
  return (
    <InfoPageShell title="Privacy policy">
      <p>
        BazaarCo Nepal Pvt. Ltd. (&quot;BazaarCo&quot;, &quot;we&quot;) respects your privacy. This
        policy explains what we collect, why, and your choices.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>What we collect</h2>
      <p>
        Account details (name, email, phone), delivery addresses, order history, messages with
        sellers, and device/log data needed to secure the platform.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>How we use it</h2>
      <p>
        To fulfil orders, prevent fraud, improve search and recommendations, send transactional
        notifications (order updates, delivery), and comply with Nepali law when required.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Sharing</h2>
      <p>
        We share delivery details with sellers and logistics partners only as needed to complete
        your order. We do not sell your personal data to advertisers.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Your rights</h2>
      <p>
        You may update your profile, export or delete your account from Profile settings, or email{" "}
        <a href="mailto:support@bazaarconepal.com" style={{ color: "var(--blue)" }}>
          support@bazaarconepal.com
        </a>{" "}
        or WhatsApp{" "}
        <a href="https://wa.me/9779700053075" style={{ color: "var(--blue)" }}>
          +977 9700053075
        </a>
        .
      </p>
      <p style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 24 }}>
        Last updated: June 2026
      </p>
    </InfoPageShell>
  );
}

export function TermsPage() {
  return (
    <InfoPageShell title="Terms & conditions">
      <p>
        By using BazaarCo you agree to these terms. If you do not agree, please do not use the
        marketplace.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Marketplace role</h2>
      <p>
        BazaarCo connects buyers and independent sellers. Unless stated otherwise on a product page,
        the sale contract is between you and the seller; BazaarCo facilitates payment, messaging,
        and dispute support.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Orders & pricing</h2>
      <p>
        Prices are shown in Nepalese Rupees inclusive of applicable taxes where noted. Delivery fees
        are shown before checkout. Sellers are responsible for accurate listings; we may remove
        listings that violate our policies.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Prohibited conduct</h2>
      <p>
        No fraud, counterfeit goods, hate speech, or attempts to take transactions off-platform to
        avoid buyer protection.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Limitation of liability</h2>
      <p>
        To the extent permitted by law, BazaarCo is not liable for indirect damages. Our aggregate
        liability for a claim is limited to the fees paid to BazaarCo for that order.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Contact</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href="mailto:support@bazaarconepal.com" style={{ color: "var(--blue)" }}>
          support@bazaarconepal.com
        </a>{" "}
        or WhatsApp{" "}
        <a href="https://wa.me/9779700053075" style={{ color: "var(--blue)" }}>
          +977 9700053075
        </a>
        .
      </p>
      <p style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 24 }}>
        Last updated: June 2026
      </p>
    </InfoPageShell>
  );
}

export function AboutPage() {
  return (
    <InfoPageShell title="About BazaarCo">
      <p>
        BazaarCo is a low-commission, video-first marketplace built for how Nepal shops —
        bargaining, cash on delivery, and trusted local sellers.
      </p>
      <p>
        We are headquartered in Kathmandu and work with sellers across the country to list products
        with clear photos, honest descriptions, and fast delivery in the valley and beyond.
      </p>
    </InfoPageShell>
  );
}

export function HowItWorksPage() {
  return (
    <InfoPageShell title="How BazaarCo Works">
      <p>
        BazaarCo connects you directly with local sellers across Nepal. Watch real product videos,
        bargain on price, and pay your way — including cash on delivery.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>For shoppers</h2>
      <ol style={{ paddingLeft: 20, margin: 0 }}>
        <li>
          <strong>Discover</strong> — browse video-first listings or{" "}
          <AppLink href={searchPath()} style={{ color: "var(--blue)" }}>
            search
          </AppLink>{" "}
          for what you need.
        </li>
        <li>
          <strong>Bargain</strong> — send an offer and negotiate fairly. See the{" "}
          <AppLink href={pathFromScreen("bargaining-guide")} style={{ color: "var(--blue)" }}>
            Bargaining Guide
          </AppLink>
          .
        </li>
        <li>
          <strong>Order</strong> — place your order with online payment or cash on delivery. See{" "}
          <AppLink href={pathFromScreen("how-to-order")} style={{ color: "var(--blue)" }}>
            How to Order
          </AppLink>
          .
        </li>
        <li>
          <strong>Delivery</strong> — sellers prepare your items and BazaarCo coordinates delivery.
          Read our{" "}
          <AppLink href="/legal/shipping-and-delivery-policy" style={{ color: "var(--blue)" }}>
            Delivery &amp; Shipping Policy
          </AppLink>
          .
        </li>
        <li>
          <strong>Protection</strong> — every eligible order is covered by{" "}
          <AppLink href="/legal/buyer-protection-policy" style={{ color: "var(--blue)" }}>
            Buyer Protection
          </AppLink>
          .
        </li>
      </ol>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>For sellers</h2>
      <p>
        List products for free, reach buyers across Nepal, and get paid on a regular settlement
        cycle. Learn more in the{" "}
        <AppLink href="/legal/seller-policy" style={{ color: "var(--blue)" }}>
          Seller Policy
        </AppLink>{" "}
        or{" "}
        <AppLink href={pathFromScreen("auth")} style={{ color: "var(--blue)" }}>
          become a seller
        </AppLink>
        .
      </p>
    </InfoPageShell>
  );
}

export function ContactPage() {
  return (
    <InfoPageShell title="Contact Us">
      <p>
        We&apos;re here for shoppers and sellers across Nepal. Reach our support team any day from 8
        AM to 8 PM.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Support</h2>
      <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
        <li>
          Email:{" "}
          <a href="mailto:support@bazaarconepal.com" style={{ color: "var(--blue)" }}>
            support@bazaarconepal.com
          </a>
        </li>
        <li>
          WhatsApp &amp; Phone:{" "}
          <a href="https://wa.me/9779700053075" style={{ color: "var(--blue)" }}>
            +977 9700053075
          </a>
        </li>
      </ul>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Complaints &amp; grievances</h2>
      <p>
        To raise a formal complaint, email{" "}
        <a href="mailto:support@bazaarconepal.com" style={{ color: "var(--blue)" }}>
          support@bazaarconepal.com
        </a>{" "}
        marked &ldquo;GRIEVANCE&rdquo;, or follow our{" "}
        <AppLink href="/legal/grievance-redressal-policy" style={{ color: "var(--blue)" }}>
          Grievance Redressal Policy
        </AppLink>
        . For full company details, see our{" "}
        <AppLink href="/legal/legal-information" style={{ color: "var(--blue)" }}>
          Legal Information
        </AppLink>{" "}
        page.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Common requests</h2>
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        <li>
          <strong>Order help</strong> — open{" "}
          <AppLink href={pathFromScreen("orders")} style={{ color: "var(--blue)" }}>
            My orders
          </AppLink>{" "}
          to track or report an issue.
        </li>
        <li>
          <strong>Selling on BazaarCo</strong> —{" "}
          <AppLink href={pathFromScreen("auth")} style={{ color: "var(--blue)" }}>
            register as a seller
          </AppLink>
          .
        </li>
      </ul>
    </InfoPageShell>
  );
}

export function HowToOrderPage() {
  return (
    <InfoPageShell title="How to Order">
      <p>Ordering on BazaarCo takes just a few steps.</p>
      <ol style={{ paddingLeft: 20, margin: 0 }}>
        <li>
          <strong>Find a product</strong> — browse videos or{" "}
          <AppLink href={searchPath()} style={{ color: "var(--blue)" }}>
            search
          </AppLink>{" "}
          for what you want.
        </li>
        <li>
          <strong>Bargain (optional)</strong> — send an offer if you&apos;d like to negotiate the
          price. See the{" "}
          <AppLink href={pathFromScreen("bargaining-guide")} style={{ color: "var(--blue)" }}>
            Bargaining Guide
          </AppLink>
          .
        </li>
        <li>
          <strong>Add to cart</strong> — add items and review your{" "}
          <AppLink href={pathFromScreen("cart")} style={{ color: "var(--blue)" }}>
            cart
          </AppLink>
          .
        </li>
        <li>
          <strong>Enter delivery details</strong> — choose or add a delivery address.
        </li>
        <li>
          <strong>Choose payment</strong> — pay online (eSewa, Khalti, bank) or by cash on delivery
          where available. See the{" "}
          <AppLink href="/legal/payment-policy" style={{ color: "var(--blue)" }}>
            Payment Policy
          </AppLink>
          .
        </li>
        <li>
          <strong>Confirm &amp; track</strong> — place the order and track it from{" "}
          <AppLink href={pathFromScreen("orders")} style={{ color: "var(--blue)" }}>
            My orders
          </AppLink>
          .
        </li>
      </ol>
      <p style={{ marginTop: 16 }}>
        Need to return something? See our{" "}
        <AppLink href="/legal/return-and-refund-policy" style={{ color: "var(--blue)" }}>
          Returns, Refunds &amp; Cancellations
        </AppLink>{" "}
        policy.
      </p>
    </InfoPageShell>
  );
}

export function BargainingGuidePage() {
  return (
    <InfoPageShell title="Bargaining Guide">
      <p>
        Bargaining is at the heart of how Nepal shops — and BazaarCo brings it online. Here&apos;s
        how to negotiate fairly with sellers.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>How it works</h2>
      <ol style={{ paddingLeft: 20, margin: 0 }}>
        <li>
          <strong>Send an offer</strong> — on a product page, propose your price.
        </li>
        <li>
          <strong>Up to 3 rounds</strong> — you and the seller can counter up to three times to
          reach a fair price.
        </li>
        <li>
          <strong>Seller responds</strong> — the seller can accept, counter, or reject your offer.
        </li>
        <li>
          <strong>Accepted price</strong> — once accepted, the agreed price is valid for a limited
          time. Check out before it expires.
        </li>
      </ol>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Tips for fair bargaining</h2>
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        <li>Make a reasonable first offer — lowball offers are often rejected.</li>
        <li>Keep all negotiation on BazaarCo so your order stays protected.</li>
        <li>
          Track your offers anytime from{" "}
          <AppLink href={pathFromScreen("bargains")} style={{ color: "var(--blue)" }}>
            Bargains
          </AppLink>
          .
        </li>
      </ul>
    </InfoPageShell>
  );
}
