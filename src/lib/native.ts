// Bridges to the iPhone app's native features (Capacitor plugins).
// Every helper is a safe no-op in a normal web browser. Client-side only.

type CapacitorGlobal = { isNativePlatform?: () => boolean };

/** True inside the Foundry iPhone app. */
export function isNative() {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  return Boolean(cap?.isNativePlatform?.()) || navigator.userAgent.includes("FoundryApp");
}

/** A light tap, for checking off a goal. */
export async function tapFeedback() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}

/** A success buzz, for finishing a section. */
export async function successFeedback() {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {}
}

/** Opens a website in the in-app browser, so people don't leave Foundry. */
export async function openExternal(url: string) {
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

const REMINDER_ID = 1001;
export const REMINDER_HOUR = 19;

export async function reminderIsOn(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { notifications } = await LocalNotifications.getPending();
    return notifications.some((n) => n.id === REMINDER_ID);
  } catch {
    return false;
  }
}

/** Turns the daily 7pm "make progress" reminder on or off. */
export async function setDailyReminder(on: boolean): Promise<"on" | "off" | "denied" | "unavailable"> {
  if (!isNative()) return "unavailable";
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
    if (!on) return "off";
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return "denied";
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title: "Make progress today",
          body: "Check off one small goal in Foundry. Small steps add up.",
          schedule: { on: { hour: REMINDER_HOUR, minute: 0 }, allowWhileIdle: true },
        },
      ],
    });
    return "on";
  } catch {
    return "unavailable";
  }
}

/** Hides the launch screen once Foundry has loaded. */
export async function hideSplash() {
  if (!isNative()) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {}
}

/** Matches the status bar text color to the current theme. */
export async function syncStatusBar(dark: boolean) {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
  } catch {}
}
