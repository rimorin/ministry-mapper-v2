import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, userEvent, waitFor } from "../../utils/test";
import TagField from "./tagfield";

describe("TagField", () => {
  const defaultProps = {
    label: "Test Tags",
    value: [] as string[],
    onChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the label and placeholder", () => {
    render(<TagField {...defaultProps} placeholder="Add tags..." />);
    expect(screen.getByText("Test Tags")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Add tags...")).toBeInTheDocument();
  });

  it("displays current tags as badges", () => {
    render(<TagField {...defaultProps} value={["tag1", "tag2"]} />);
    expect(screen.getByText("tag1")).toBeInTheDocument();
    expect(screen.getByText("tag2")).toBeInTheDocument();
  });

  it("sanitizes created tags via Enter", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<TagField {...defaultProps} onChange={onChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "abc-123!@#");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls[0][0]).toEqual(["abc-123"]);
    });
  });

  it("supports a custom allowed pattern", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TagField
        {...defaultProps}
        onChange={onChange}
        allowedPattern={/[^a-z]/g}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "ABC123xyz");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls[0][0]).toEqual(["xyz"]);
    });
  });

  it("wires label and help text ids for accessibility", () => {
    render(<TagField {...defaultProps} helpText="This is help text" />);

    const input = screen.getByRole("textbox");
    const label = screen.getByText("Test Tags");
    const helpText = screen.getByText("This is help text");

    expect(input).toHaveAttribute("aria-labelledby", label.id);
    expect(label.id).toContain("tagfield-label-");
    expect(helpText.id).toContain("tagfield-help-");
  });

  it("removes a tag when X is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TagField
        {...defaultProps}
        value={["tag1", "tag2"]}
        onChange={onChange}
      />
    );

    const removeBtn = screen.getByRole("button", { name: "Remove tag1" });
    await user.click(removeBtn);

    expect(onChange).toHaveBeenCalledWith(["tag2"]);
  });

  it("supports clearing via parent rerender", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TagField {...defaultProps} value={["tag1"]} onChange={onChange} />
    );

    expect(screen.getByText("tag1")).toBeInTheDocument();

    rerender(<TagField {...defaultProps} value={[]} onChange={onChange} />);

    expect(screen.queryByText("tag1")).not.toBeInTheDocument();
  });
});
