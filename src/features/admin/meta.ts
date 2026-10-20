import { getT } from "@/lib/i18n/server";
import dict from "./admin.i18n";

type NavKey = "navDashboard" | "navUsers" | "navFarms" | "navProducts" | "navOrders" | "navWithdrawals" | "navRatings" | "navCategories" | "navBroadcast" | "navReports" | "navAudit";

/** generateMetadata for an admin page: "<section> | Admin | <brand>", never indexed. */
export const adminMeta = (key: NavKey) => async () => {
  const t = await getT(dict);
  return { title: `${t(key)} | ${t("navLabel")} | ${t("brand")}`, robots: { index: false } };
};
