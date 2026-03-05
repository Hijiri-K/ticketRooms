"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";
import { useLiff } from "@/components/liff-provider";
import { CheckoutForm } from "@/components/checkout-form";

export default function CheckoutPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();
  const ticketTypeId = searchParams.get("ticketTypeId");
  const { accessToken } = useLiff();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [ticketTypeName, setTicketTypeName] = useState("");
  const [ticketTypePrice, setTicketTypePrice] = useState(0);

  useEffect(() => {
    if (!accessToken || !ticketTypeId) return;

    fetch(`/api/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.event) {
          setEventTitle(data.event.title);
          const tt = data.event.ticketTypes?.find(
            (t: { id: string }) => t.id === ticketTypeId
          );
          if (tt) {
            setTicketTypeName(tt.name);
            setTicketTypePrice(tt.price);
          }
        }
      });

    fetch("/api/payments/create-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ eventId, ticketTypeId }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(d));
        return res.json();
      })
      .then((data) => setClientSecret(data.clientSecret))
      .catch((err) => setError(err.error ?? "エラーが発生しました"));
  }, [accessToken, eventId, ticketTypeId]);

  if (!ticketTypeId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p style={{ color: "var(--error)" }}>チケット種別が指定されていません</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p style={{ color: "var(--error)" }}>{error}</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-6 w-6 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "var(--accent)",
            animation: "spin-slow 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-md">
        <h1
          className="mb-1 text-2xl font-light tracking-tight anim-fade-up"
          style={{ color: "var(--text-primary)" }}
        >
          CHECKOUT
        </h1>
        <p
          className="mb-1 text-sm font-light"
          style={{ color: "var(--text-secondary)" }}
        >
          {eventTitle}
        </p>
        <p className="mb-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {ticketTypeName}
        </p>
        <p
          className="mb-6 text-xl font-light"
          style={{ color: "var(--accent)" }}
        >
          ¥{ticketTypePrice.toLocaleString()}
        </p>

        <div
          className="rounded-2xl p-5 anim-fade-up"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            animationDelay: "100ms",
          }}
        >
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              locale: "ja",
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#b8943f",
                  colorBackground: "#ffffff",
                  colorText: "#1a1a1c",
                  colorDanger: "#e05c5c",
                  borderRadius: "12px",
                },
              },
            }}
          >
            <CheckoutForm />
          </Elements>
        </div>
      </div>
    </div>
  );
}
