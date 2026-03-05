"use client";

import { AdminEventForm } from "@/components/admin-event-form";

export default function AdminNewEventPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        イベント新規作成
      </h2>
      <AdminEventForm />
    </div>
  );
}
