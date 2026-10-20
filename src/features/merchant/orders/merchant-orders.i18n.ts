import { defineDict } from "@/lib/i18n/translate";

export default defineDict({
  ar: {
    metaTitle: "طلبات التاجر | محاصيل",
    title: "الطلبات الواردة",
    sub: "اقبل الطلبات أو ارفضها، وحدّث حالة التوصيل.",
    empty: "لا توجد طلبات واردة بعد",
    emptyHint: "ستظهر هنا الطلبات التي يرسلها المشترون على منتجاتك.",
    buyer: "المشتري",
    qty: "الكمية",
    total: "الإجمالي",
    notes: "ملاحظات المشتري",
    placedOn: "بتاريخ {date}",
    deletedProduct: "منتج غير متوفر",

    accept: "قبول الطلب",
    reject: "رفض",
    acceptTitle: "قبول هذا الطلب؟",
    acceptBody:
      "سيُحجز المخزون للمشتري ويصله رابط الدفع. إن لم يدفع خلال المهلة يُلغى الطلب ويعود المخزون.",
    acceptYes: "نعم، اقبل",
    rejectTitle: "رفض هذا الطلب",
    rejectReason: "سبب الرفض",
    rejectReasonHint: "يراه المشتري. حتى 500 حرف.",
    rejectYes: "رفض الطلب",
    cancel: "تراجع",
    waitingPayment: "بانتظار دفع المشتري.",
    deliveryNext: "تحديث حالة التوصيل:",
    actIN_DELIVERY: "في الطريق",
    actREADY_PICKUP: "جاهز للاستلام",
    actDELIVERED: "تم التسليم",
    waitingConfirm: "بانتظار تأكيد المشتري للاستلام.",
    rate: "قيّم المشتري",

    actionFailed: "تعذّر تنفيذ الإجراء. ربما تغيّرت حالة الطلب أو نفدت الكمية.",
    paymentDown:
      "خدمة الدفع غير متاحة حاليًا. حاول قبول الطلب مرة أخرى بعد قليل.",
    buyerPhone: "هاتف المشتري",
  },
  en: {
    metaTitle: "Merchant orders | Mahaseel",
    title: "Incoming orders",
    sub: "Accept or reject orders and update delivery status.",
    empty: "No incoming orders yet",
    emptyHint: "Orders buyers send for your products will show up here.",
    buyer: "Buyer",
    qty: "Quantity",
    total: "Total",
    notes: "Buyer's notes",
    placedOn: "Placed {date}",
    deletedProduct: "Product unavailable",

    accept: "Accept order",
    reject: "Reject",
    acceptTitle: "Accept this order?",
    acceptBody:
      "Stock is reserved for the buyer and they get a payment link. If they don't pay in time the order is cancelled and stock returns.",
    acceptYes: "Yes, accept",
    rejectTitle: "Reject this order",
    rejectReason: "Reason",
    rejectReasonHint: "The buyer will see this. Up to 500 characters.",
    rejectYes: "Reject order",
    cancel: "Cancel",
    waitingPayment: "Waiting for the buyer to pay.",
    deliveryNext: "Update delivery status:",
    actIN_DELIVERY: "On the way",
    actREADY_PICKUP: "Ready for pickup",
    actDELIVERED: "Delivered",
    waitingConfirm: "Waiting for the buyer to confirm receipt.",
    rate: "Rate the buyer",

    actionFailed:
      "That didn't work. The order may have changed or stock ran out.",
    paymentDown:
      "The payment service is unavailable right now. Try accepting again shortly.",
    buyerPhone: "Buyer's phone",
  },
});
