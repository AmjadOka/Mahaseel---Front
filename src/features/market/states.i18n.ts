import { defineDict } from "@/lib/i18n/translate";

export default defineDict({
  ar: {
    errorTitle: "تعذّر تحميل السوق",
    errorText: "تعذّر الاتصال بالخادم. تحقق من الاتصال ثم أعد المحاولة.",
    retry: "إعادة المحاولة",
    notFoundTitle: "المنتج غير متوفر",
    notFoundText: "ربما بيع هذا المنتج أو أُزيل من السوق.",
    back: "العودة إلى السوق",
  },
  en: {
    errorTitle: "Couldn't load the market",
    errorText: "We couldn't reach the server. Check your connection and try again.",
    retry: "Try again",
    notFoundTitle: "Product unavailable",
    notFoundText: "This product may have been sold or removed from the market.",
    back: "Back to the market",
  },
});
