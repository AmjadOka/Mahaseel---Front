/**
 * Enum values the frontend SENDS, copied from the backend enums (src/common/enums/*).
 * The backend mixes casing on purpose of history: almost everything is lowercase, but
 * OrderStatus and DeliveryStatus are UPPERCASE and ProductStatus.INACTIVE is 'in-active'.
 * Values the UI only READS go through `norm()` in features/orders/status.ts instead.
 */
export const ROLE = { MERCHANT: "merchant", BUYER: "buyer", ADMIN: "admin" } as const;
export const SALE_METHOD = { FIXED: "fixed", AUCTION: "auction" } as const;
export const DELIVERY_METHOD = { FROM_FARM: "from_farm", DRIVER: "driver" } as const;
export const DELIVERY_STATUS = { PREPARING: "PREPARING", READY_PICKUP: "READY_PICKUP", IN_DELIVERY: "IN_DELIVERY", DELIVERED: "DELIVERED" } as const;
export const ORDER_STATUS = { PENDING: "PENDING", AWAITING_PAYMENT: "AWAITING_PAYMENT", ACCEPTED: "ACCEPTED", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED", REJECTED: "REJECTED", REFUNDED: "REFUNDED" } as const;
export const FARM_STATUS = { PENDING: "pending", APPROVED: "approved", REJECTED: "rejected", SUSPENDED: "suspended" } as const;
export const PRODUCT_STATUS = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  ACTIVE: "active",
  SOLD: "sold",
  EXPIRED: "expired",
  REJECTED: "rejected",
  ARCHIVED: "archived",
  INACTIVE: "in-active",
} as const;
export const WITHDRAWAL_STATUS = { PENDING: "pending", PROCESSING: "processing", COMPLETED: "completed", REJECTED: "rejected" } as const;
export const NOTIFICATION_TYPE = { SYSTEM: "system" } as const;

/**
 * FlagReason / FlagStatus live in rating.entity.ts, which wasn't shared — these are best guesses.
 * Replace with the real values (lowercase like most of the backend, or not).
 */
export const FLAG_REASONS = ["abusive", "false", "spam", "other"] as const;
export const FLAG_STATUS = { PENDING: "pending", REVIEWED: "reviewed", DISMISSED: "dismissed", REMOVED: "removed" } as const;
