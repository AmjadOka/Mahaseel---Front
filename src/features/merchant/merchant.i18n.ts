import { defineDict } from "@/lib/i18n/translate";

export default defineDict({
  ar: {
    navLabel: "لوحة التاجر",
    orders: "الطلبات",
    products: "المنتجات",
    farms: "المزارع",
    wallet: "المحفظة",
    bank: "الحسابات البنكية",
    merchantsOnly: "هذه المنطقة للتجار فقط",
    merchantsOnlyHint: "يمكنك طلب الترقية إلى تاجر من صفحة حسابك، وتوافق عليها الإدارة.",
    toAccount: "الذهاب إلى حسابي",
    loadFailed: "تعذّر تحميل حسابك.",
  },
  en: {
    navLabel: "Merchant dashboard",
    orders: "Orders",
    products: "Products",
    farms: "Farms",
    wallet: "Wallet",
    bank: "Bank accounts",
    merchantsOnly: "This area is for merchants only",
    merchantsOnlyHint: "You can request an upgrade to merchant from your account page; the platform reviews it.",
    toAccount: "Go to my account",
    loadFailed: "We couldn't load your account.",
  },
});
