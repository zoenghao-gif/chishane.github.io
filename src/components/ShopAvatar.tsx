const backgrounds = ["bg-brand-soft", "bg-[#ECECEA]", "bg-[#EEEAF4]"];

export function ShopAvatar({ name }: { name: string }) {
  const first = Array.from(name.trim())[0] ?? "店";
  const index = first.codePointAt(0)! % backgrounds.length;
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] font-semibold text-ink ${backgrounds[index]}`}
      aria-hidden="true"
    >
      {first}
    </span>
  );
}
