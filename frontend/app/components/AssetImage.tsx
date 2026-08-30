"use client";

export function AssetImage({
  name,
  alt,
  className = "asset-icon",
}: {
  name: string;
  alt: string;
  className?: string;
}) {
  return <img className={className} src={`/assets/${name}`} alt={alt} />;
}
