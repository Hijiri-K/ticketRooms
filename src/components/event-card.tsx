import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  venue: string;
  minPrice: number;
  totalCapacity: number;
  totalSold: number;
  imageUrl: string | null;
  hasLottery?: boolean;
}

export function EventCard({
  id,
  title,
  date,
  venue,
  minPrice,
  totalCapacity,
  totalSold,
  imageUrl,
  hasLottery,
}: EventCardProps) {
  const remaining = totalCapacity - totalSold;
  const isSoldOut = remaining <= 0;
  const eventDate = new Date(date);
  const soldPercent =
    totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;

  return (
    <Link href={`/events/${id}`} className="block group">
      <article
        className="overflow-hidden rounded-2xl transition-all duration-300 ease-out group-hover:translate-y-[-2px]"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        {imageUrl ? (
          <div className="relative aspect-[16/7] w-full overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.55) 100%)",
              }}
            />
            {hasLottery && (
              <span
                className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest"
                style={{
                  background: "var(--lottery-badge-bg)",
                  border: "1px solid var(--lottery-badge-border)",
                  color: "var(--accent)",
                  backdropFilter: "blur(8px)",
                }}
              >
                無料抽選
              </span>
            )}
          </div>
        ) : (
          <div
            className="relative aspect-[16/7] w-full overflow-hidden"
            style={{
              background: "var(--no-image-gradient)",
            }}
          >
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute left-0 top-1/2 h-px w-full"
                style={{ background: "var(--accent)" }}
              />
              <div
                className="absolute left-1/3 top-0 h-full w-px"
                style={{ background: "var(--accent)" }}
              />
            </div>
            {hasLottery && (
              <span
                className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest"
                style={{
                  background: "var(--lottery-badge-bg)",
                  border: "1px solid var(--lottery-badge-border)",
                  color: "var(--accent)",
                }}
              >
                無料抽選
              </span>
            )}
          </div>
        )}

        <div className="p-4">
          <h3
            className="mb-1.5 text-base font-semibold leading-snug"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>

          <p
            className="mb-0.5 text-xs font-light tracking-wide"
            style={{ color: "var(--text-secondary)" }}
          >
            {format(eventDate, "yyyy年M月d日(E) HH:mm", { locale: ja })}
          </p>

          <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
            {venue}
          </p>

          <div className="flex items-end justify-between">
            <div>
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                FROM
              </p>
              <p
                className="text-xl font-light"
                style={{ color: "var(--accent)" }}
              >
                ¥{minPrice.toLocaleString()}
              </p>
            </div>

            {isSoldOut ? (
              <span
                className="rounded-sm px-3 py-1 text-[10px] font-medium uppercase tracking-widest"
                style={{
                  background: "var(--error-dim)",
                  color: "var(--error)",
                  border: "1px solid rgba(224,92,92,0.2)",
                }}
              >
                SOLD OUT
              </span>
            ) : (
              <div className="text-right">
                <div
                  className="mb-1 h-px w-20 overflow-hidden rounded-full"
                  style={{ background: "var(--border)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${soldPercent}%`,
                      background:
                        soldPercent > 80 ? "var(--error)" : "var(--accent)",
                    }}
                  />
                </div>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  残り {remaining} 枚
                </p>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
