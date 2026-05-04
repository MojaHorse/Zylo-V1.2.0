# Zylo POS – Comprehensive System Documentation

Welcome to the official developer documentation for the **Zylo POS** application. This document provides a complete, top-to-bottom overview of the application's architecture, database schema, design system, state management, and critical business logic workflows. 

---

## 1. Introduction & Business Context

Zylo is a modern, high-performance Point-of-Sale system built specifically for restaurants, cafes, and quick-service establishments. It was engineered with a primary focus on speed, reliability, and user satisfaction, utilizing a custom "Crisp & Tactile" design system. The application handles multi-tier authentication, inventory tracking, role-based access control, shift management (cash-ups), and transaction processing.

---

## 2. Technical Stack

- **Frontend Framework:** React Native via Expo
- **Language:** TypeScript
- **Styling:** Tailwind CSS (via `twrnc` package)
- **Icons:** `lucide-react-native`
- **User Feedback:** `expo-haptics`
- **Backend Service:** Supabase
  - **Database:** PostgreSQL
  - **Authentication:** Supabase Auth (Email/Password)
  - **Security:** Row Level Security (RLS)
  - **Logic:** Server-side RPCs (Remote Procedure Calls)

---

## 3. Project Structure Breakdown

The codebase is organized modularly to separate concerns (UI, State, Logic).

```text
/
├── App.tsx                    # Main entry point and provider wrapper
├── components/                # Reusable UI components
│   ├── Context/               # Global React Context providers
│   ├── Modals/                # Bottom-sheet and full-screen modals
│   ├── Skeletons/             # Loading skeleton components
│   ├── BottomNav.tsx          # Tablet bottom navigation
│   ├── POSKeypad.tsx          # Custom numeric keypad for open items
│   ├── ProductCard.tsx        # Grid items for the POS menu
│   └── ...
├── src/
│   ├── hooks/                 # Custom React hooks containing all business logic
│   ├── screens/               # Main application screens (grouped by feature)
│   │   ├── Authentication/    # Login and PIN entry
│   │   ├── Dashboard/         # Manager analytics and reporting
│   │   ├── POS/               # Tablet and Mobile POS layouts
│   │   ├── Inventory/         # Stock management
│   │   └── MainLayout.tsx     # The app shell containing navigation and shift guards
│   ├── utils/                 # Formatting, haptics, and calculation utilities
│   └── Onboarding/            # App splash and introduction screens
├── types.ts                   # Global TypeScript interfaces and types
├── lib/supabase.ts            # Supabase client initialization
└── ...
```

---

## 4. Core Features & Workflows

### 4.1 Authentication Architecture (Two-Tier System)
Zylo mimics the security models of physical POS hardware:
1. **Device Level (Supabase Auth):** The tablet is authenticated to a specific `business_id` using the Owner's email and password.
2. **Staff Level (PIN Auth):** Once the device is logged in, it enters a locked state. Staff members (Cashiers, Managers, Owners) must enter a secure 4-digit PIN. 
   - PINs are hashed and stored in the `business_members` table.
   - The app identifies the `activeStaff` based on the PIN, adjusting permissions dynamically.
   - Cashiers can "Lock Register" but cannot fully log out the device.

### 4.2 Shift Management (Cash Ups)
No sales can occur without an active shift.
- **Starting a Shift:** When a staff member logs in, `useStartShift` checks the `cash_ups` table. If no `open` shift exists, `StartShiftPromptModal` forces them to open one, requiring a starting float amount.
- **Resuming a Shift:** If they already have an open shift, they are shown an animated "Resuming Shift" toast, allowing them to continue seamlessly.
- **Enforcement:** `CheckoutModal` verifies an open shift exists immediately before executing the transaction payload.

### 4.3 Point of Sale (POS) Interface
Designed for speed and high data density.
- **Adaptive Layouts:** Distinct interfaces for Tablet (`POSScreenTablet`) and Mobile (`POSScreenMobile`). Tablets use a split-pane view (Grid + Cart Sidebar), while Mobile uses a full-screen grid with a floating cart button.
- **Input Methods:** Users can toggle between a visual Product Grid and a Numeric Keypad (`POSKeypad.tsx`) for ringing up custom open amounts. 
- **Cart Context:** `CartContext.tsx` handles complex order logic, including line-item modifiers (e.g., "Extra Cheese") and smart stacking (identical custom amounts stack; different amounts remain separate).

