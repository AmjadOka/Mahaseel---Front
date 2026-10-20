import { getT } from "@/lib/i18n/server";
import NotificationsPage from "@/features/notifications/NotificationsPage";
import dict from "@/features/notifications/notifications.i18n";

export async function generateMetadata() {
  return { title: (await getT(dict))("metaTitle"), robots: { index: false } };
}

export default function Page() {
  return <NotificationsPage />;
}
