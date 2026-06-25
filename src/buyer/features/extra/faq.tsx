"use client";

import { useEffect, useId, useState, type MouseEvent } from "react";
import { Button, Icon, SectionHead } from "@/components/ui";
import { pathFromScreen, sellerSignupPath } from "@/config/routes";
import "./faq.css";

type QA = { q: string; a: string };
type Category = { id: string; icon: string; nav: string; title: string; items: QA[] };

const CATEGORIES: Category[] = [
  {
    id: "general",
    icon: "infoCircle",
    nav: "General",
    title: "General Questions",
    items: [
      {
        q: "What is BazaarCo Nepal?",
        a: "BazaarCo Nepal is an online marketplace built for the way Nepali people actually shop. Buyers can discover products through videos, view product details, bargain when available, and place orders more confidently. Sellers can show their products, reach more customers, and grow their business online.",
      },
      {
        q: "Is BazaarCo Nepal only for Kathmandu Valley?",
        a: "BazaarCo Nepal is starting from Kathmandu Valley first so we can provide a smoother delivery and order experience. As we grow, we plan to expand step by step to more areas of Nepal.",
      },
      {
        q: "How is BazaarCo Nepal different from other online shopping platforms?",
        a: "BazaarCo Nepal focuses on product videos, clear product information, bargaining when available, seller visibility, and a simple buying process. Our goal is to make online shopping feel more real, more local, and more trustworthy.",
      },
      {
        q: "Why does BazaarCo Nepal focus on videos?",
        a: "Photos can sometimes hide important product details. Videos help buyers see the product more clearly before ordering. This supports our belief that what you see should be what you get.",
      },
      {
        q: "Is BazaarCo Nepal only for big brands?",
        a: "No. BazaarCo Nepal is built for local sellers, small businesses, Instagram stores, TikTok sellers, home-based brands, growing companies, and established brands. Any genuine seller with suitable products can apply to sell on BazaarCo Nepal.",
      },
    ],
  },
  {
    id: "buyer",
    icon: "cart",
    nav: "Buyer",
    title: "Buyer Questions",
    items: [
      {
        q: "How do I buy from BazaarCo Nepal?",
        a: "You can browse products, watch product videos, check product details, add items to cart, and place your order through BazaarCo Nepal. If bargaining is available on a product, you may also make an offer before buying.",
      },
      {
        q: "Can I bargain on every product?",
        a: "No. Bargaining is available only on products where the seller has enabled it. Some products may have fixed prices.",
      },
      {
        q: "What does “What you see should be what you get” mean?",
        a: "It means BazaarCo Nepal wants buyers to receive products that match what was shown and described. Product videos, clear details, and seller information help reduce confusion before ordering.",
      },
      {
        q: "Can I order from multiple sellers at once?",
        a: "Yes. BazaarCo Nepal is designed to support orders from multiple sellers. Depending on the order and delivery flow, products may be combined to make delivery simpler for the buyer.",
      },
      {
        q: "How much is delivery?",
        a: "Delivery charges may depend on the type of order, location, and delivery option. BazaarCo Nepal will show the applicable delivery charge during checkout before you place your order.",
      },
      {
        q: "Is same-day delivery available?",
        a: "Same-day delivery may be available in Kathmandu Valley for eligible orders and within the required order time. Availability can depend on seller preparation, product availability, and delivery conditions.",
      },
      {
        q: "What happens if the product is not available after I order?",
        a: "If a product becomes unavailable, BazaarCo Nepal or the seller will update you. Depending on the situation, the order may be adjusted, cancelled, or refunded if payment has already been made.",
      },
      {
        q: "Can I return or exchange a product?",
        a: "Return or exchange depends on the product type, seller policy, and the reason for return. Products that are damaged, incorrect, or not as described may be eligible for support according to BazaarCo Nepal’s return and refund policy.",
      },
      {
        q: "How do I contact support?",
        a: "You can contact BazaarCo Nepal through the support options provided on the website or official social media channels. Our team will help you with order, delivery, payment, or seller-related questions.",
      },
    ],
  },
  {
    id: "seller",
    icon: "store",
    nav: "Seller",
    title: "Seller Questions",
    items: [
      {
        q: "Who can sell on BazaarCo Nepal?",
        a: "Local shops, small businesses, home-based sellers, Instagram sellers, TikTok sellers, creators, and growing brands can apply to sell on BazaarCo Nepal.",
      },
      {
        q: "How do I join as a seller?",
        a: "You can apply through the seller registration or drop a message to BazaarCo Nepal on Whatsapp, email, or instagram. Our team may ask for your business details, product information, product photos or videos, and pickup or shop location.",
      },
      {
        q: "Is listing free?",
        a: "BazaarCo Nepal is offering simple seller onboarding and listing support during the early stage. Any changes to listing, setup, or seller service charges will be clearly communicated to sellers.",
      },
      {
        q: "What information do sellers need to provide?",
        a: "Sellers may need to provide their shop or brand name, contact details, product photos, product videos, product name, price, stock information, pickup or shop location, and other details needed to sell properly.",
      },
      {
        q: "Can BazaarCo Nepal help me list products?",
        a: "Yes. BazaarCo Nepal may provide guided support to early sellers who need help listing their products properly.",
      },
      {
        q: "Can sellers upload videos?",
        a: "Yes. Product videos are an important part of BazaarCo Nepal. Sellers are encouraged to upload clear videos that show the product honestly and properly.",
      },
      {
        q: "Does BazaarCo Nepal charge commission?",
        a: "Yes. BazaarCo Nepal charges commission based on the product category. The commission percentage may differ depending on the type of product being sold.",
      },
      {
        q: "When do sellers receive payment?",
        a: "Seller payouts follow BazaarCo Nepal’s payout cycle. The exact payout timing and process will be shared with sellers during onboarding or in the seller agreement.",
      },
      {
        q: "Can sellers control bargaining?",
        a: "Yes. If bargaining is available for a product, sellers can control whether bargaining is enabled and set their acceptable minimum price privately. Buyers will not see the seller’s minimum price.",
      },
      {
        q: "Do sellers have to give discounts?",
        a: "No. BazaarCo Nepal does not believe sellers should be forced to sell at a loss. Sellers remain responsible for their own pricing, offers, and product value.",
      },
      {
        q: "What happens when a seller receives an order?",
        a: "After receiving an order, the seller prepares the product according to the order details. The product may then be delivered through the BazaarCo Nepal delivery flow, depending on the order and location.",
      },
      {
        q: "Do sellers need to bring products to BazaarCo Nepal?",
        a: "Depending on the delivery flow, sellers may need to send or bring products to the BazaarCo Nepal hub, or use available pickup options if offered.",
      },
    ],
  },
  {
    id: "bargaining",
    icon: "handshake",
    nav: "Bargaining",
    title: "Bargaining Questions",
    items: [
      {
        q: "What is the bargaining feature?",
        a: "The bargaining feature allows buyers to make an offer on eligible products. Sellers can then accept, reject, or manage offers based on their pricing.",
      },
      {
        q: "Is bargaining available for all products?",
        a: "No. Bargaining is only available when the seller enables it for that product.",
      },
      {
        q: "Can buyers offer any price?",
        a: "Buyers can make an offer, but unreasonable offers may not be accepted. BazaarCo Nepal is designed to keep bargaining fair and useful for both buyers and sellers.",
      },
      {
        q: "Does bargaining reduce seller control?",
        a: "No. Sellers have control over whether bargaining is enabled and what minimum price they are willing to accept.",
      },
      {
        q: "Why does BazaarCo Nepal include bargaining?",
        a: "Bargaining is a normal part of shopping in Nepal. BazaarCo Nepal brings this familiar habit online in a more organized way.",
      },
    ],
  },
  {
    id: "delivery",
    icon: "truck",
    nav: "Delivery",
    title: "Delivery Questions",
    items: [
      {
        q: "How does delivery work?",
        a: "After an order is placed, the seller prepares the product. Depending on the order, products may go through the BazaarCo Nepal delivery flow for checking, combining, and final delivery to the buyer.",
      },
      {
        q: "Can products from different sellers be delivered together?",
        a: "BazaarCo Nepal is designed to make multi-seller orders easier. When possible, items from different sellers may be combined to reduce confusion and improve the delivery experience.",
      },
      {
        q: "Is seller pickup available?",
        a: "Seller pickup may be available depending on the seller location, order type, and BazaarCo Nepal’s delivery arrangement. If pickup charges apply, they will be shared clearly.",
      },
      {
        q: "Are delivery charges fixed?",
        a: "Delivery charges may vary based on location, order type, weight, and delivery option. The buyer will be able to see delivery charges before confirming the order.",
      },
      {
        q: "What if delivery is delayed?",
        a: "Delivery may sometimes be affected by seller preparation time, traffic, weather, courier availability, or location. BazaarCo Nepal will try to keep buyers updated when delays happen.",
      },
    ],
  },
  {
    id: "payment",
    icon: "wallet",
    nav: "Payment",
    title: "Payment Questions",
    items: [
      {
        q: "What payment methods are available?",
        a: "BazaarCo Nepal may support cash on delivery and online payment options depending on availability. The available payment methods will be shown during checkout.",
      },
      {
        q: "Is cash on delivery available?",
        a: "Cash on delivery may be available for eligible orders and locations. Availability can depend on product type, seller, and delivery conditions.",
      },
      {
        q: "Is online payment available?",
        a: "Online payment options may be added or available depending on BazaarCo Nepal’s payment setup. Buyers will see available payment methods during checkout.",
      },
      {
        q: "What happens if I paid online and my order is cancelled?",
        a: "If an eligible paid order is cancelled, BazaarCo Nepal will process the refund according to its refund policy and payment provider process.",
      },
    ],
  },
  {
    id: "trust",
    icon: "shieldCheck",
    nav: "Trust & Safety",
    title: "Trust and Safety Questions",
    items: [
      {
        q: "How does BazaarCo Nepal build trust?",
        a: "BazaarCo Nepal builds trust through product videos, clear product details, seller information, organized ordering, delivery support, and customer support when needed.",
      },
      {
        q: "Are sellers verified?",
        a: "BazaarCo Nepal may review seller information before allowing them to sell. The goal is to work with genuine sellers and improve trust for buyers.",
      },
      {
        q: "What if the product does not match the video or description?",
        a: "If the product is incorrect, damaged, or not as described, buyers should contact BazaarCo Nepal support. The case will be reviewed according to the return and refund policy.",
      },
      {
        q: "Can buyers see seller information?",
        a: "BazaarCo Nepal gives importance to seller visibility so buyers can feel more confident about who they are buying from.",
      },
      {
        q: "Is BazaarCo Nepal safe to use?",
        a: "BazaarCo Nepal is being built to provide a safer and clearer buying and selling experience. Like any marketplace, buyers and sellers should follow the platform rules and use official BazaarCo Nepal channels for orders and support.",
      },
    ],
  },
  {
    id: "business",
    icon: "building",
    nav: "Business & Brand",
    title: "Business and Brand Questions",
    items: [
      {
        q: "Can local brands sell on BazaarCo Nepal?",
        a: "Yes. BazaarCo Nepal is made for local Nepali brands that want to reach more buyers and grow online.",
      },
      {
        q: "Can Instagram and TikTok sellers join?",
        a: "Yes. BazaarCo Nepal is especially useful for sellers who already promote products through Instagram, TikTok, Facebook, or other social media platforms.",
      },
      {
        q: "Why should sellers join BazaarCo Nepal instead of only selling through social media?",
        a: "Social media is useful for discovery, but managing orders through messages can become difficult. BazaarCo Nepal helps sellers show products, receive orders, use bargaining when needed, and build a more organized online selling system.",
      },
      {
        q: "Why should buyers use BazaarCo Nepal instead of only buying through social media?",
        a: "BazaarCo Nepal gives buyers a more structured way to shop. Buyers can watch product videos, check details, place orders, and use platform support instead of relying only on messages and trust.",
      },
    ],
  },
];