### 4.4 Checkout & Transaction Processing
When a cashier finalizes an order:
1. The app calculates totals and required change (for cash transactions).
2. It calls the **`complete_sale`** Supabase RPC.
3. The RPC operates inside a strict SQL transaction:
   - Validates business and staff IDs.
   - Checks stock levels (rolls back if insufficient).
   - Inserts the `transaction`.
   - Inserts all `order_items`, capturing a snapshot of the name and price at the time of sale.
   - Updates the currently open shift (`cash_ups`) to add the transaction amount to the `system_cash_total`.

---

## 5. Database Schema & Supabase Configuration

### 5.1 Primary Tables
- **`businesses`:** The root tenant table.
- **`business_members`:** Links a user/staff to a business. Contains `role` (`owner`, `manager`, `cashier`) and `pin_hash`.
- **`products` & `categories`:** Core menu definitions.
- **`product_modifiers`:** Add-ons or variants for products.
- **`inventory_items` & `recipes`:** Handles stock tracking and raw material depletion when products are sold.
- **`transactions`:** High-level sale records (Total, Payment Method, Change).
- **`order_items`:** Line items belonging to a transaction.
  - *Key feature:* `product_id` is nullable. This allows the POS Keypad to insert custom amounts without violating foreign key constraints, relying on `product_name_snapshot` instead.
- **`cash_ups`:** Records shift lifecycles, starting float, calculated system totals, and final declared totals.
- **`business_daily_order_counters`:** Manages sequential, human-readable order numbers (resetting daily).

### 5.2 Row Level Security (RLS)
Security is strictly enforced at the database level. Almost all tables have policies ensuring:
`business_id = current_user_business_id()`
This guarantees that a compromised client cannot read or mutate data belonging to another restaurant.

---

## 6. Design System ("Crisp & Tactile")

Zylo's aesthetic is explicitly defined as "Crisp & Tactile."
- **Color Palette:** Clean `slate` backgrounds, stark white cards, and vibrant `indigo` primary actions. Hardcoded dark modes were intentionally removed to prioritize high contrast and readability.
- **Typography:** Bold, tracking-tight numerical displays and uppercase, tracking-wide labels.
- **Haptic Feedback:** Embedded in every interaction. 
  - `Light`: Keypad typing, adding to cart.
  - `Medium`: Clearing the cart, modal opening.
  - `Success`: Successful transaction, shift start.
  - `Error`: Insufficient funds, invalid PIN.
- **Micro-interactions:** Buttons scale down slightly (`scale-95`) when pressed using Tailwind's `active:` and React Native's `Pressable` state styles.

---

## 7. State Management & Hooks

Global state is minimized in favor of Context and custom Hooks.
- **Contexts:**
  - `AuthContext`: Tracks `user` (Device) and `activeStaff` (Person).
  - `BusinessContext`: Tracks `selectedBusiness`.
  - `CartContext`: Tracks line items, modifiers, and totals.
  - `ToastContext`: Manages the animated, non-intrusive notification system.
- **Hooks:** Business logic is abstracted out of UI components.
  - `usePOSLogic.ts`: Handles searching, categories, keypad mode, and cart additions.
  - `useStartShift.ts`: Manages shift queries and lifecycle.
  - `useDashboardLogic.ts`: Aggregates transaction data for reporting.

---

## 8. Development & Deployment

### Running the App Locally
```bash
# Install dependencies
npm install

# Start the Expo development server
npx expo start
```
*Note: iOS Simulator or an Android Emulator is required to test React Native environments. For Haptics testing, a physical device via the Expo Go app is required.*

### Future Scalability Considerations
- **Offline Support:** Currently, the app relies on an active internet connection for Supabase RPCs. Future iterations could leverage WatermelonDB or AsyncStorage queues to support offline sales syncing.
- **Hardware Integrations:** The application is architected to easily support Bluetooth receipt printers (ESC/POS) and external card terminals by adding modules to the `CheckoutModal` flow.
