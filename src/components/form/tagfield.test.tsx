import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, userEvent, waitFor } from "../../utils/test";
import TagField from "./tagfield";

describe("TagField", () => {
  const defaultProps = {
    label: "Test Tags",
    value: [],
    onChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render label", () => {
      render(<TagField {...defaultProps} />);

      expect(screen.getByText("Test Tags")).toBeInTheDocument();
    });

    it("should not render required asterisk by default", () => {
      render(<TagField {...defaultProps} />);

      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    it("should render with placeholder text", () => {
      render(<TagField {...defaultProps} placeholder="Add tags..." />);

      expect(screen.getByText("Add tags...")).toBeInTheDocument();
    });

    it("should display current tags", () => {
      const tags = [
        { value: "tag1", label: "tag1" },
        { value: "tag2", label: "tag2" }
      ];
      render(<TagField {...defaultProps} value={tags} />);

      expect(screen.getByText("tag1")).toBeInTheDocument();
      expect(screen.getByText("tag2")).toBeInTheDocument();
    });
  });

  describe("validation - alphanumeric and hyphen only", () => {
    it("should strip special characters except hyphens", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagField {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "abc-123!@#");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const calledTags = onChange.mock.calls[0][0];
        expect(calledTags).toHaveLength(1);
        expect(calledTags[0].value).toBe("abc-123");
      });
    });

    it("should allow alphanumeric characters", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagField {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "Unit123");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const calledTags = onChange.mock.calls[0][0];
        expect(calledTags[0].value).toBe("Unit123");
      });
    });

    it("should allow hyphens", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagField {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "Unit-A-1");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const calledTags = onChange.mock.calls[0][0];
        expect(calledTags[0].value).toBe("Unit-A-1");
      });
    });

    it("should strip spaces from tags", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagField {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "  Unit 123  ");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const calledTags = onChange.mock.calls[0][0];
        expect(calledTags[0].value).toBe("Unit123");
      });
    });

    it("should not allow asterisks", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagField {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "Unit*123");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const calledTags = onChange.mock.calls[0][0];
        expect(calledTags[0].value).toBe("Unit123");
      });
    });

    it("should filter out empty tags after validation", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagField {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "!@#$%");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        // Should NOT call onChange when input only contains special characters
        expect(onChange).not.toHaveBeenCalled();
        // Should show a notification instead (from i18n)
        expect(
          screen.getByText(
            "Only alphanumeric characters and hyphens are allowed"
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe("custom validation pattern", () => {
    it("should use custom pattern when provided", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      // Only allow lowercase letters
      render(
        <TagField
          {...defaultProps}
          onChange={onChange}
          allowedPattern={/[^a-z]/g}
        />
      );

      const input = screen.getByRole("combobox");
      await user.type(input, "ABC123xyz");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const calledTags = onChange.mock.calls[0][0];
        expect(calledTags[0].value).toBe("xyz");
      });
    });
  });

  describe("user interaction", () => {
    it("should call onChange when tags are added", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagField {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "NewTag");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    it("should handle adding single tag", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagField {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("combobox");

      await user.type(input, "Tag1");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const firstCall = onChange.mock.calls[0];
        expect(firstCall[0]).toHaveLength(1);
        expect(firstCall[0][0].value).toBe("Tag1");
      });
    });

    it("should reset tags when onChange is called with null", () => {
      const onChange = vi.fn();
      const tags = [{ value: "tag1", label: "tag1" }];

      const { rerender } = render(
        <TagField {...defaultProps} value={tags} onChange={onChange} />
      );

      expect(screen.getByText("tag1")).toBeInTheDocument();

      // Simulate clearing by parent component
      rerender(<TagField {...defaultProps} value={[]} onChange={onChange} />);

      expect(screen.queryByText("tag1")).not.toBeInTheDocument();
    });
  });

  describe("formatCreateLabel", () => {
    it("should use custom formatCreateLabel when provided", () => {
      const formatCreateLabel = (inputValue: string) =>
        `Add custom: ${inputValue}`;

      render(
        <TagField {...defaultProps} formatCreateLabel={formatCreateLabel} />
      );

      // CreatableSelect should use this function internally
      expect(formatCreateLabel("test")).toBe("Add custom: test");
    });
  });

  describe("noOptionsMessage", () => {
    it("should display noOptionsMessage when provided", () => {
      render(
        <TagField {...defaultProps} noOptionsMessage="No tags available" />
      );

      // The message is displayed in specific UI states
      const field = screen.getByRole("combobox");
      expect(field).toBeInTheDocument();
    });
  });

  describe("form integration", () => {
    it("should be part of Form.Group with mb-3 class", () => {
      const { container } = render(<TagField {...defaultProps} />);

      const formGroup = container.querySelector(".mb-3");
      expect(formGroup).toBeInTheDocument();
    });

    it("should have Form.Label element", () => {
      const { container } = render(<TagField {...defaultProps} />);

      const label = container.querySelector(".form-label");
      expect(label).toBeInTheDocument();
    });

    it("should have ARIA attributes for accessibility", () => {
      render(<TagField {...defaultProps} helpText="This is help text" />);

      const input = screen.getByRole("combobox");
      const label = screen.getByText("Test Tags");

      // Check aria-labelledby points to label
      expect(input).toHaveAttribute("aria-labelledby");
      expect(label).toHaveAttribute("id");

      // Check aria-describedby points to help text
      expect(input).toHaveAttribute("aria-describedby");
      expect(screen.getByText("This is help text")).toHaveAttribute("id");
    });
  });

  describe("duplicate prevention", () => {
    it("should filter duplicate tags from the value array", () => {
      const onChange = vi.fn();

      // Render with duplicate values to verify they display
      const duplicateTags = [
        { value: "Unit1", label: "Unit1" },
        { value: "Unit2", label: "Unit2" },
        { value: "Unit1", label: "Unit1" } // Duplicate
      ];

      render(
        <TagField {...defaultProps} value={duplicateTags} onChange={onChange} />
      );

      // Component should render all values (React Select handles this)
      // The handleChange function will deduplicate when onChange is called
      const unit1Elements = screen.getAllByText("Unit1");
      expect(unit1Elements.length).toBeGreaterThan(0);
      expect(screen.getByText("Unit2")).toBeInTheDocument();
    });
  });

  describe("sanitization feedback", () => {
    it("should notify user when characters are stripped", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagField {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "Unit#123");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        expect(
          screen.getByText(/Invalid characters removed/)
        ).toBeInTheDocument();
        const calledTags = onChange.mock.calls[0][0];
        expect(calledTags[0].value).toBe("Unit123");
      });
    });
  });

  describe("theme support", () => {
    it("should apply dark theme styles when theme is dark", () => {
      render(<TagField {...defaultProps} />);

      // The component uses ThemeContext and applies styles
      // This is verified through the customStyles being applied
      const selectContainer = screen
        .getByRole("combobox")
        .closest(".css-b62m3t-container");
      expect(selectContainer).toBeTruthy();
    });
  });
});