function FaqItem({ q, a }: QA) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="bz-faq__item">
      <button
        type="button"
        className={open ? "bz-faq__q is-open" : "bz-faq__q"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{q}</span>
        <Icon name="chevronDown" size={18} className="bz-faq__chev" />
      </button>
      <div id={panelId} className="bz-faq__a" role="region" hidden={!open}>
        <p>{a}</p>
      </div>
    </div>
  );
}

export function FAQPage() {
  const [active, setActive] = useState(CATEGORIES[0]?.id ?? "");

  // Scrollspy — highlight the topic chip for the group currently in view.
  useEffect(() => {
    const sections = CATEGORIES.map((c) => document.getElementById(c.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (inView[0]) setActive(inView[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const jumpTo = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  };

  return (
    <div className="bz-faq">
      {/* Header card: hero + topic bar in one contained unit */}
      <section className="container">
        <div className="bz-faq__card">
          <div className="bz-faq__header">
            <h1 className="bz-faq__title">Frequently Asked Questions</h1>
            <p className="bz-faq__intro">
              Find answers to common questions about shopping on BazaarCo.
            </p>
          </div>
          <div className="bz-faq__topicbar">
            <span className="bz-faq__topiclabel">Browse FAQ topics</span>
            <nav className="bz-faq__nav" aria-label="FAQ topics">
              {CATEGORIES.map((c) => (
                <a
                  key={c.id}
                  href={`#${c.id}`}
                  onClick={(e) => jumpTo(e, c.id)}
                  className={active === c.id ? "bz-faq__navchip is-active" : "bz-faq__navchip"}
                  aria-current={active === c.id ? "true" : undefined}
                >
                  <Icon name={c.icon} size={16} />
                  {c.nav}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* Categories */}
      <div className="bz-faq__body container">
        {CATEGORIES.map((c) => (
          <section key={c.id} id={c.id} className="bz-faq__cat">
            <SectionHead
              title={
                <span className="bz-faq__cat-title">
                  <span className="bz-faq__cat-icon">
                    <Icon name={c.icon} size={18} />
                  </span>
                  {c.title}
                </span>
              }
            />
            <div className="bz-faq__list">
              {c.items.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Support block */}
      <section className="bz-faq__support container">
        <div className="bz-faq__support-inner">
          <h2 className="bz-faq__support-title">Still have questions?</h2>
          <p>
            If you have any questions about shopping, selling, delivery, payment, returns, or seller
            onboarding, you can contact BazaarCo Nepal through our official support channels.
          </p>
          <p>We are here to help buyers shop with confidence and sellers grow with respect.</p>
          <div className="bz-faq__support-actions">
            <Button variant="primary" size="lg" href={pathFromScreen("contact")}>
              Contact us
            </Button>
            <Button variant="secondary" size="lg" href={pathFromScreen("home")}>
              Start shopping
            </Button>
            <Button variant="secondary" size="lg" href={sellerSignupPath()}>
              Become a seller
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
