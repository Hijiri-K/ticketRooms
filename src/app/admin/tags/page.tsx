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
    return <p className="text-gray-500">読み込み中...</p>;
  }

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
        タグ管理
      </h2>

      {/* Create / Edit form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">
          {editingId ? "タグを編集" : "新しいタグを作成"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                タグ名 *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例: 音楽"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                画像URL
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                並び順
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
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
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                キャンセル
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tag list */}
      {tags.length === 0 ? (
        <p className="text-gray-500 text-sm">タグはまだありません</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Mobile: cards */}
          <div className="divide-y divide-gray-100 md:hidden">
            {tags.map((tag) => (
              <div key={tag.id} className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  {tag.imageUrl ? (
                    <img
                      src={tag.imageUrl}
                      alt={tag.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                      No img
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tag.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      並び順: {tag.sortOrder}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(tag)}
                    className="text-xs text-blue-600"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="text-xs text-red-600"
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
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
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
                  className="border-b border-gray-50 text-sm"
                >
                  <td className="px-4 py-3">
                    {tag.imageUrl ? (
                      <img
                        src={tag.imageUrl}
                        alt={tag.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{tag.name}</td>
                  <td className="px-4 py-3 text-gray-500">{tag.sortOrder}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => startEdit(tag)}
                      className="text-blue-600 hover:underline text-sm mr-3"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="text-red-600 hover:underline text-sm"
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
