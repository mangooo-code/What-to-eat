"use client";

export function Placeholder({
  kind = "image",
  wide = false,
}: {
  kind?: "image" | "icon";
  wide?: boolean;
}) {
  return (
    <span className={`${kind}-placeholder ${wide ? "wide" : ""}`}>
      {kind === "image" ? "图片占位" : "图标占位"}
    </span>
  );
}
