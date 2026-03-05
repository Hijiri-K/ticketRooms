"use client";

import { useEffect, useState, useCallback } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { ja } from "date-fns/locale";
import { EventCard } from "@/components/event-card";

interface Tag {
  id: string;
  name: string;
  imageUrl: string | null;
}

interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  minPrice: number;
  totalCapacity: number;
  totalSold: number;
  imageUrl: string | null;
  hasLottery: boolean;
}

interface DateGroup {
  label: string;
  sublabel: string | null;
  events: Event[];
}

function groupEventsByDate(events: Event[]): DateGroup[] {
  const groups: Map<string, DateGroup> = new Map();

  for (const event of events) {
    const d = new Date(event.date);
    const key = format(d, "yyyy-MM-dd");

    if (!groups.has(key)) {
      let label: string;
      let sublabel: string | null = null;

      if (isToday(d)) {
        label = "TODAY";
        sublabel = format(d, "M月d日(E)", { locale: ja });
      } else if (isTomorrow(d)) {
        label = "TOMORROW";
        sublabel = format(d, "M月d日(E)", { locale: ja });
      } else {
        label = format(d, "M月d日(E)", { locale: ja });
        sublabel = null;
      }

      groups.set(key, { label, sublabel, events: [] });
    }

    groups.get(key)!.events.push(event);
  }

  return Array.from(groups.values());
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback((tagId: string | null) => {
    const url = tagId ? `/api/events?tagId=${tagId}` : "/api/events";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setEvents(data.events))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => setTags(data.tags || []));
    fetchEvents(null);
  }, [fetchEvents]);

  const handleTagSelect = (tagId: string | null) => {
    setSelectedTagId(tagId);
    setLoading(true);
    fetchEvents(tagId);
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">イベント</h1>

        {/* Tag filter */}
        {tags.length > 0 && (
          <div className="mb-4 -mx-4 px-4">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => handleTagSelect(null)}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-colors ${
                    selectedTagId === null
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-gray-100"
                  }`}
                >
                  <span className="text-lg">ALL</span>
                </div>
                <span
                  className={`text-xs ${
                    selectedTagId === null
                      ? "font-bold text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  すべて
                </span>
              </button>
              {tags.map((tag) => {
                const isSelected = selectedTagId === tag.id;
                return (
                  <button
                    key={tag.id}
                    onClick={() =>
                      handleTagSelect(isSelected ? null : tag.id)
                    }
                    className="flex flex-col items-center gap-1 flex-shrink-0"
                  >
                    <div
                      className={`h-16 w-16 rounded-full border-2 overflow-hidden transition-colors ${
                        isSelected
                          ? "border-blue-500"
                          : "border-transparent"
                      }`}
                      style={{ padding: isSelected ? "2px" : "0" }}
                    >
                      {tag.imageUrl ? (
                        <img
                          src={tag.imageUrl}
                          alt={tag.name}
                          className="h-full w-full rounded-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-gray-500 text-xs">
                          {tag.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs max-w-[64px] truncate ${
                        isSelected
                          ? "font-bold text-gray-900"
                          : "text-gray-500"
                      }`}
                    >
                      {tag.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {events.length === 0 ? (
          <p className="text-center text-gray-500">
            {selectedTagId
              ? "このタグのイベントはありません"
              : "現在公開中のイベントはありません"}
          </p>
        ) : (
          <div className="space-y-6">
            {groupEventsByDate(events).map(({ label, sublabel, events: grouped }) => (
              <section key={label}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-gray-900">
                      {label}
                    </span>
                    {sublabel && (
                      <span className="text-xs text-gray-400">{sublabel}</span>
                    )}
                  </div>
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs text-gray-400">
                    {grouped.length}件
                  </span>
                </div>
                <div className="space-y-3">
                  {grouped.map((event) => (
                    <EventCard key={event.id} {...event} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
