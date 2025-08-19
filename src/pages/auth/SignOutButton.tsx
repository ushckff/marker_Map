import "./SignOutButton.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOutUser } from "@/services/auth";

type Props = { className?: string };

export default function SignOutButton({ className }: Props) {
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function handle() {
    if (busy) return;
    setBusy(true);
    try {
      await signOutUser();
      nav("/", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className={`signout ${className ?? ""}`}
      onClick={handle}
      disabled={busy}
    >
      Выйти
    </button>
  );
}
