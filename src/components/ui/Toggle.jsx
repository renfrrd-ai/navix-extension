export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="font-app flex cursor-pointer select-none items-center gap-[0.65rem] text-[0.83rem] text-app-2">
      <div
        onClick={() => onChange(!checked)}
        className={`relative h-5.25 w-9.5 shrink-0 cursor-pointer rounded-[21px] border-[1.5px] transition-colors duration-200 ${checked ? "border-[var(--accent)] bg-[var(--accent)]" : "border-app-2 bg-app-4"}`}
      >
        <div
          className={`absolute top-0.5 size-3.75 rounded-full bg-white transition-[left] duration-200 ${checked ? "left-4.75" : "left-0.5"}`}
        />
      </div>
      {label && <span>{label}</span>}
    </label>
  );
}
