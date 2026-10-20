import { defineDict } from "@/lib/i18n/translate";

export default defineDict({
  ar: {
    PENDING: "بانتظار التاجر",
    AWAITING_PAYMENT: "بانتظار الدفع",
    ACCEPTED: "تم الدفع",
    REJECTED: "مرفوض",
    CANCELLED: "ملغي",
    COMPLETED: "مكتمل",
    REFUNDED: "مسترد",
    PREPARING: "قيد التجهيز",
    IN_DELIVERY: "في الطريق",
    READY_PICKUP: "جاهز للاستلام",
    DELIVERED: "تم التسليم",
    UNKNOWN: "غير معروف",
  },
  en: {
    PENDING: "Waiting for merchant",
    AWAITING_PAYMENT: "Awaiting payment",
    ACCEPTED: "Paid",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
    REFUNDED: "Refunded",
    PREPARING: "Preparing",
    IN_DELIVERY: "On the way",
    READY_PICKUP: "Ready for pickup",
    DELIVERED: "Delivered",
    UNKNOWN: "Unknown",
  },
});
