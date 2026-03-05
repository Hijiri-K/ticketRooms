"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiff } from "@/components/liff-provider";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

export default function RegisterPage() {
  const { accessToken } = useLiff();
  const router = useRouter();
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ birthday, gender, prefecture }),
    });

    if (!res.ok) {
      setError("登録に失敗しました。再度お試しください。");
      setSubmitting(false);
      return;
    }

    router.push("/events");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">会員登録</h1>
        <p className="mb-6 text-sm text-gray-500">
          以下の情報を入力してください
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              生年月日
            </label>
            <input
              type="date"
              required
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              性別
            </label>
            <div className="flex gap-3">
              {[
                { value: "male", label: "男性" },
                { value: "female", label: "女性" },
                { value: "other", label: "その他" },
                { value: "no_answer", label: "回答しない" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex-1 cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm transition-colors ${
                    gender === option.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={gender === option.value}
                    onChange={(e) => setGender(e.target.value)}
                    className="sr-only"
                    required
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              都道府県
            </label>
            <select
              required
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              {PREFECTURES.map((pref) => (
                <option key={pref} value={pref}>
                  {pref}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "登録中..." : "登録する"}
          </button>
        </form>
      </div>
    </div>
  );
}
