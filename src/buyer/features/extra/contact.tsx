"use client";

import { Button, Icon, SectionHead } from "@/components/ui";
import { pathFromScreen, sellerSignupPath } from "@/config/routes";
import "./contact.css";

const SUPPORT_EMAIL = "support@bazaarconepal.com";
const GRIEVANCE_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=GRIEVANCE`;
const WHATSAPP_LINK = "https://wa.me/9779700053075";
const GRIEVANCE_POLICY = "/legal/grievance-redressal-policy";
const LEGAL_INFO = "/legal/legal-information";

export function ContactPage() {
  return (
    <div className="bz-contact">
      {/* Hero */}
      <section className="container">
        <div className="bz-contact__hero">
          <h1 className="bz-contact__title">Contact BazaarCo Nepal</h1>
          <p className="bz-contact__intro">
            We&apos;re here to help buyers, sellers, and local businesses across Nepal.
          </p>
          <span className="bz-contact__hours">
            <Icon name="clock" size={15} />
            Support available daily from 6 AM to 11 PM.
          </span>
        </div>
      </section>

      {/* Contact methods */}
      <section className="container bz-contact__section">
        <div className="bz-contact__grid">
          <a className="bz-contact__method" href={`mailto:${SUPPORT_EMAIL}`}>
            <span className="bz-contact__chip">
              <Icon name="mail" size={20} />
            </span>
            <span className="bz-contact__method-title">Email Support</span>
            <span className="bz-contact__method-value">{SUPPORT_EMAIL}</span>
            <p className="bz-contact__method-desc">
              For orders, seller help, complaints, and general questions.
            </p>
          </a>

          <a
            className="bz-contact__method"
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="bz-contact__chip">
              <Icon name="phone" size={20} />
            </span>
            <span className="bz-contact__method-title">WhatsApp &amp; Phone</span>
            <span className="bz-contact__method-value">+977 9700053075</span>
            <p className="bz-contact__method-desc">For quick support during support hours.</p>
          </a>

          <a className="bz-contact__method" href={GRIEVANCE_MAILTO}>
            <span className="bz-contact__chip">
              <Icon name="shieldCheck" size={20} />
            </span>
            <span className="bz-contact__method-title">Grievance Contact</span>
            <span className="bz-contact__method-value">{SUPPORT_EMAIL}</span>
            <p className="bz-contact__method-desc">
              For formal complaints and policy-related issues.
            </p>
          </a>
        </div>
      </section>

      {/* What do you need help with? */}
      <section className="container bz-contact__section">
        <SectionHead title="What do you need help with?" />
        <div className="bz-contact__grid">
          <div className="bz-contact__action">
            <span className="bz-contact__action-title">Track or report an order</span>
            <p className="bz-contact__action-desc">Check status or raise an issue on a purchase.</p>
            <Button variant="secondary" size="md" icon="package" href={pathFromScreen("orders")}>
              My Orders
            </Button>
          </div>

          <div className="bz-contact__action">
            <span className="bz-contact__action-title">Join as a seller</span>
            <p className="bz-contact__action-desc">Start selling to buyers across Nepal.</p>
            <Button variant="secondary" size="md" icon="store" href={sellerSignupPath()}>
              Register as Seller
            </Button>
          </div>

          <div className="bz-contact__action">
            <span className="bz-contact__action-title">Raise a complaint</span>
            <p className="bz-contact__action-desc">Read how formal grievances are handled.</p>
            <Button variant="secondary" size="md" icon="file" href={GRIEVANCE_POLICY}>
              View Grievance Policy
            </Button>
          </div>

          <div className="bz-contact__action">
            <span className="bz-contact__action-title">Company / legal details</span>
            <p className="bz-contact__action-desc">Registered company and policy information.</p>
            <Button variant="secondary" size="md" icon="building" href={LEGAL_INFO}>
              Legal Information
            </Button>
          </div>
        </div>
      </section>

      {/* Complaints & grievances */}
      <section className="container">
        <div className="bz-contact__grievance">
          <span className="bz-contact__chip">
            <Icon name="shieldCheck" size={20} />
          </span>
          <div className="bz-contact__grievance-body">
            <h2 className="bz-contact__grievance-title">Complaints &amp; Grievances</h2>
            <p>
              To raise a formal complaint, email{" "}
              <a href={GRIEVANCE_MAILTO} style={{ color: "var(--blue)" }}>
                {SUPPORT_EMAIL}
              </a>{" "}
              with the subject marked &ldquo;GRIEVANCE&rdquo;, or follow our Grievance Redressal
              Policy.
            </p>
            <Button variant="secondary" size="md" href={GRIEVANCE_POLICY}>
              View Grievance Redressal Policy
            </Button>
          </div>
        </div>
      </section>

      {/* Final support CTA */}
      <section className="container">
        <div className="bz-contact__cta">
          <h2 className="bz-contact__cta-title">Still need help?</h2>
          <p>
            Our support team is here to assist you with orders, selling, delivery, payments, and
            complaints.
          </p>
          <div className="bz-contact__cta-actions">
            <Button variant="primary" size="lg" href={`mailto:${SUPPORT_EMAIL}`} target="_blank">
              Contact Support
            </Button>
            <Button variant="secondary" size="lg" href={pathFromScreen("faq")}>
              Visit FAQs
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
