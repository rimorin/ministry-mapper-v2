import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test";
import GenericInputField from "./input";

describe("GenericInputField", () => {
  const defaultProps = {
    handleChange: vi.fn(),
    changeValue: "",
    name: "testInput",
    label: "Test Label"
  };

  describe("rendering", () => {
    it("should render label and input field", () => {
      render(<GenericInputField {...defaultProps} />);

      expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render with placeholder text", () => {
      render(
        <GenericInputField {...defaultProps} placeholder="Enter value here" />
      );

      expect(
        screen.getByPlaceholderText("Enter value here")
      ).toBeInTheDocument();
    });

    it("should render with information text", () => {
      render(
        <GenericInputField
          {...defaultProps}
          information="This is a helper text"
        />
      );

      expect(screen.getByText("This is a helper text")).toBeInTheDocument();
    });

    it("should display current value", () => {
      render(<GenericInputField {...defaultProps} changeValue="Test Value" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("Test Value");
    });
  });

  describe("input types", () => {
    it("should render as text input by default", () => {
      render(<GenericInputField {...defaultProps} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "string");
    });

    it("should render as email input", () => {
      render(<GenericInputField {...defaultProps} inputType="email" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "email");
    });

    it("should render as password input", () => {
      render(
        <GenericInputField
          {...defaultProps}
          inputType="password"
          label="Password"
        />
      );

      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("type", "password");
    });

    it("should render as number input", () => {
      render(<GenericInputField {...defaultProps} inputType="number" />);

      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("type", "number");
    });
  });

  describe("user interaction", () => {
    it("should call handleChange when user types", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(
        <GenericInputField {...defaultProps} handleChange={handleChange} />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "abc");

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(3); // Once per character
    });

    it("should call handleClick when input is clicked", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<GenericInputField {...defaultProps} handleClick={handleClick} />);

      const input = screen.getByRole("textbox");
      await user.click(input);

      expect(handleClick).toHaveBeenCalled();
    });

    it("should not allow input when readOnly is true", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(
        <GenericInputField
          {...defaultProps}
          handleChange={handleChange}
          readOnly={true}
          changeValue="Read only value"
        />
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("readonly");

      await user.type(input, "abc");
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("should have required attribute when required is true", () => {
      render(<GenericInputField {...defaultProps} required={true} />);

      const input = screen.getByRole("textbox");
      expect(input).toBeRequired();
    });

    it("should not have required attribute by default", () => {
      render(<GenericInputField {...defaultProps} />);

      const input = screen.getByRole("textbox");
      expect(input).not.toBeRequired();
    });
  });

  describe("accessibility", () => {
    it("should associate label with input using htmlFor", () => {
      render(
        <GenericInputField {...defaultProps} name="email" label="Email" />
      );

      const input = screen.getByLabelText("Email");
      expect(input).toHaveAttribute("id", "basicFormemailText");
    });

    it("should have proper form control ID", () => {
      render(<GenericInputField {...defaultProps} name="username" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("id", "basicFormusernameText");
    });
  });

  describe("focus", () => {
    it("should auto-focus when focus prop is true", () => {
      render(<GenericInputField {...defaultProps} focus={true} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveFocus();
    });

    it("should not auto-focus by default", () => {
      render(<GenericInputField {...defaultProps} />);

      const input = screen.getByRole("textbox");
      expect(input).not.toHaveFocus();
    });
  });

  describe("autocomplete", () => {
    it("should set autocomplete attribute when provided", () => {
      render(<GenericInputField {...defaultProps} autoComplete="email" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("autocomplete", "email");
    });

    it("should not have autocomplete attribute when not provided", () => {
      render(<GenericInputField {...defaultProps} />);

      const input = screen.getByRole("textbox");
      expect(input).not.toHaveAttribute("autocomplete");
    });
  });

  describe("form integration", () => {
    it("should use name attribute for form submission", () => {
      render(<GenericInputField {...defaultProps} name="userEmail" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("name", "userEmail");
    });

    it("should be part of Form.Group", () => {
      const { container } = render(<GenericInputField {...defaultProps} />);

      const formGroup = container.querySelector(".mb-3");
      expect(formGroup).toBeInTheDocument();
    });
  });
});
