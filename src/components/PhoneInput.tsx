import { useState } from "react";
import { Input } from "@/components/ui";
import { maskPhone, phoneDigits } from "@/lib/selectors";

/**
 * Standart telefon girişi: 0 (5xx) xxx xx xx
 * Baştaki 0, parantezler ve boşluklar kendiliğinden gelir; kullanıcı yalnızca rakam yazar.
 */
export function PhoneInput({ value, onChange, invalid, autoFocus }: { value: string; onChange: (v: string) => void; invalid?: boolean; autoFocus?: boolean }) {
  const [focus, setFocus] = useState(false);
  const d = phoneDigits(value);
  const shown = d ? maskPhone(d) : focus ? "0 (" : "";
  return (
    <Input
      type="tel"
      inputMode="numeric"
      autoComplete="off"
      autoFocus={autoFocus}
      value={shown}
      placeholder="0 (5xx) xxx xx xx"
      invalid={invalid}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      onChange={(e) => {
        let next = phoneDigits(e.target.value);
        // Silerken yalnızca parantez/boşluk silindiyse bir rakam geri git
        const deleting = ((e.nativeEvent as InputEvent).inputType ?? "").startsWith("delete");
        if (deleting && next === d) next = d.slice(0, -1);
        onChange(next ? maskPhone(next) : "");
      }}
    />
  );
}
