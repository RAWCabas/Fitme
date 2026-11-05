"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, Circle } from "lucide-react";
import { evaluatePassword } from "@/lib/auth/password-policy";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete,
  className = "",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-3.5 pr-11 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-0 top-0 h-full w-11 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function PasswordRequirements({ password }: { password: string }) {
  const rules = evaluatePassword(password);
  return (
    <ul className="space-y-1 text-[11px]" aria-label="Password requirements">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={`flex items-center gap-1.5 ${rule.met ? "text-emerald-600" : "text-muted-foreground"}`}
        >
          {rule.met ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
}

