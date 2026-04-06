export function PrimaryButton({
  children,
  onClick,
  disabled,
  full,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`ui-primary-button ${full ? "w-full" : ""} ${disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer hover:opacity-85"} ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, danger, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`ui-ghost-button ${
        danger
          ? "border-[rgba(248,113,113,0.3)] text-[var(--red)] hover:border-[var(--red)] hover:text-[var(--red)]"
          : "hover:border-[var(--accent)] hover:text-[var(--accent)]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  title,
  active,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`ui-icon-button ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--accent)] shadow-[0_0_0_4px_var(--accent-glow)]"
          : "hover:border-[var(--accent)] hover:bg-[var(--accent-glow)] hover:text-[var(--accent)]"
      } ${className}`}
    >
      {children}
    </button>
  );
}
