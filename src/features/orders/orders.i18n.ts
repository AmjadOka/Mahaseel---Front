import { defineDict } from "@/lib/i18n/translate";

export default defineDict({
  ar: {
    metaTitle: "طلباتي | محاصيل",
    title: "طلباتي",
    subtitle: "تابع طلباتك وادفع وأكّد الاستلام من هنا.",
    empty: "لا توجد طلبات بعد",
    emptyHint: "عندما تطلب منتجًا من السوق سيظهر هنا.",
    browse: "تصفّح السوق",
    placedOn: "بتاريخ {date}",
    buyersOnly: "هذه الصفحة لحسابات المشترين فقط.",
    loadError: "تعذّر تحميل طلباتك.",
    retry: "إعادة المحاولة",
    deletedProduct: "منتج غير متوفر",
  },
  en: {
    metaTitle: "My orders | Mahaseel",
    title: "My orders",
    subtitle: "Follow your orders, pay and confirm receipt from here.",
    empty: "No orders yet",
    emptyHint: "When you order a product from the market it will appear here.",
    browse: "Browse the market",
    placedOn: "Placed {date}",
    buyersOnly: "This page is for buyer accounts only.",
    loadError: "We couldn't load your orders.",
    retry: "Try again",
    deletedProduct: "Product unavailable",
  },
});
