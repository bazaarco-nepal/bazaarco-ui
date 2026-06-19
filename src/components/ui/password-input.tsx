"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/kit";

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  inputStyle?: React.CSSProperties;
};

export function PasswordInput({ inputStyle, style, ...props }: PasswordInputProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%", ...style }}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        style={{
          width: "100%",
          paddingRight: 44,
          ...inputStyle,
        }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("common.a11y.hidePassword") : t("common.a11y.showPassword")}
        className="bz-hover-tint"
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          width: 32,
          height: 32,
          border: "none",
          borderRadius: "var(--r-sm)",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-400)",
        }}
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={18} />
      </button>
    </div>
  );
}
