"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
    value: number; // value in cents (integer)
    onChange: (cents: number) => void;
    className?: string;
    id?: string;
    disabled?: boolean;
}

/**
 * CurrencyInput — BRL mask with right-to-left digit entry.
 * Digits are appended from the right: typing 6 → R$ 0,06, then 0 → R$ 0,60,
 * then 0 → R$ 6,00, etc.
 * The internal value is always stored as integer cents to avoid float drift.
 */
export function CurrencyInput({ value, onChange, className, id, disabled }: CurrencyInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);

    const formatted = (value / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        if (e.key === "Backspace") {
            e.preventDefault();
            onChange(Math.floor(value / 10));
            return;
        }

        if (e.key >= "0" && e.key <= "9") {
            e.preventDefault();
            const newCents = value * 10 + parseInt(e.key, 10);
            // Cap at 999_999_999 cents (R$ 9.999.999,99)
            if (newCents <= 99_999_999_99) {
                onChange(newCents);
            }
            return;
        }

        // Allow Tab, arrow keys, etc.
    };

    return (
        <input
            ref={inputRef}
            id={id}
            value={focused ? formatted : formatted}
            readOnly
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-40",
                "font-mono text-right tabular-nums",
                className
            )}
        />
    );
}
