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
          className="mb-6 text-3xl font-light tracking-tight anim-fade-up"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          EVENTS
        </h1>

        {/* Tag filter */}
        {tags.length > 0 && (
          <div className="mb-6 -mx-5 px-5 anim-fade-up" style={{ animationDelay: "60ms" }}>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
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
                      className="h-14 w-14 rounded-full overflow-hidden transition-all duration-200"
                      style={{
                        border: `1.5px solid ${
                          isSelected ? "var(--accent)" : "var(--border)"
                        }`,
                        padding: isSelected ? "2px" : "0",
                      }}
                    >
                      {tag.imageUrl ? (
                        <img
                          src={tag.imageUrl}
                          alt={tag.name}
                          className="h-full w-full rounded-full object-contain"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center rounded-full text-[10px]"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {tag.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <span
                      className="text-[10px] max-w-[56px] truncate tracking-wide"
                      style={{
                        color: isSelected
                          ? "var(--accent)"
                          : "var(--text-muted)",
                        fontWeight: isSelected ? 500 : 400,
                      }}
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
          <p style={{ color: "var(--text-muted)" }} className="text-center text-sm">
            {selectedTagId
              ? "このタグのイベントはありません"
              : "現在公開中のイベントはありません"}
          </p>
        ) : (
          <div className="space-y-8">
            {groupEventsByDate(events).map(
              ({ label, sublabel, events: grouped }, index) => (
                <section
                  key={label}
                  className="anim-fade-up"
                  style={{ animationDelay: `${(index + 1) * 80}ms` }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex flex-col">
                      <span
                        className="text-xs font-medium uppercase tracking-widest"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {label}
                      </span>
                      {sublabel && (
                        <span
                          className="text-[10px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {sublabel}
                        </span>
                      )}
                    </div>
                    <div
                      className="h-px flex-1"
                      style={{ background: "var(--border)" }}
                    />
                    <span
                      className="text-[10px] tracking-widest uppercase"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {grouped.length}件
                    </span>
                  </div>
                  <div className="stagger-children space-y-3">
                    {grouped.map((event) => (
                      <EventCard key={event.id} {...event} />
                    ))}
                  </div>
                </section>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
