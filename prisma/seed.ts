import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const eventsData = [
    {
      title: "Summer Music Festival 2026",
      description:
        "真夏の野外音楽フェスティバル。人気アーティストが多数出演します。フード・ドリンクブースも充実。",
      date: new Date("2026-08-15T12:00:00+09:00"),
      venue: "代々木公園イベント広場",
      address: "東京都渋谷区代々木神園町2-1",
      isPublished: true,
      ticketTypes: [
        { name: "一般チケット", price: 5000, capacity: 500 },
      ],
    },
    {
      title: "Tech Conference Tokyo",
      description:
        "最新のWeb技術トレンドを学べるカンファレンス。AI、クラウド、フロントエンド開発のセッションが盛りだくさん。",
      date: new Date("2026-09-20T10:00:00+09:00"),
      venue: "東京国際フォーラム ホールB",
      address: "東京都千代田区丸の内3-5-1",
      isPublished: true,
      ticketTypes: [
        { name: "一般チケット", price: 3000, capacity: 300 },
      ],
    },
    {
      title: "アート展覧会 - 現代の息吹",
      description:
        "若手アーティストによる現代アート展覧会。絵画、彫刻、インスタレーションなど多彩な作品を展示。",
      date: new Date("2026-10-01T11:00:00+09:00"),
      venue: "六本木ヒルズ 森美術館",
      address: "東京都港区六本木6-10-1",
      isPublished: true,
      ticketTypes: [
        { name: "一般チケット", price: 1500, capacity: 200 },
      ],
    },
    {
      title: "ヨガ＆ウェルネスワークショップ",
      description:
        "初心者から上級者まで楽しめるヨガワークショップ。瞑想セッションや健康的な軽食も提供します。",
      date: new Date("2026-07-10T09:00:00+09:00"),
      venue: "目黒区民センター",
      address: "東京都目黒区目黒2-4-36",
      isPublished: true,
      ticketTypes: [
        { name: "一般チケット", price: 2000, capacity: 50 },
      ],
    },
  ];

  for (const { ticketTypes, ...eventData } of eventsData) {
    const event = await prisma.event.create({ data: eventData });
    await prisma.ticketType.createMany({
      data: ticketTypes.map((tt) => ({ ...tt, eventId: event.id })),
    });
  }

  console.log(`Created ${eventsData.length} events with ticket types`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
