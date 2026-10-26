"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileState } from "@/actions/settings";

export function ProfileForm({ name, handle, bio }: { name: string; handle: string; bio: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfileAction, undefined);
  return (
    <form action={action} className="stack gap-16">
      <label className="field">
        <span className="label">Name</span>
        <input className="input" name="name" defaultValue={name} maxLength={60} required />
      </label>
      <label className="field">
        <span className="label">Handle</span>
        <input className="input" name="handle" defaultValue={handle} maxLength={24} required pattern="[a-z0-9-]{3,24}" />
        <span className="hint">Shown next to your community posts, like @{handle}.</span>
      </label>
      <label className="field">
        <span className="label">Bio</span>
        <textarea className="textarea" name="bio" defaultValue={bio} rows={3} maxLength={280} placeholder="What are you building? What can you help others with?" />
      </label>
      {state?.error ? <p className="form-error">{state.error}</p> : null}
      {state?.ok ? <p className="notice">{state.ok}</p> : null}
      <button className="btn btn-primary" style={{ justifySelf: "start" }} disabled={pending}>
        {pending ? <span className="spinner" /> : null} Save profile
      </button>
    </form>
  );
}
