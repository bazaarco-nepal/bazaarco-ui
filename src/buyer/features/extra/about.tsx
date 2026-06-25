"use client";

import { Button, Icon, Logo, SectionHead } from "@/components/ui";
import { pathFromScreen, sellerSignupPath } from "@/config/routes";
import { ASSETS } from "@/config/assets";
import "./about.css";

const SHOP_HREF = pathFromScreen("home");
const SELL_HREF = sellerSignupPath();

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <Icon name="badgeCheck" size={18} />
      <span>{children}</span>
    </li>
  );
}

function CtaRow() {
  return (
    <div className="bz-about__cta-row">
      <Button variant="primary" size="lg" href={SHOP_HREF}>
        Start shopping
      </Button>
      <Button variant="secondary" size="lg" href={SELL_HREF}>
        Become a seller
      </Button>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="bz-about">
      {/* 1 — HERO */}
      <section className="bz-about__hero">
        <div className="container">
          <div className="bz-about__hero-inner">
            <div>
              <div className="bz-about__logo">
                <Logo height={36} />
              </div>
              <h1 className="bz-about__title">About BazaarCo Nepal</h1>
              <p className="bz-about__lede">A better way to buy and sell in Nepal.</p>
              <p>
                BazaarCo Nepal is a new online marketplace built for the way Nepali people actually
                shop.
              </p>
              <p>
                We are bringing together product videos, clear product details, bargaining when
                available, seller information, and simple ordering in one place — so buyers can shop
                with more confidence and sellers can grow in a fairer way.
              </p>
              <p>Our goal is simple:</p>
              <p className="bz-about__statement">
                Make online shopping in Nepal clearer, more trustworthy, and more useful for
                everyone.
              </p>
              <CtaRow />
            </div>
            <div className="bz-about__hero-art">
              <img src={ASSETS.mascot} alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* 2 — WHY BUILT */}
      <section className="container">
        <div className="bz-about__prose">
          <SectionHead title="Why BazaarCo Nepal was built" />
          <p>Online shopping has grown in Nepal, but many problems are still the same.</p>
          <p>
            Buyers often see beautiful photos online, but the product that arrives may not look or
            feel the same. They still have to worry about quality, seller trust, delivery, and
            whether they will actually get what they expected.
          </p>
          <p>
            Sellers also face their own problems. Many work hard to list products, create content,
            manage orders, and serve customers, but they often deal with high charges, delayed
            payments, forced discounts, unclear rules, and systems that are not easy to use.
          </p>
          <p className="bz-about__statement">
            Somewhere along the way, online shopping became stressful for both sides.
          </p>
          <p className="bz-about__center">
            <span className="bz-about__emph">BazaarCo Nepal was built to make this better.</span>
          </p>
        </div>
      </section>

      {/* 3 — WHAT MAKES US DIFFERENT (warm cream band) */}
      <section className="bz-band bz-band--bargain">
        <div className="container">
          <div className="bz-about__prose">
            <SectionHead title="What makes BazaarCo Nepal different" />
            <p>BazaarCo Nepal is not made to copy the old way of online selling.</p>
            <p>We are building a marketplace that feels closer to real shopping in Nepal.</p>
            <div className="bz-about__chips" style={{ margin: "var(--space-md) 0" }}>
              <span className="bz-about__chip">
                <Icon name="eye" size={16} />
                People here like to see the product properly.
              </span>
              <span className="bz-about__chip">
                <Icon name="message" size={16} />
                They like to ask questions.
              </span>
              <span className="bz-about__chip">
                <Icon name="tag" size={16} />
                They compare prices.
              </span>
              <span className="bz-about__chip">
                <Icon name="handshake" size={16} />
                They bargain.
              </span>
              <span className="bz-about__chip">
                <Icon name="shieldCheck" size={16} />
                They check trust before buying.
              </span>
            </div>
            <p>And when they order, they expect the product to match what they saw.</p>
            <p className="bz-about__center">
              <span className="bz-about__emph">BazaarCo Nepal respects that.</span>
            </p>
            <p>
              That is why we give importance to product videos, clear details, seller visibility,
              and a smoother buying process.
            </p>
            <div className="bz-about__iconrow">
              <div>
                <Icon name="video" size={20} />
                Product videos
              </div>
              <div>
                <Icon name="badgeCheck" size={20} />
                Clear details
              </div>
              <div>
                <Icon name="store" size={20} />
                Seller visibility
              </div>
              <div>
                <Icon name="sparkles" size={20} />A smoother buying process
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 — WHAT YOU SEE IS WHAT YOU GET (highlighted) */}
      <section className="container">
        <div className="bz-about__prose">
          <p>Buying online should not feel like a guessing game.</p>
          <p>A buyer should not have to wonder:</p>
          <div className="bz-about__chips" style={{ margin: "var(--space-md) 0" }}>
            <span className="bz-about__chip">&ldquo;Will this product look the same?&rdquo;</span>
            <span className="bz-about__chip">&ldquo;Is the quality actually good?&rdquo;</span>
            <span className="bz-about__chip">&ldquo;Is this seller genuine?&rdquo;</span>
            <span className="bz-about__chip">&ldquo;Will I regret this after delivery?&rdquo;</span>
          </div>
          <p>BazaarCo Nepal is built around a simple belief:</p>
          <p className="bz-about__belief">What you see should be what you get.</p>
          <p>
            Product videos help buyers understand the product better before placing an order. This
            makes shopping more honest, more visual, and more practical.
          </p>
        </div>
      </section>

      {/* 5 — FAIR FOR BUYERS, FAIR FOR SELLERS (cards) */}
      <section className="container">
        <SectionHead title="Fair for buyers. Fair for sellers." />
        <p className="bz-about__prose">
          A marketplace should not only look good from the outside. It should work well for the
          people using it.
        </p>
        <div className="bz-about__duo" style={{ marginTop: "var(--space-lg)" }}>
          <div className="bz-about__card">
            <div className="bz-about__card-head">
              <span className="bz-about__card-chip">
                <Icon name="cart" size={20} />
              </span>
              <span className="bz-about__card-title">For buyers</span>
            </div>
            <p>
              For buyers, BazaarCo Nepal means a better way to discover products, watch before
              buying, bargain when available, and order with more confidence.
            </p>
            <ul className="bz-about__list">
              <Bullet>discover products</Bullet>
              <Bullet>watch before buying</Bullet>
              <Bullet>bargain when available</Bullet>
              <Bullet>order with more confidence</Bullet>
            </ul>
          </div>
          <div className="bz-about__card">
            <div className="bz-about__card-head">
              <span className="bz-about__card-chip">
                <Icon name="store" size={20} />
              </span>
              <span className="bz-about__card-title">For sellers</span>
            </div>
            <p>
              For sellers, BazaarCo Nepal means a better way to show products, reach customers,
              manage interest, and grow without being squeezed by unnecessary pressure.
            </p>
            <ul className="bz-about__list">
              <Bullet>show products</Bullet>
              <Bullet>reach customers</Bullet>
              <Bullet>manage interest</Bullet>
              <Bullet>grow without being squeezed by unnecessary pressure</Bullet>
            </ul>
          </div>
        </div>
        <div className="bz-about__pair" style={{ marginTop: "var(--space-lg)" }}>
          <span>Sellers should not have to sell more just to earn less.</span>
          <span>Buyers should not have to buy with doubt and hope for the best.</span>
        </div>
        <div className="bz-about__center" style={{ marginTop: "var(--space-lg)" }}>
          <p>
            <span className="bz-about__emph">Both sides matter.</span>
          </p>
          <p>That is the kind of marketplace BazaarCo Nepal is building.</p>
        </div>
      </section>

      {/* 6 — BUILT FOR LOCAL SELLERS */}
      <section className="container">
        <div className="bz-about__prose">
          <SectionHead title="Built for local sellers and growing brands" />
          <p>
            Nepal has many hardworking sellers, small businesses, creators, home-based brands,
            Instagram stores, TikTok sellers, and local shops with great products.
          </p>
          <p>But many of them do not have a simple and trusted place to grow online.</p>
          <p>
            BazaarCo Nepal gives sellers a platform where they can present their products better,
            connect with more buyers, and build trust through videos and clear information.
          </p>
          <p className="bz-about__statement">
            We want local sellers to grow not just by giving bigger discounts, but by showing better
            products, better service, and better value.
          </p>
        </div>
      </section>

      {/* 7 — MADE FOR NEPALI SHOPPING HABITS */}
      <section className="container">
        <div className="bz-about__prose">
          <SectionHead title="Made for Nepali shopping habits" />
          <div className="bz-about__chips" style={{ marginBottom: "var(--space-md)" }}>
            <span className="bz-about__chip">
              <Icon name="handshake" size={16} />
              Bargaining is normal in Nepal.
            </span>
            <span className="bz-about__chip">
              <Icon name="eye" size={16} />
              Checking the product properly is normal.
            </span>
            <span className="bz-about__chip">
              <Icon name="message" size={16} />
              Asking questions before buying is normal.
            </span>
            <span className="bz-about__chip">
              <Icon name="store" size={16} />
              Buying from local sellers is normal.
            </span>
          </div>
          <p>BazaarCo Nepal does not want to remove these habits.</p>
          <p className="bz-about__statement">We want to make them easier online.</p>
          <p>
            Our platform is being built so buyers can see before they buy, sellers can show before
            they sell, and both sides can feel more comfortable before an order is placed.
          </p>
        </div>
      </section>

      {/* 8 — OUR MISSION (navy band) */}
      <section className="bz-band bz-band--watch">
        <div className="container">
          <h2 className="bz-about__mission-title">
            Our mission is to build a marketplace Nepal can trust.
          </h2>
          <ul className="bz-about__mgrid">
            <li>A place where buyers know what they are ordering.</li>
            <li>A place where sellers are treated with respect.</li>
            <li>A place where local businesses can grow.</li>
            <li>A place where online shopping feels modern, but still familiar.</li>
          </ul>
          <div className="bz-about__mission-close">
            <p>BazaarCo Nepal is more than a shopping website.</p>
            <p>
              <span className="bz-about__emph">It is a better way to buy and sell in Nepal.</span>
            </p>
          </div>
        </div>
      </section>

      {/* 9 — FINAL CTA (on cream, separates the two navy zones) */}
      <section className="container bz-about__cta">
        <h2 className="bz-about__cta-title">Welcome to BazaarCo Nepal.</h2>
        <CtaRow />
      </section>
    </div>
  );
}
