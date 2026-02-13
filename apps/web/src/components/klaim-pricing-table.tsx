"use client";

import { useEffect } from "react";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function KlaimPricingTable() {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://embed.klaim.me/v3.bundle.js";
    s.async = true;
    document.head.appendChild(s);

    return () => {
      const existing = document.querySelector('script[src="https://embed.klaim.me/v3.bundle.js"]');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    };
  }, []);

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Klaim Web Component는 런타임에 동적으로 로드됩니다
    <klaim-pricing-table
      pricing-table-id="wigvu/26FsTsndarXOjf437I9u"
      success-url={`${appUrl}/payment/success`}
      cancel-url={`${appUrl}/payment/cancel`}
      user-email="example@example.com"
      user-name="John Doe"
    />
  );
}
