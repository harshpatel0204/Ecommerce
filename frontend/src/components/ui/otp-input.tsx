import React, { useRef, useState, useEffect } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export function OtpInput({ value, onChange, error }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Synchronize internal state with react-hook-form value
  useEffect(() => {
    const val = value || "";
    const newDigits = Array(6).fill("");
    for (let i = 0; i < Math.min(val.length, 6); i++) {
      newDigits[i] = val[i];
    }
    setDigits(newDigits);
  }, [value]);

  const handleChange = (index: number, val: string) => {
    // Only accept numeric inputs
    const cleanVal = val.replace(/[^0-9]/g, "");
    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      onChange(newDigits.join(""));
      return;
    }

    // Take only the last entered digit
    const digit = cleanVal.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    onChange(newDigits.join(""));

    // Automatically focus the next input box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Backspace in empty cell -> clear previous cell and focus it
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        onChange(newDigits.join(""));
        inputRefs.current[index - 1]?.focus();
      } else if (digits[index]) {
        // Clear current cell
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    const cleanPaste = pasteData.replace(/[^0-9]/g, "").slice(0, 6);
    if (cleanPaste) {
      const newDigits = Array(6).fill("");
      for (let i = 0; i < cleanPaste.length; i++) {
        newDigits[i] = cleanPaste[i];
      }
      setDigits(newDigits);
      onChange(newDigits.join(""));

      // Focus last filled box or the next box
      const focusIndex = Math.min(cleanPaste.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-3 w-full" dir="ltr">
      {Array(6)
        .fill(null)
        .map((_, idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[idx]}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`w-11 h-11 md:w-12 md:h-12 text-center text-xl font-bold font-mono border rounded-xl focus:outline-none focus:ring-2 transition-all bg-background text-foreground ${
              error
                ? "border-destructive focus:ring-destructive/30 focus:border-destructive"
                : "border-input hover:border-accent-foreground/30 focus:ring-primary/20 focus:border-primary"
            }`}
          />
        ))}
    </div>
  );
}
