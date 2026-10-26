"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteAccountAction, type ProfileState } from "@/actions/settings";
import { REMINDER_HOUR, isNative, reminderIsOn, setDailyReminder } from "@/lib/native";
import { Icon } from "./icon";
import { toast } from "./toaster";

/** Permanently deletes the account after the person types DELETE. */
export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<ProfileState, FormData>(deleteAccountAction, undefined);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  if (!open) {
    return (
      <button className="btn btn-sm" style={{ justifySelf: "start", color: "var(--bad)" }} onClick={() => setOpen(true)}>
        <Icon name="trash" /> Delete my account
      </button>
    );
  }
  return (
    <form action={action} className="confirm" style={{ display: "grid", gap: 10 }}>
      <span>
        This permanently deletes your account, projects, goals, notebook ideas, community posts and replies. It can&rsquo;t be undone.
      </span>
      <label className="field">
        <span className="label">Type DELETE to confirm</span>
        <input className="input input-sm" name="confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" />
      </label>
      {state?.error ? <p className="form-error">{state.error}</p> : null}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button className="btn btn-danger btn-sm" disabled={pending || typed.trim() !== "DELETE"}>
          {pending ? <span className="spinner" /> : <Icon name="trash" />} Delete everything
        </button>
      </div>
    </form>
  );
}

/** Daily reminder switch. Only shown inside the iPhone app. */
export function ReminderToggle() {
  const [native, setNative] = useState(false);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!isNative()) return;
    setNative(true);
    void reminderIsOn().then(setOn);
  }, []);
  if (!native) return null;

  async function toggle() {
    setBusy(true);
    const result = await setDailyReminder(!on);
    setBusy(false);
    if (result === "on") {
      setOn(true);
      toast(`Reminder set for ${REMINDER_HOUR - 12}pm every day.`);
    } else if (result === "off") {
      setOn(false);
      toast("Daily reminder turned off.");
    } else if (result === "denied") {
      toast("Notifications are off for Foundry. Turn them on in your iPhone's Settings app.");
    } else toast("Couldn't change the reminder. Try again.");
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Daily reminder</h2>
      <label className="check" style={{ justifyContent: "space-between" }}>
        <span>A nudge at {REMINDER_HOUR - 12}pm to check off one small goal.</span>
        <input type="checkbox" role="switch" checked={on} disabled={busy} onChange={toggle} aria-label="Daily reminder" />
      </label>
    </section>
  );
}
