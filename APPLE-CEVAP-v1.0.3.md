# Apple App Store Review Response — v1.0.3

## Date
April 15, 2026

## Submitter
Ayşe Tokkuş Bayar  
Pusula Istanbul  
info@pusulaistanbul.app

---

## Overview

Thank you for reviewing Pusula Istanbul v1.0.2. We have addressed all four rejection issues in v1.0.3 with substantial app architecture and business model changes.

---

## What Changed in v1.0.3

### Business Model: Freemium (Not Trial-Based)
- **Removed:** Supabase-managed 7-day free trial system entirely
- **New:** True freemium model with free + premium tiers
- **Free features:** Museum hours, transport schedules, emergency contacts, Bosphorus tour info, Museum Card eligibility, search
- **Premium features (IAP only):** Chat room, live field status, transport alerts, city events
- **Result:** Users can fully use the app's basic features without any subscription or payment method

---

## Detailed Responses to Rejection Issues

### 1. Guideline 4.0 — Design (iPad Accessibility)

**Issue:**  
Chat message actions (report/block) were only accessible via long-press gesture, creating a discoverability problem especially on iPad where touch gestures may not trigger reliably. No visible button or action indicator.

**Resolution in v1.0.3:**  
- Added a visible three-dot menu button ("...") to the right of each chat message
- Button is tappable on all devices (phone/tablet) and triggers an ActionSheetIOS modal with:
  - "Report Message" (sends to admin review)
  - "Block User" (adds to engellenen_kullanicilar table, filters from display)
- Header guidance text clarified: "Tap the ... button on any message to report or block a user"
- Long-press functionality retained as backup but no longer the only discovery path
- iPad tested and confirmed fully accessible with fingers and Apple Pencil

---

### 2. Guideline 3.1.1 — In-App Purchase (Trial Termination & Paywall)

**Issue:**  
App used a trial system not managed by StoreKit; when trial expired, paywall was displayed but IAP products were not cleanly presented as the **only** mechanism for accessing paid features.

**Resolution in v1.0.3:**  

#### Complete Architectural Overhaul to Freemium:

**Free Tier (No Subscription Required):**
- Museum hours, prices, Museum Card eligibility
- Transport schedules (airport coaches, Bosphorus tours)
- Emergency contact numbers
- Search across all content
- Namaz times, weather, ship calendar
- User profile management

**Premium Tier (In-App Purchase Only):**
- Chat room (real-time guide discussion)
- Live field status (museum queue density, wait times)
- Transport alerts (metro/metro-bus/ferry disruptions from X/Twitter)
- City events & street closures
- Notification preferences (6 categories: transport, traffic, field status, events, chat, system)

#### IAP Implementation (RevenueCat + StoreKit):
- All paid access funnels exclusively through In-App Purchase
- Two subscription options:
  - Monthly: ₺99 / month
  - Yearly: ₺699 / year (~₺58.25/month, 41% savings badge)
- Subscriptions managed entirely by RevenueCat SDK + App Store
- No trial period; users see subscription gate when accessing premium feature
- Restore Purchases button provided on paywall and profile
- Clear messaging: "Your subscription includes unlimited access to Chat, Live Status, and Alerts"

#### Supabase Profile Changes:
- Trial system removed (deneme_suresi, trial_bitis columns eliminated)
- abonelik_durumu now only reflects RevenueCat EntitlementID status: **aktif** (current subscription) or **yok** (no subscription)
- Admin accounts set to aktif manually; all regular users must purchase

#### User Flow:
```
Launch
  ↓
Free features (museums, transport, emergency) — always available
  ↓
Premium feature accessed (chat, live status, alerts)
  ↓
Has active subscription? → Yes: allow access → No: show IAP paywall
  ↓
User selects plan → StoreKit purchase → RevenueCat updates profile → access granted
```

**Result:** Trial system completely eliminated. All paid access strictly through App Store In-App Purchase with transparent, clean UX.

---

### 3. Guideline 2.1 — Demo Account Credentials

**Issue:**  
Single demo account with active subscription insufficient to test multiple user states.

**Resolution in v1.0.3:**  

We provide **two demo accounts** for complete testing coverage:

#### Account 1: Active Subscription (Premium Access)
- **Email:** aysetokkus@hotmail.com
- **Password:** 123456
- **State:** Paid subscription active (expires 2027-12-31)
- **Access:** All free + premium features (chat, live status, alerts, events)
- **Use case:** Test full-featured user experience

#### Account 2: Expired/No Subscription (Free Tier Only)
- **Email:** demo.test@pusulaistanbul.app
- **Password:** 123456
- **State:** No active subscription (expired 2026-01-01)
- **Access:** All free features only (museums, transport, emergency, search)
  - Premium features show paywall when accessed
  - "You need a subscription" message with clear StoreKit purchase flow
- **Use case:** Test freemium gate, paywall UX, free-tier functionality

