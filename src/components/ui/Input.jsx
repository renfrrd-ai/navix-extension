import { forwardRef } from "react";

const Input = forwardRef(function Input(
  {
    value,
    onChange,
    onKeyDown,
    placeholder,
    type = "text",
    disabled,
    small,
    className = "",
    autoFocus,
    maxLength,
    inputMode,
  },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      maxLength={maxLength}
      inputMode={inputMode}
      autoComplete="off"
      spellCheck={false}
      className={`ui-input ${small ? "w-auto" : "w-full"} ${disabled ? "cursor-not-allowed opacity-45" : "cursor-text"} ${className}`}
    />
  );
});

export default Input;
