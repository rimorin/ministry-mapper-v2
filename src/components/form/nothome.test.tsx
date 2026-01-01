import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test";
import HHNotHomeField from "./nothome";
import { NOT_HOME_STATUS_CODES } from "../../utils/constants";

describe("HHNotHomeField", () => {
  const defaultProps = {
    handleGroupChange: vi.fn(),
    changeValue: NOT_HOME_STATUS_CODES.DEFAULT
  };

  describe("rendering", () => {
    it("should render number of tries label", () => {
      render(<HHNotHomeField {...defaultProps} />);

      expect(screen.getByText(/Number of tries/i)).toBeInTheDocument();
    });

    it("should render all try buttons", () => {
      render(<HHNotHomeField {...defaultProps} />);

      expect(screen.getByText("1st")).toBeInTheDocument();
      expect(screen.getByText("2nd")).toBeInTheDocument();
      expect(screen.getByText("3rd")).toBeInTheDocument();
      expect(screen.getByText("4th")).toBeInTheDocument();
    });

    it("should have radio type toggle buttons", () => {
      const { container } = render(<HHNotHomeField {...defaultProps} />);

      const toggleGroup = container.querySelector('[name="nhcount"]');
      expect(toggleGroup).toBeInTheDocument();
    });
  });

  describe("button states", () => {
    it("should select first try by default", () => {
      render(
        <HHNotHomeField
          {...defaultProps}
          changeValue={NOT_HOME_STATUS_CODES.DEFAULT}
        />
      );

      const firstButton = screen.getByLabelText("1st");
      expect(firstButton).toBeChecked();
    });

    it("should select second try when value is second try", () => {
      render(
        <HHNotHomeField
          {...defaultProps}
          changeValue={NOT_HOME_STATUS_CODES.SECOND_TRY}
        />
      );

      const secondButton = screen.getByLabelText("2nd");
      expect(secondButton).toBeChecked();
    });

    it("should select third try when value is third try", () => {
      render(
        <HHNotHomeField
          {...defaultProps}
          changeValue={NOT_HOME_STATUS_CODES.THIRD_TRY}
        />
      );

      const thirdButton = screen.getByLabelText("3rd");
      expect(thirdButton).toBeChecked();
    });

    it("should select fourth try when value is fourth try", () => {
      render(
        <HHNotHomeField
          {...defaultProps}
          changeValue={NOT_HOME_STATUS_CODES.FOURTH_TRY}
        />
      );

      const fourthButton = screen.getByLabelText("4th");
      expect(fourthButton).toBeChecked();
    });
  });

  describe("user interaction", () => {
    it("should call handleGroupChange when button is clicked", async () => {
      const handleGroupChange = vi.fn();
      const user = userEvent.setup();

      render(
        <HHNotHomeField
          {...defaultProps}
          handleGroupChange={handleGroupChange}
        />
      );

      const secondButton = screen.getByText("2nd");
      await user.click(secondButton);

      expect(handleGroupChange).toHaveBeenCalled();
    });
  });

  describe("button styling", () => {
    it("should have outline-secondary variant for all buttons", () => {
      const { container } = render(<HHNotHomeField {...defaultProps} />);

      const buttons = container.querySelectorAll(".btn-outline-secondary");
      expect(buttons.length).toBe(4);
    });

    it("should have correct button structure", () => {
      render(<HHNotHomeField {...defaultProps} />);

      expect(screen.getByLabelText("1st")).toBeInTheDocument();
      expect(screen.getByLabelText("2nd")).toBeInTheDocument();
      expect(screen.getByLabelText("3rd")).toBeInTheDocument();
      expect(screen.getByLabelText("4th")).toBeInTheDocument();
    });
  });

  describe("layout", () => {
    it("should wrap buttons in input group", () => {
      const { container } = render(<HHNotHomeField {...defaultProps} />);

      const inputGroup = container.querySelector(".input-group");
      expect(inputGroup).toBeInTheDocument();
    });

    it("should center the toggle button group", () => {
      const { container } = render(<HHNotHomeField {...defaultProps} />);

      const centered = container.querySelector(".justify-content-center");
      expect(centered).toBeInTheDocument();
    });

    it("should have group-wrap class on button group", () => {
      const { container } = render(<HHNotHomeField {...defaultProps} />);

      const buttonGroup = container.querySelector(".group-wrap");
      expect(buttonGroup).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper button labels", () => {
      render(<HHNotHomeField {...defaultProps} />);

      const buttons = screen.getAllByRole("radio");
      expect(buttons).toHaveLength(4);
    });

    it("should have unique IDs for each button", () => {
      const { container } = render(<HHNotHomeField {...defaultProps} />);

      const button1 = container.querySelector("#nh-status-tb-0");
      const button2 = container.querySelector("#nh-status-tb-1");
      const button3 = container.querySelector("#nh-status-tb-2");
      const button4 = container.querySelector("#nh-status-tb-3");

      expect(button1).toBeInTheDocument();
      expect(button2).toBeInTheDocument();
      expect(button3).toBeInTheDocument();
      expect(button4).toBeInTheDocument();
    });
  });
});
