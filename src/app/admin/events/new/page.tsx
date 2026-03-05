"use client";

import { AdminEventForm } from "@/components/admin-event-form";

export default function AdminNewEventPage() {
  return (
    <div>
      <h2
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--admin-text)" }}
      >
        イベント新規作成
      </h2>
      <AdminEventForm />
    </div>
  );
}
