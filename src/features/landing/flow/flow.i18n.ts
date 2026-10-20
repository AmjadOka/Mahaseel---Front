import { defineDict } from "@/lib/i18n/translate";

export default defineDict({
  ar: {
    title: "من الطلب إلى الاستلام",
    body: "ما يحدث بعد أن تضغط «اطلب»، وكيف يبقى مبلغك محميًا في كل خطوة.",
    s1: "تطلب",
    d1: "تختار المنتج وتطلبه بسعر ثابت، أو يُحسم لك مزاد فزت به.",
    s2: "التاجر يقبل",
    d2: "عند القبول يصلك رابط الدفع بالبريد وفي الإشعارات، وتدفع بالبطاقة.",
    s3: "يصلك الطلب",
    d3: "يحدّث التاجر حالة التوصيل خطوة بخطوة حتى التسليم.",
    s4: "تؤكد الاستلام",
    d4: "عندها فقط يصبح المبلغ متاحًا للتاجر للسحب، بعد خصم عمولة المنصة.",
    note: "الطلب الذي لا يُدفع خلال 24 ساعة من القبول يُلغى تلقائيًا.",
  },
  en: {
    title: "From order to doorstep",
    body: "What happens after you press order, and how your money stays protected at each step.",
    s1: "You order",
    d1: "Pick a product and order at a fixed price, or settle an auction you won.",
    s2: "The merchant accepts",
    d2: "On acceptance you get a payment link by email and in your notifications, and pay by card.",
    s3: "It arrives",
    d3: "The merchant updates the delivery status step by step until it's handed over.",
    s4: "You confirm receipt",
    d4: "Only then does the amount become available for the merchant to withdraw, after the platform fee.",
    note: "An order that isn't paid within 24 hours of acceptance is cancelled automatically.",
  },
});
