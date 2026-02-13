// Klaim Web Component 타입 선언
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "klaim-pricing-table": {
        "pricing-table-id": string;
        "success-url": string;
        "cancel-url": string;
        "user-email": string;
        "user-name": string;
      };
    }
  }
}

export {};
