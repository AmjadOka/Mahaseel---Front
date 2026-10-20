// Save as errors.i18n.ts. The upload dropped the dot, and useApiError imports "./errors.i18n".
import { defineDict } from "@/lib/i18n/translate";

export default defineDict({
  ar: {
    network: "تعذّر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.",
    invalid: "تحقق من البيانات المُدخلة وحاول مجددًا.",
    unauthorized: "انتهت جلستك. سجّل الدخول من جديد.",
    forbidden: "لا تملك صلاحية لهذا الإجراء.",
    notFound: "لم يتم العثور على المطلوب.",
    conflict: "هذه البيانات مسجّلة مسبقًا.",
    tooMany: "محاولات كثيرة. انتظر بضع دقائق ثم حاول مجددًا.",
    server: "حدث خطأ في الخادم. حاول لاحقًا.",
    unknown: "حدث خطأ غير متوقع.",
  },
  en: {
    network: "Couldn't reach the server. Check your connection and try again.",
    invalid: "Check the details you entered and try again.",
    unauthorized: "Your session has ended. Please log in again.",
    forbidden: "You don't have permission to do that.",
    notFound: "We couldn't find what you were looking for.",
    conflict: "These details are already registered.",
    tooMany: "Too many attempts. Wait a few minutes and try again.",
    server: "Something went wrong on our side. Try again later.",
    unknown: "An unexpected error occurred.",
  },
});
