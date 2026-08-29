"use client";
import "../styles/components/header.css";

export function Header({
  title,
  sub,
  back,
}: {
  title: string;
  sub?: string;
  back?: () => void;
}) {
  return (
    <header className="page-header">
      {back && (
        <button className="back" onClick={back}>
          ‹ 返回
        </button>
      )}
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </header>
  );
}
