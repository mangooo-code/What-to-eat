import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableMulti } from "./EditableMulti";

const opts = ["不吃辣", "不吃香菜"];

describe("EditableMulti", () => {
  it("renders all options plus any custom selected values", () => {
    render(
      <EditableMulti
        title="长期不吃的食物"
        opts={opts}
        selected={["自定义忌口"]}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("不吃辣")).toBeInTheDocument();
    expect(screen.getByText("不吃香菜")).toBeInTheDocument();
    expect(screen.getByText("自定义忌口")).toBeInTheDocument();
  });

  it("adds an unselected option when clicked", () => {
    const onSelect = vi.fn();
    render(
      <EditableMulti title="忌口" opts={opts} selected={[]} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText("不吃辣"));
    expect(onSelect).toHaveBeenCalledWith(["不吃辣"]);
  });

  it("removes a selected option when clicked again", () => {
    const onSelect = vi.fn();
    render(
      <EditableMulti
        title="忌口"
        opts={opts}
        selected={["不吃辣"]}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText("不吃辣"));
    expect(onSelect).toHaveBeenCalledWith([]);
  });

  it("clears other allergens when '无已知过敏原' is chosen", () => {
    const onSelect = vi.fn();
    render(
      <EditableMulti
        title="过敏原"
        opts={["花生", "无已知过敏原"]}
        selected={["花生"]}
        onSelect={onSelect}
        allergy
      />,
    );
    fireEvent.click(screen.getByText("无已知过敏原"));
    expect(onSelect).toHaveBeenCalledWith(["无已知过敏原"]);
  });

  it("drops '无已知过敏原' when another allergen is added", () => {
    const onSelect = vi.fn();
    render(
      <EditableMulti
        title="过敏原"
        opts={["花生", "无已知过敏原"]}
        selected={["无已知过敏原"]}
        onSelect={onSelect}
        allergy
      />,
    );
    fireEvent.click(screen.getByText("花生"));
    expect(onSelect).toHaveBeenCalledWith(["花生"]);
  });

  it("adds a manually typed value and clears the input", () => {
    const onSelect = vi.fn();
    render(
      <EditableMulti title="忌口" opts={opts} selected={[]} onSelect={onSelect} />,
    );
    const input = screen.getByPlaceholderText("手动添加忌口");
    fireEvent.change(input, { target: { value: "不吃牛肉" } });
    fireEvent.click(screen.getByText("添加"));
    expect(onSelect).toHaveBeenCalledWith(["不吃牛肉"]);
    expect(input).toHaveValue("");
  });

  it("does not add an empty manual value", () => {
    const onSelect = vi.fn();
    render(
      <EditableMulti title="忌口" opts={opts} selected={[]} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText("添加"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
