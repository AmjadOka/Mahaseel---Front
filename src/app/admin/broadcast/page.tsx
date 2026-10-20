import { adminMeta } from "@/features/admin/meta";
import Broadcast from "@/features/admin/notifications/Broadcast";

export const generateMetadata = adminMeta("navBroadcast");

export default function Page() {
  return <Broadcast />;
}
