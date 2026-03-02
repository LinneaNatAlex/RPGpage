import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./VipPage.module.css";

const STRIPE_PRICING_TABLE_ID = "prctbl_1T6K5F3a0JoGmOy7kRY0DFWb";
const STRIPE_PUBLISHABLE_KEY = "pk_live_51S8iq83a0JoGmOy7JzoNKHc24b4S9zdTivz6t0UylhDaWXPJkKrVOjgjwPts1aJdRjCkNVbEk4AILnnCLcXVeUjm005rQHMGt3";

export default function VipPage() {
  const stripeRef = useRef(null);

  useEffect(() => {
    if (!stripeRef.current) return;
    const loadStripe = () => {
      const el = document.createElement("stripe-pricing-table");
      el.setAttribute("pricing-table-id", STRIPE_PRICING_TABLE_ID);
      el.setAttribute("publishable-key", STRIPE_PUBLISHABLE_KEY);
      stripeRef.current.innerHTML = "";
      stripeRef.current.appendChild(el);
    };
    const existing = document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]');
    if (existing) {
      loadStripe();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    script.onload = loadStripe;
    document.body.appendChild(script);
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <Link to="/" className={styles.backLink}>
          ← Back to home
        </Link>
        <h1 className={styles.title}>VIP Membership</h1>
        <p className={styles.subtitle}>
          Get exclusive access and support the community. VIP is registered manually by an admin.
        </p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>VIP benefits</h2>
          <ul className={styles.benefitsList}>
            <li>Unlimited private messages</li>
            <li>Create and manage group chats</li>
            <li>Use emojis in chat</li>
            <li>Exclusive perks and recognition in the community</li>
            <li>Support the continued development of Arcane School</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Important information</h2>
          <p className={styles.disclaimer}>
            Parents and users under 16 must have parental permission before purchasing. VIP membership is purchased <strong>monthly</strong>; you need to renew each month to keep exclusive access.
          </p>
        </section>

        <div className={styles.noticeBox} role="alert">
          <strong>Processing time:</strong> It can take <strong>1 to 3 business days</strong> before your VIP status is active. Membership is registered manually by an admin after your payment.
        </div>

        <div className={styles.characterNameNotice} role="alert">
          <strong>When you pay:</strong> Please enter your character's <strong>full name</strong> in the payment form (e.g. in the name or note field) so we can assign VIP to the correct account.
        </div>

        <div ref={stripeRef} className={styles.stripeWrapper} />
      </div>
    </div>
  );
}
