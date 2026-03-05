"use client";

import { useEffect, useState } from "react";

interface Tag {
  id: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", imageUrl: "", sortOrder: "0" });
  const [saving, setSaving] = useState(false);

  const fetchTags = () => {
    fetch("/api/admin/tags")
      .then((res) => res.json())
      .then((data) => setTags(data.tags))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const resetForm = () => {
    setForm({ name: "", imageUrl: "", sortOrder: "0" });
    setEditingId(null);
  };

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setForm({
      name: tag.name,
      imageUrl: tag.imageUrl || "",
      sortOrder: String(tag.sortOrder),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    try {
      const body = {
        name: form.name.trim(),
        imageUrl: form.imageUrl.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingId) {
        await fetch(`/api/admin/tags/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/admin/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      resetForm();
      fetchTags();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このタグを削除しますか？")) return;
    await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
    fetchTags();
  };

  if (loading) {
    return <p style={{ color: "var(--admin-muted)" }}>読み込み中...</p>;
  }

  return (
    <div>
      <h2
        className="text-xl md:text-2xl font-bold mb-6"
        style={{ color: "var(--admin-text)" }}
      >
        タグ管理
      </h2>

      {/* Create / Edit form */}
      <div
        className="rounded-lg p-4 mb-6"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <h3
          className="text-[10px] uppercase tracking-widest font-medium mb-3"
          style={{ color: "var(--admin-muted)" }}
        >
          {editingId ? "タグを編集" : "新しいタグを作成"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label
                className="block text-[10px] uppercase tracking-widest font-medium mb-1"
                style={{ color: "var(--admin-muted)" }}
              >
                タグ名 *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例: 音楽"
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{
                  background: "var(--admin-bg)",
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)",
                }}
                required
              />
            </div>
            <div>
              <label
                className="block text-[10px] uppercase tracking-widest font-medium mb-1"
                style={{ color: "var(--admin-muted)" }}
              >
                画像URL
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{
                  background: "var(--admin-bg)",
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)",
                }}
              />
            </div>
            <div>
              <label
                className="block text-[10px] uppercase tracking-widest font-medium mb-1"
                style={{ color: "var(--admin-muted)" }}
              >
                並び順
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{
                  background: "var(--admin-bg)",
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)",
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: "var(--admin-accent)",
                color: "var(--admin-surface)",
              }}
            >
              {saving
                ? "保存中..."
                : editingId
                  ? "更新"
                  : "作成"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-sm transition-all active:scale-[0.97]"
                style={{
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)",
                }}
              >
                キャンセル
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tag list */}
      {tags.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--admin-muted)" }}>タグはまだありません</p>
      ) : (
        <div
          className="rounded-lg"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
          }}
        >
          {/* Mobile: cards */}
          <div className="md:hidden" style={{ borderColor: "var(--admin-border)" }}>
            {tags.map((tag, i) => (
              <div
                key={tag.id}
                className="p-4"
                style={i > 0 ? { borderTop: "1px solid var(--admin-border)" } : undefined}
              >
                <div className="flex items-center gap-3 mb-2">
                  {tag.imageUrl ? (
                    <img
                      src={tag.imageUrl}
                      alt={tag.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-xs"
                      style={{ background: "var(--admin-bg)", color: "var(--admin-muted)" }}
                    >
                      No img
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>
                      {tag.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--admin-muted)" }}>
                      並び順: {tag.sortOrder}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(tag)}
                    className="text-xs hover:underline"
                    style={{ color: "var(--admin-text)" }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="text-xs hover:underline"
                    style={{ color: "var(--error)" }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <table className="w-full hidden md:table">
            <thead>
              <tr
                className="text-left text-[10px] uppercase tracking-widest font-medium"
                style={{
                  color: "var(--admin-muted)",
                  borderBottom: "1px solid var(--admin-border)",
                }}
              >
                <th className="px-4 py-3">画像</th>
                <th className="px-4 py-3">タグ名</th>
                <th className="px-4 py-3">並び順</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr
                  key={tag.id}
                  className="text-sm transition-colors"
                  style={{ borderBottom: "1px solid var(--admin-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--admin-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-4 py-3">
                    {tag.imageUrl ? (
                      <img
                        src={tag.imageUrl}
                        alt={tag.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-xs"
                        style={{ background: "var(--admin-bg)", color: "var(--admin-muted)" }}
                      >
                        No img
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--admin-text)" }}>{tag.name}</td>
                  <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>{tag.sortOrder}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => startEdit(tag)}
                      className="hover:underline text-sm mr-3"
                      style={{ color: "var(--admin-text)" }}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="hover:underline text-sm"
                      style={{ color: "var(--error)" }}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
