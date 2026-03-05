"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface EventFormData {
  title: string;
  description: string;
  date: string;
  venue: string;
  address: string;
  imageUrl: string;
  isPublished: boolean;
  hasLottery: boolean;
}

interface TicketTypeFormData {
  id?: string;
  name: string;
  description: string;
  price: string;
  capacity: string;
}

interface LotteryPrizeFormData {
  id?: string;
  name: string;
  stock: string;
  requireRedeem: boolean;
}

interface TagOption {
  id: string;
  name: string;
  imageUrl: string | null;
}

interface Props {
  initialData?: EventFormData;
  initialTagIds?: string[];
  initialTicketTypes?: TicketTypeFormData[];
  initialLotteryPrizes?: LotteryPrizeFormData[];
  eventId?: string;
}

const defaultData: EventFormData = {
  title: "",
  description: "",
  date: "",
  venue: "",
  address: "",
  imageUrl: "",
  isPublished: false,
  hasLottery: false,
};

const defaultTicketType: TicketTypeFormData = {
  name: "一般",
  description: "",
  price: "",
  capacity: "",
};

const inputStyle = {
  background: "var(--admin-bg)",
  border: "1px solid var(--admin-border)",
  color: "var(--admin-text)",
};

export function AdminEventForm({ initialData, initialTagIds, initialTicketTypes, initialLotteryPrizes, eventId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<EventFormData>(initialData || defaultData);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeFormData[]>(
    initialTicketTypes && initialTicketTypes.length > 0 ? initialTicketTypes : [{ ...defaultTicketType }]
  );
  const [lotteryPrizes, setLotteryPrizes] = useState<LotteryPrizeFormData[]>(
    initialLotteryPrizes && initialLotteryPrizes.length > 0 ? initialLotteryPrizes : []
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds || []);
  const [allTags, setAllTags] = useState<TagOption[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!eventId;

  useEffect(() => {
    fetch("/api/admin/tags")
      .then((res) => res.json())
      .then((data) => setAllTags(data.tags || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isEdit
        ? `/api/admin/events/${eventId}`
        : "/api/admin/events";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: new Date(form.date).toISOString(),
          tagIds: selectedTagIds,
          ticketTypes: ticketTypes.map((tt, i) => ({
            ...(tt.id && { id: tt.id }),
            name: tt.name,
            description: tt.description || null,
            price: Number(tt.price),
            capacity: Number(tt.capacity),
            sortOrder: i,
          })),
          lotteryPrizes: lotteryPrizes.map((lp, i) => ({
            ...(lp.id && { id: lp.id }),
            name: lp.name,
            stock: Number(lp.stock),
            requireRedeem: lp.requireRedeem,
            sortOrder: i,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存に失敗しました");
        return;
      }

      router.push("/admin/events");
    } catch {
      setError("保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: keyof EventFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateTicketType = (index: number, field: keyof TicketTypeFormData, value: string) => {
    setTicketTypes((prev) =>
      prev.map((tt, i) => (i === index ? { ...tt, [field]: value } : tt))
    );
  };

  const addTicketType = () => {
    setTicketTypes((prev) => [...prev, { name: "", description: "", price: "", capacity: "" }]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length <= 1) return;
    setTicketTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLotteryPrize = (index: number, field: keyof LotteryPrizeFormData, value: string | boolean) => {
    setLotteryPrizes((prev) =>
      prev.map((lp, i) => (i === index ? { ...lp, [field]: value } : lp))
    );
  };

  const addLotteryPrize = () => {
    setLotteryPrizes((prev) => [...prev, { name: "", stock: "", requireRedeem: false }]);
  };

  const removeLotteryPrize = (index: number) => {
    setLotteryPrizes((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div>
        <label
          className="block text-[10px] uppercase tracking-widest font-medium mb-1.5"
          style={{ color: "var(--admin-muted)" }}
        >
          タイトル *
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
          style={inputStyle}
        />
      </div>

      <div>
        <label
          className="block text-[10px] uppercase tracking-widest font-medium mb-1.5"
          style={{ color: "var(--admin-muted)" }}
        >
          説明 *
        </label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          required
          rows={4}
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-[10px] uppercase tracking-widest font-medium mb-1.5"
            style={{ color: "var(--admin-muted)" }}
          >
            開催日時 *
          </label>
          <input
            type="datetime-local"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={inputStyle}
          />
        </div>
        <div>
          <label
            className="block text-[10px] uppercase tracking-widest font-medium mb-1.5"
            style={{ color: "var(--admin-muted)" }}
          >
            会場 *
          </label>
          <input
            type="text"
            value={form.venue}
            onChange={(e) => update("venue", e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label
          className="block text-[10px] uppercase tracking-widest font-medium mb-1.5"
          style={{ color: "var(--admin-muted)" }}
        >
          住所
        </label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
          style={inputStyle}
        />
      </div>

      <div>
        <label
          className="block text-[10px] uppercase tracking-widest font-medium mb-1.5"
          style={{ color: "var(--admin-muted)" }}
        >
          画像URL
        </label>
        <input
          type="url"
          value={form.imageUrl}
          onChange={(e) => update("imageUrl", e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
          style={inputStyle}
        />
      </div>

      {/* Ticket Types */}
      <div>
        <label
          className="block text-[10px] uppercase tracking-widest font-medium mb-2"
          style={{ color: "var(--admin-muted)" }}
        >
          チケット種別 *
        </label>
        <div className="space-y-3">
          {ticketTypes.map((tt, index) => (
            <div
              key={index}
              className="rounded-lg p-3"
              style={{
                background: "var(--admin-bg)",
                border: "1px solid var(--admin-border)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[10px] uppercase tracking-widest font-medium"
                  style={{ color: "var(--admin-muted)" }}
                >
                  種別 {index + 1}
                </span>
                {ticketTypes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTicketType(index)}
                    className="text-xs"
                    style={{ color: "var(--error)" }}
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  value={tt.name}
                  onChange={(e) => updateTicketType(index, "name", e.target.value)}
                  placeholder="種別名（例: 一般）"
                  required
                  className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{
                    background: "var(--admin-surface)",
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)",
                  }}
                />
                <input
                  type="text"
                  value={tt.description}
                  onChange={(e) => updateTicketType(index, "description", e.target.value)}
                  placeholder="説明（任意）"
                  className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{
                    background: "var(--admin-surface)",
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)",
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={tt.price}
                  onChange={(e) => updateTicketType(index, "price", e.target.value)}
                  placeholder="価格（円）"
                  required
                  min="0"
                  className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{
                    background: "var(--admin-surface)",
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)",
                  }}
                />
                <input
                  type="number"
                  value={tt.capacity}
                  onChange={(e) => updateTicketType(index, "capacity", e.target.value)}
                  placeholder="定員"
                  required
                  min="1"
                  className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{
                    background: "var(--admin-surface)",
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTicketType}
          className="mt-2 text-sm hover:underline"
          style={{ color: "var(--admin-text)" }}
        >
          + チケット種別を追加
        </button>
      </div>

      {/* Lottery */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id="hasLottery"
            checked={form.hasLottery}
            onChange={(e) => update("hasLottery", e.target.checked)}
            className="h-4 w-4 rounded"
            style={{ accentColor: "var(--admin-text)" }}
          />
          <label
            htmlFor="hasLottery"
            className="text-sm font-medium"
            style={{ color: "var(--admin-text)" }}
          >
            無料抽選を有効にする
          </label>
        </div>

        {form.hasLottery && lotteryPrizes.length > 0 && (
          <div className="space-y-3">
            {lotteryPrizes.map((lp, index) => (
              <div
                key={index}
                className="rounded-lg p-3"
                style={{
                  background: "var(--admin-bg)",
                  border: "1px solid var(--admin-border)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] uppercase tracking-widest font-medium"
                    style={{ color: "var(--admin-muted)" }}
                  >
                    景品 {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLotteryPrize(index)}
                    className="text-xs"
                    style={{ color: "var(--error)" }}
                  >
                    削除
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={lp.name}
                    onChange={(e) => updateLotteryPrize(index, "name", e.target.value)}
                    placeholder="景品名"
                    required
                    className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{
                      background: "var(--admin-surface)",
                      border: "1px solid var(--admin-border)",
                      color: "var(--admin-text)",
                    }}
                  />
                  <input
                    type="number"
                    value={lp.stock}
                    onChange={(e) => updateLotteryPrize(index, "stock", e.target.value)}
                    placeholder="在庫数"
                    required
                    min="1"
                    className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{
                      background: "var(--admin-surface)",
                      border: "1px solid var(--admin-border)",
                      color: "var(--admin-text)",
                    }}
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={lp.requireRedeem}
                    onChange={(e) => updateLotteryPrize(index, "requireRedeem", e.target.checked)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: "var(--admin-text)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--admin-muted)" }}>引き換えが必要</span>
                </label>
              </div>
            ))}
          </div>
        )}
        {form.hasLottery && (
          <button
            type="button"
            onClick={addLotteryPrize}
            className="mt-2 text-sm hover:underline"
            style={{ color: "var(--admin-text)" }}
          >
            + 景品を追加
          </button>
        )}
      </div>

      {allTags.length > 0 && (
        <div>
          <label
            className="block text-[10px] uppercase tracking-widest font-medium mb-2"
            style={{ color: "var(--admin-muted)" }}
          >
            タグ
          </label>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setSelectedTagIds((prev) =>
                      isSelected
                        ? prev.filter((id) => id !== tag.id)
                        : [...prev, tag.id]
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors active:scale-[0.97]"
                  style={{
                    background: isSelected ? "var(--accent-glow)" : "var(--admin-surface)",
                    border: `1px solid ${isSelected ? "var(--accent)" : "var(--admin-border)"}`,
                    color: isSelected ? "var(--accent)" : "var(--admin-text)",
                  }}
                >
                  {tag.imageUrl && (
                    <img
                      src={tag.imageUrl}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  )}
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublished"
          checked={form.isPublished}
          onChange={(e) => update("isPublished", e.target.checked)}
          className="h-4 w-4 rounded"
          style={{ accentColor: "var(--admin-text)" }}
        />
        <label htmlFor="isPublished" className="text-sm" style={{ color: "var(--admin-text)" }}>
          公開する
        </label>
      </div>

      {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-lg font-medium transition-all active:scale-[0.97] disabled:opacity-50"
          style={{
            background: "var(--admin-accent)",
            color: "var(--admin-surface)",
          }}
        >
          {loading ? "保存中..." : isEdit ? "更新" : "作成"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/events")}
          className="px-6 py-2 rounded-lg transition-all active:scale-[0.97]"
          style={{
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text)",
          }}
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
