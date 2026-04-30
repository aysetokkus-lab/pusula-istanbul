# Apple Review Reply — v1.0.5 (21 Nisan 2026)

## Guideline 2.1(b) — In-App Purchase Failed

---

### Reply to App Review (App Store Connect'e yapistir):

Thank you for your continued review. We have identified and resolved the root cause of the In-App Purchase failure.

**Root Cause:**
RevenueCat (our IAP SDK) was only initialized when a user logged into the app. If a reviewer or user navigated to the subscription paywall without first logging in, the SDK was not configured, causing all purchase attempts to fail with a "purchase failed" error.

**Fix in v1.0.5:**
We restructured the RevenueCat initialization to occur at app launch, independent of user authentication:

1. **App startup initialization:** RevenueCat is now configured in anonymous mode as soon as the app opens (`_layout.tsx`), ensuring IAP functionality is available immediately — even before user login.

2. **User association on login:** When a user logs in, `Purchases.logIn(userId)` is called to associate the anonymous RevenueCat user with the authenticated user, preserving any purchases made before login.

3. **Null safety in purchase flow:** Added defensive checks in the paywall screen (`abone-ol.tsx`) to verify RevenueCat readiness before initiating purchases, and graceful error handling if products cannot be loaded.

**Additionally:** The Paid Apps Agreement was activated on April 20, 2026. All agreements (Paid Apps, W-8BEN tax form, U.S. Certificate of Foreign Status, bank account) are confirmed Active in App Store Connect > Business.

**Testing:**
- Verified that subscription offerings load correctly without user login
- Verified that the purchase flow reaches the StoreKit layer successfully
- Both demo accounts remain available for testing:
  - **Active premium:** aysetokkus@hotmail.com / 123456
  - **Free tier:** demo.test@pusulaistanbul.app / 123456

We appreciate your patience and are confident this update resolves the IAP issue.

---

### Review Notes (App Store Connect > Version > App Review Information > Notes):

**v1.0.5 Changes — Critical IAP Fix:**
- RevenueCat SDK is now initialized at app launch (anonymous mode) instead of only after user login. This ensures In-App Purchase functionality is available immediately, regardless of authentication state.
- When a user logs in, their identity is associated via Purchases.logIn() to preserve purchase history.
- Added null safety checks and graceful error handling in the purchase flow.
- Paid Apps Agreement confirmed Active (activated April 20, 2026).

**Demo Accounts:**
1. Active premium account: aysetokkus@hotmail.com / 123456 (subscription active until 2027)
2. Free tier account: demo.test@pusulaistanbul.app / 123456 (expired subscription — shows free features + paywall)

**To test IAP:**
1. Open the app (no login required)
2. Tap any premium feature card (e.g., "Canli Saha Durumu") on the home screen
3. The paywall screen will open with subscription pricing loaded from the App Store
4. Tap "Pusula Istanbul'u Aktiflestir" to initiate purchase
5. Alternatively, log in with a demo account first, then navigate to the paywall via Profile > subscription section

**Subscription Products:**
- Monthly: com.pusulaistanbul.app.aylik (₺99.99/month)
- Yearly: com.pusulaistanbul.app.yillik (₺699.99/year, 41% savings)

**Technical Details:**
- RevenueCat Entitlement ID: "pro"
- Subscription Group: "Pusula Istanbul Premium" (Turkish localization added)
- EULA: Custom License Agreement in App Information > License Agreement
- All business agreements Active in App Store Connect > Business
