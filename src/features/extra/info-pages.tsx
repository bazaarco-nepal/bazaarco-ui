"use client";

import React from "react";
import { AppLink, Button } from "@/components/ui";
import { pathFromScreen, searchPath } from "@/config/routes";

type InfoPageProps = {
  title: string;
  children: React.ReactNode;
  showBrowse?: boolean;
};

function InfoPageShell({ title, children, showBrowse = true }: InfoPageProps) {
  return (
    <div
      className="bz-container-pad"
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "28px 28px 80px" }}
    >
      <AppLink
        href={pathFromScreen("profile")}
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
      {showBrowse && (
        <div style={{ marginTop: 32 }}>
          <Button variant="secondary" href={searchPath()}>
            Browse products
          </Button>
        </div>
      )}
    </div>
  );
}

export function HelpSupportPage() {
  return (
    <InfoPageShell title="Help & support" showBrowse={false}>
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
    <InfoPageShell title="Frequently Asked Questions" showBrowse={false}>
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
    <InfoPageShell title="Privacy policy" showBrowse={false}>
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
        </a>
        {" "}or WhatsApp{" "}
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
        </a>
        {" "}or WhatsApp{" "}
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
