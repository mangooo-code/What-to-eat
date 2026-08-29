import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileForm } from "../components/ProfileForm";

describe("ProfileForm", () => {
  it("manages its own state when uncontrolled", () => {
    render(<ProfileForm />);
    fireEvent.click(screen.getByText("家常"));
    expect(screen.getByText("家常")).toHaveClass("active");
  });

  it("reflects the controlled value prop", () => {
    render(
      <ProfileForm
        value={{ taste: "香辣", diet: "", limits: [], allergens: [] }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("香辣")).toHaveClass("active");
  });

  it("calls onChange with merged data when controlled", () => {
    const onChange = vi.fn();
    render(
      <ProfileForm
        value={{ taste: "香辣", diet: "低脂", limits: [], allergens: [] }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText("素食"));
    expect(onChange).toHaveBeenCalledWith({
      taste: "香辣",
      diet: "素食",
      limits: [],
      allergens: [],
    });
  });
});
