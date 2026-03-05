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

  return (
    <Link href={`/events/${id}`} className="block">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        {imageUrl && (
          <div className="aspect-video w-full overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="p-4">
          {hasLottery && (
            <span className="mb-1 inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">
              無料抽選あり
            </span>
          )}
          <h3 className="mb-1 text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mb-1 text-sm text-gray-500">
            {format(eventDate, "yyyy年M月d日(E) HH:mm", { locale: ja })}
          </p>
          <p className="mb-3 text-sm text-gray-500">{venue}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">
              ¥{minPrice.toLocaleString()}〜
            </span>
            {isSoldOut ? (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                SOLD OUT
              </span>
            ) : (
              <span className="text-sm text-gray-500">
                残り {remaining} 枚
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
