# Mahaseel (Hasady) Frontend: Features

Mahaseel is an agricultural marketplace. Farmers (merchants) list produce at a fixed price or as a live auction, and buyers order or bid. Prices are in ILS. The interface is Arabic-first (right-to-left) with an English toggle, and supports light, dark, and system themes.

This document describes the frontend's features, routes, and behavior. The backend API is documented separately.

---

## Contents

1. [Stack](#stack)
2. [Roles and access](#roles-and-access)
3. [Routes](#routes)
4. [Features](#features)
5. [Shared behavior](#shared-behavior)
6. [Environment variables](#environment-variables)
7. [Running locally](#running-locally)
8. [Project layout](#project-layout)

---

## Stack

- Next.js (App Router) with React and TypeScript
- TanStack Query for server state; Zustand for the session and auth store
- Socket.IO client for live auction updates
- Server-Sent Events (SSE) for notifications
- Tailwind CSS with the project's design tokens
- Cloudinary for images and video
- Dictionary-based i18n (`*.i18n.ts`) with a `LocaleProvider`

---

## Roles and access

| Role     | Who                                              | What they can do                                                                             |
| -------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Guest    | Anyone not signed in                             | Browse the market and seller profiles. Sign in or sign up.                                   |
| Buyer    | Any verified account                             | Order fixed-price products, bid on auctions, track orders, pay, rate, manage the account.    |
| Merchant | A buyer whose merchant request an admin approved | Everything a buyer can do, plus farms, products, incoming orders, wallet, and bank accounts. |
| Admin    | Accounts with the admin role                     | The admin area (`/admin/*`).                                                                 |

Ordering and bidding are buyer-only. A merchant viewing another merchant's product sees a "buyers only" notice. On their own product they see an "own product" notice. Route guards send guests to `/login?next=<page>`. Signed-in users are redirected away from the sign-in and sign-up pages.

Admin pages also need the server-side admin secret, which the frontend adds itself (see [Environment variables](#environment-variables)). The browser never sees it.

---

## Routes

### Public

| Route              | Page                                                                      |
| ------------------ | ------------------------------------------------------------------------- |
| `/`                | Landing page: hero, how it works, calls to action                         |
| `/market`          | Product list with search, filters, and live auctions                      |
| `/market/[id]`     | Product page: details, order or bid panel, live auction box               |
| `/sellers/[id]`    | Seller profile: rating summary and reviews (sign-in required for reviews) |
| `/login`           | Sign in, with Google sign-in                                              |
| `/signup`          | Create an account                                                         |
| `/verify-email`    | Enter the code sent by email, with a resend cooldown                      |
| `/forgot-password` | Reset a password with an emailed code                                     |
| `/auth/success`    | Landing page after Google sign-in (exchanges a one-time code)             |

### Buyer (signed in)

| Route            | Page                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| `/orders`        | My orders, filtered by status                                              |
| `/orders/[id]`   | Order detail: tracker, payment, receipt confirmation, cancellation, rating |
| `/notifications` | All notifications, with mark-all-read                                      |
| `/account`       | Profile, avatar, password, request to become a merchant                    |
| `/ratings`       | Ratings received and given                                                 |

Also for buyers: a My bids page (standing bids) and a payment history page.

### Merchant (approved)

| Route                          | Page                                                    |
| ------------------------------ | ------------------------------------------------------- |
| `/merchant/farms`              | My farms                                                |
| `/merchant/farms/new`          | Create a farm                                           |
| `/merchant/farms/[id]`         | Edit a farm: details, media, private documents          |
| `/merchant/products`           | My products, filtered by status, with relist and delete |
| `/merchant/products/new`       | Create a product (fixed price or auction)               |
| `/merchant/products/[id]`      | Edit a product: details and media                       |
| `/merchant/products/[id]/bids` | Bids on one auction, with accept                        |
| `/merchant/orders`             | Incoming orders: accept or reject                       |
| `/merchant/wallet`             | Balance, transactions, withdrawal requests              |
| `/merchant/bank-accounts`      | Bank accounts used for withdrawals                      |

### Admin

| Route                | Page                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| `/admin`             | Dashboard: pending work, live counts, revenue and fees                  |
| `/admin/users`       | Users, merchant requests, suspend and reinstate                         |
| `/admin/users/[id]`  | User profile, farms, and recent orders                                  |
| `/admin/farms`       | Farms, filtered by status, with approve, reject, suspend, and delete    |
| `/admin/farms/[id]`  | Farm detail, media, and private documents                               |
| `/admin/products`    | Products, live auctions, deactivate and reactivate                      |
| `/admin/orders`      | Orders, disputes, force cancel and force complete                       |
| `/admin/withdrawals` | Withdrawal queue with bank details; approve or reject                   |
| `/admin/ratings`     | Ratings and the flag review queue                                       |
| `/admin/categories`  | Categories: names, slug, parent, icon, active state                     |
| `/admin/reports`     | Revenue by day, breakdown by sale method, monthly totals, top merchants |
| `/admin/broadcast`   | Announcements to all users, one role, or selected users                 |
| `/admin/audit`       | Audit log, and the history of one resource                              |

---

## Features

### Authentication and accounts

- Sign up, then verify the email with a code. The resend button has a cooldown.
- Sign in with email and password, or with Google. Google sign-in lands on `/auth/success`, which exchanges a one-time code for a session.
- Forgot password: send a code, verify it, then set a new password.
- Session tokens refresh automatically. A session ends only when the refresh token is rejected. Rate-limit responses and network errors don't end the session.
- The return address after sign-in (`?next=`) accepts same-site paths only. External addresses are ignored.
- Account page: edit the profile, upload or remove an avatar, change the password, and request merchant status. The request goes to an admin.

### Market

- Search by name, with filters for sale method (fixed price or auction), category, price range, location, and unit. Filters live in the URL, so a filtered view can be shared and bookmarked.
- Filters apply on Enter or on the apply button, so typing doesn't reload the list on every keystroke. Changing a filter resets pagination.
- Each active filter appears as a removable chip.
- The mobile filters open in a bottom sheet.
- Live auction cards show the current bid and the time left.

### Product page and ordering

- Shows the product, its farm and location, the price, the quantity available, and the seller.
- **Fixed-price products:** the buyer chooses a quantity. The total is shown before the order is sent. An order can include notes. Products with no price can't be ordered.
- **Auctions:** the auction box shows the current bid, the starting price, the bid count, and a live countdown. Bids and the close arrive over Socket.IO and update the page without a reload.
- A bid must be above the current bid. Before the first bid, it must be at least the starting price. The form shows the minimum.
- Auctions close at their end time. The page checks the clock itself, so it closes even if the close event is late.
- Signed-out visitors see a sign-in prompt in place of the order or bid form.

### Orders

- The buyer's order list, filtered by status.
- Order detail with a five-step tracker: sent, accepted by the merchant, paid, delivered, and receipt confirmed.
- Payment: when payment is due, the page shows the payment deadline and a button that opens the payment link. The link is fetched fresh each time.
- The buyer can confirm receipt after delivery, or cancel while the order is still open.
- After an order is completed, both sides can rate each other once.

### Merchant: farms

- Create and edit farms: name, manager, contact, registry number, and location. Coordinates must be given as a pair and fall within the valid ranges.
- Farms start pending and need admin approval before they can list products.
- Media: images and video, stored in Cloudinary.
- Documents: private files, read through links that expire after 5 minutes. See known issue 8.
- Farm status: pending, approved, rejected, or suspended. Rejection and suspension show the reason.

### Merchant: products

- Create a product with a sale method, a unit, a quantity, a delivery method, an optional category, and an optional description.
- **Fixed price:** a price per unit.
- **Auction:** a starting price and an end time. The duration can be at most 720 hours. The first bid must be at least the starting price.
- Media: images for the product cover and gallery. Video (MP4, WebM, or MOV, up to 50 MB) is supported for product media.
- Products list: filter by status, relist a fixed-price product (with a new quantity), and delete. A product with open orders can't be deleted.
- Product bids: for an auction, list the bids and accept one. Accepting one is a merchant decision, so a merchant can accept a bid that isn't the top bid.

### Merchant: orders

- Incoming orders with the buyer's details. The buyer's phone number appears once the order is accepted.
- Accept an order, or reject it with a reason.

### Merchant: wallet and bank accounts

- Wallet cards show the amount available for withdrawal, the amount pending, and total earnings.
- Withdrawal requests: choose an amount and a saved bank account. A request can't exceed the available balance.
- Transaction ledger: every balance change, such as a sale, a withdrawal, a refund, or a manual adjustment.
- Bank accounts: add, edit, delete, and set a default. The IBAN is checked with the mod-97 checksum. Duplicate accounts are rejected.

### Ratings and reviews

- Buyers and merchants rate each other after a completed order. One rating per person per order.
- Edit your own rating, unless it is under review.
- Users can flag a rating with a reason: fake information, offensive language, unrelated to the order, or other.
- Seller profiles show the rating summary. Reviews require sign-in.

### Notifications

- The bell in the header shows the unread count and a dropdown of recent notifications.
- The notifications page lists all notifications and has a mark-all-read action.
- New notifications arrive over SSE. Each connection uses a single-use ticket that expires after 60 seconds, so every reconnect requests a new one.
- Notification types include bid outcomes, order and payment updates, withdrawal decisions, rating updates, and admin announcements.

### Admin area

- **Dashboard:** counts of pending farms, pending withdrawals, delayed orders, and active auctions; new users today; platform revenue and fees.
- **Users:** search and filter by role. Approve or reject merchant requests (with a confirmation step). Suspend and reinstate accounts. Each suspension and reinstatement notifies the user.
- **Farms:** approve, reject with a reason, suspend, unsuspend, and hard-delete (irreversible). Approve, reject, suspend, and unsuspend notify the owner.
- **Products:** list by status and sale method; view live auctions; deactivate with a reason (the merchant is notified) or reactivate.
- **Orders:** list and filter orders. Disputes are unpaid orders older than 24 hours. Force cancel refunds paid orders. Force complete applies to paid orders that are stuck. Both need a reason.
- **Withdrawals:** the pending queue, oldest first, with the merchant's bank details. Approve only after transferring the money (an optional note can be added). Reject with a reason, which returns the amount to the wallet.
- **Ratings:** review the rating list and the flag queue, and resolve each flag.
- **Categories:** create and edit with Arabic and English names, a slug, a parent, a sort order, and an icon. Toggle active state. Deleting a category in use is refused, and the message appears above the table.
- **Reports:** revenue by day, breakdown by sale method, monthly totals for a year, and top merchants. Reports take a date range.
- **Broadcast:** send an announcement with Arabic and English titles and text, to all active users, to one role, or to selected users.
- **Audit log:** filter by admin, action, resource type, and date. Each resource has its own history.

---

## Shared behavior

- **Errors:** a shared helper turns any API error into a translated message. Forms can override the message for a given status. A 429 response tells the user to wait 3 minutes.
- **Loading, error, and empty states:** each list follows the same order: loading, then error with a retry button, then empty, then content.
- **Dialogs:** native `<dialog>` elements, with a focus trap, Esc to close, and a background that can't be reached. Dialogs don't close while an action is busy. A dialog's contents reset each time it opens.
- **Money:** all amounts are in ILS. Amounts display with a shared `Money` component.
- **Language and direction:** Arabic is the default and uses a right-to-left layout. Email addresses, phone numbers, and codes stay left-to-right inside Arabic pages. The language toggle switches the interface, and
- **Theme:** light, dark, or system.
- **Accessibility:** field errors and hints are linked to their inputs with `aria-describedby`. Animations respect reduced-motion settings. Focus rings are visible.

---

## Environment variables

Create `.env.local` for local development. Never commit it.

| Variable              | Scope              | Purpose                                                                          |
| --------------------- | ------------------ | -------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Browser and server | Backend base URL, including `/api/v1`. Example: `http://localhost:4000/api/v1`   |
| `API_BASE_URL`        | Server only        | Backend base URL for server components and the admin proxy. Same value as above. |
| `ADMIN_SECRET`        | Server only        | Must match one entry in the backend's `ADMIN_SECRETS`. Used by the admin proxy.  |

Do not add a `NEXT_PUBLIC_ADMIN_SECRET`. Any variable with the `NEXT_PUBLIC_` prefix is shipped to the browser.

---

## Running locally

```bash
npm install
npm run dev       # frontend on http://localhost:3000
npm run build     # type-check and production build
```

The backend and the frontend both default to port 3000. Run the backend on another port, such as 4000, and set `NEXT_PUBLIC_API_URL` and `API_BASE_URL` to match.

---

## Project layout

```
app/                 routes (App Router), including app/api/admin/[...path] (the admin proxy)
features/<area>/     feature modules: pages, components, API calls, dictionaries
components/          shared UI: dialogs, fields, tables, states, alerts
lib/                 API client, error handling, i18n provider, formatting
stores/              Zustand stores (auth session)
```

Import paths use the `@/` alias for the project root.

---
