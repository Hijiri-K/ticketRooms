"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "エラーが発生しました");
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/tickets?success=true`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "決済に失敗しました");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-lg px-4 py-3 font-medium transition-all active:scale-[0.97] disabled:opacity-50"
        style={{
          background: "var(--accent)",
          color: "var(--btn-on-accent)",
        }}
      >
        {processing ? "処理中..." : "支払う"}
      </button>
    </form>
  );
}