#### Database Setup:
Both accounts are created in Supabase Auth at app launch via our registration flow. Testers can create their own accounts using any email. For expedited testing, we provide the above credentials with pre-configured subscription states.

---

### 4. Guideline 2.1(b) — IAP Products & Screenshots

**Issue:**  
Subscription products not clearly presented in app UI with adequate metadata and transparency.

**Resolution in v1.0.3:**  

#### IAP Products Submitted & Active in App Store Connect:
- **Monthly Plan:** com.pusulaistanbul.app.aylik (~₺99/month)
- **Yearly Plan:** com.pusulaistanbul.app.yillik (~₺699/year)
- Both managed via RevenueCat; StoreKit receipt validation enabled

#### Clear Paywall Presentation (abone-ol.tsx):
1. **Hero Section:** "Unlock Premium Features" with gradient background
2. **Feature List (3 key premium features):**
   - Chat room with guides
   - Live museum queue status
   - Real-time transport alerts
3. **Plan Cards Side-by-Side:**
   - Monthly card: ₺99/month (radio button selectable)
   - Yearly card: ₺699/year with "41% SAVINGS" badge (default selected, LinearGradient highlight)
4. **Trust Copy:** "7-day free trial removed; subscribe now to unlock. Cancel anytime."
5. **CTA Button:** "Subscribe" (triggers StoreKit purchase)
6. **Restore Link:** "Already subscribed? Tap here to restore" (Purchases.restorePurchases)
7. **Legal Footer:** Links to Privacy Policy & Terms of Use

#### Subscription Management (Profil):
- Displays current subscription status
- "Manage Subscription" link directs to App Store subscription settings
- "Restore Purchases" button for users switching devices
- Clear expiration date when applicable

#### Screenshots Provided in App Store Connect:
- Paywall with both plan options clearly visible
- Feature list with premium items highlighted
- Chat feature (premium gate shown)
- Live status feature (premium gate shown)
- Profile subscription status display
- Restore Purchases flow

---

## Technical Summary

| Aspect | v1.0.2 (Rejected) | v1.0.3 (Resubmitted) |
|--------|-------------------|----------------------|
| Trial System | Supabase-managed 7 days | Removed entirely |
| IAP Paywall | Incomplete, paywall after trial | Full freemium, paywall on premium access |
| Free Features | Minimal (only if trial active) | Comprehensive (museums, transport, emergency, search) |
| Premium Features | Unclear gating | Clear IAP gate on chat, alerts, events, live status |
| Chat Access | Trial-locked | Premium subscription only |
| Demo Accounts | 1 (active sub) | 2 (active + no sub, both states testable) |
| iPad Support | Long-press only for chat actions | Visible "..." menu button on all devices |
| Restore Purchases | Missing | Added to paywall and profile |

---

## Testing Instructions

### Test Free Tier
1. Create a new account via app registration
2. Verify museums, transport, emergency, search all work
3. Attempt to access chat/alerts/events → paywall appears
4. Close paywall → free features still available

### Test Premium (Active Subscription)
1. Use demo account: aysetokkus@hotmail.com / 123456
2. Verify all premium features unlock without paywall
3. Verify subscription status shown in profile

### Test Premium Expired
1. Use demo account: demo.test@pusulaistanbul.app / 123456
2. Verify free features work
3. Tap chat/alerts/events → paywall shown
4. Verify "Already subscribed? Restore" button works with account 1

### Test IAP Purchase (Sandbox Testing)
1. On test device, sign into App Store with Sandbox tester account
2. Create new account in app
3. Tap premium feature → paywall
4. Select plan → StoreKit purchase sheet → complete
5. Verify subscription activated immediately
6. Close/reopen app → subscription persists

### Test Chat Message Actions (iPad)
1. Launch on iPad (or iPad simulator)
2. Send test message in chat
3. Verify "..." button visible to right of message
4. Tap "..." → ActionSheet with "Report" / "Block" options
5. Confirm long-press still works as backup

---

## Compliance Checklist

- [x] Freemium model: free tier fully functional without subscription
- [x] Premium features gated exclusively behind StoreKit IAP
- [x] No trial system; all paid access through App Store
- [x] Chat actions visible via menu button (iPad accessibility)
- [x] Restore Purchases button on paywall and profile
- [x] Demo accounts cover both subscription states
- [x] Privacy Policy & Terms of Use updated to reflect new model
- [x] Screenshots in App Store Connect show IAP products and paywall
- [x] RevenueCat SDK properly configured with StoreKit
- [x] Receipt validation enabled
- [x] Subscription expiration dates display in profile

---

## Contact & Support

For any questions during review, please contact:  
**Ayşe Tokkuş Bayar**  
info@pusulaistanbul.app  
+90 (respond via App Store Connect)

We appreciate the detailed feedback in the previous rejections and have made comprehensive changes to align with App Store guidelines. We look forward to approval.

---

**Build:** v1.0.3 / iOS build 10  
**Submission Date:** April 15, 2026  
**RevenueCat Configuration:** Complete  
**Freemium Model:** Fully Implemented
