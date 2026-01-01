import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test";
import GenericTextAreaField from "./textarea";

describe("GenericTextAreaField", () => {
  const defaultProps = {
    handleChange: vi.fn(),
    changeValue: "",
    name: "notes",
    label: "Notes"
  };

  describe("rendering", () => {
    it("should render textarea with label", () => {
      render(<GenericTextAreaField {...defaultProps} />);

      expect(screen.getByLabelText("Notes")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render without label when not provided", () => {
      const propsWithoutLabel = {
        handleChange: defaultProps.handleChange,
        changeValue: defaultProps.changeValue,
        name: defaultProps.name
      };
      render(<GenericTextAreaField {...propsWithoutLabel} />);

      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.queryByText("Notes")).not.toBeInTheDocument();
    });

    it("should display placeholder text", () => {
      render(
        <GenericTextAreaField
          {...defaultProps}
          placeholder="Enter your notes here"
        />
      );

      expect(
        screen.getByPlaceholderText("Enter your notes here")
      ).toBeInTheDocument();
    });

    it("should display current value", () => {
      render(
        <GenericTextAreaField {...defaultProps} changeValue="Existing notes" />
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("Existing notes");
    });

    it("should display information text", () => {
      render(
        <GenericTextAreaField
          {...defaultProps}
          information="Maximum 500 characters"
        />
      );

      expect(screen.getByText("Maximum 500 characters")).toBeInTheDocument();
    });
  });

  describe("textarea rows", () => {
    it("should use 3 rows by default", () => {
      render(<GenericTextAreaField {...defaultProps} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("rows", "3");
    });

    it("should use custom row count", () => {
      render(<GenericTextAreaField {...defaultProps} rows={5} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("rows", "5");
    });
  });

  describe("user interaction", () => {
    it("should call handleChange when user types", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(
        <GenericTextAreaField {...defaultProps} handleChange={handleChange} />
      );

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Hello");

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(5); // Once per character
    });

    it("should not allow input when readOnly is true", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(
        <GenericTextAreaField
          {...defaultProps}
          handleChange={handleChange}
          readOnly={true}
          changeValue="Read only text"
        />
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("readonly");

      await user.type(textarea, "test");
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("should be required when required prop is true", () => {
      render(<GenericTextAreaField {...defaultProps} required={true} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeRequired();
    });

    it("should not be required by default", () => {
      render(<GenericTextAreaField {...defaultProps} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).not.toBeRequired();
    });
  });

  describe("accessibility", () => {
    it("should associate label with textarea", () => {
      render(<GenericTextAreaField {...defaultProps} name="comments" />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("id", "formBasiccommentsTextAreaField");
    });

    it("should have proper name attribute", () => {
      render(<GenericTextAreaField {...defaultProps} name="description" />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("name", "description");
    });
  });

  describe("form integration", () => {
    it("should be part of Form.Group", () => {
      const { container } = render(<GenericTextAreaField {...defaultProps} />);

      const formGroup = container.querySelector(".mb-3");
      expect(formGroup).toBeInTheDocument();
    });
  });
});
