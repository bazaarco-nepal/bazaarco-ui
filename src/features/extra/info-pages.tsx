"use client";

import React from "react";
import { AppLink, Button } from "@/components/ui";
import { pathFromScreen } from "@/config/routes";

type InfoPageProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBrowse?: boolean;
};

function InfoPageShell({ title, subtitle, children, showBrowse = true }: InfoPageProps) {
  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "28px 28px 80px" }}>
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
      {subtitle && (
        <p className="ne" style={{ color: "var(--ink-500)", margin: "8px 0 24px" }}>
          {subtitle}
        </p>
      )}
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
          <Button variant="secondary" href={pathFromScreen("browse")}>
            Browse products
          </Button>
        </div>
      )}
    </div>
  );
}

export function HelpSupportPage() {
  return (
    <InfoPageShell title="Help & support" subtitle="मद्दत र सहयोग" showBrowse={false}>
      <p>
        Need help with an order, payment, or seller? We&apos;re here for shoppers and sellers across
        Nepal.
      </p>
      <h2 style={{ fontSize: "1.125rem", margin: "24px 0 8px" }}>Contact us</h2>
      <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
        <li>
          Email:{" "}
          <a href="mailto:bazaarco.business@gmail.com" style={{ color: "var(--blue)" }}>
            bazaarco.business@gmail.com
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

export function PrivacyPolicyPage() {
  return (
    <InfoPageShell title="Privacy policy" subtitle="गोपनीयता नीति" showBrowse={false}>
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
        <a href="mailto:bazaarco.business@gmail.com" style={{ color: "var(--blue)" }}>
          bazaarco.business@gmail.com
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
    <InfoPageShell title="Terms & conditions" subtitle="नियम तथा सर्तहरू">
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
        <a href="mailto:bazaarco.business@gmail.com" style={{ color: "var(--blue)" }}>
          bazaarco.business@gmail.com
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
    <InfoPageShell title="About BazaarCo" subtitle="बजारको बारेमा">
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
