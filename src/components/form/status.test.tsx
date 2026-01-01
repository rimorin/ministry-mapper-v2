import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test";
import HHStatusField from "./status";
import { STATUS_CODES } from "../../utils/constants";

describe("HHStatusField", () => {
  const defaultProps = {
    handleGroupChange: vi.fn(),
    changeValue: STATUS_CODES.DEFAULT
  };

  describe("rendering", () => {
    it("should render all status buttons", () => {
      render(<HHStatusField {...defaultProps} />);

      expect(screen.getByText("Not Done")).toBeInTheDocument();
      expect(screen.getByText("Done")).toBeInTheDocument();
      expect(screen.getByText("Not Home")).toBeInTheDocument();
      expect(screen.getByText("DNC")).toBeInTheDocument();
      expect(screen.getByText("Invalid")).toBeInTheDocument();
    });

    it("should have radio type toggle buttons", () => {
      const { container } = render(<HHStatusField {...defaultProps} />);

      const toggleGroup = container.querySelector('[name="status"]');
      expect(toggleGroup).toBeInTheDocument();
    });
  });

  describe("button states", () => {
    it("should select Not Done by default", () => {
      render(
        <HHStatusField {...defaultProps} changeValue={STATUS_CODES.DEFAULT} />
      );

      const notDoneButton = screen.getByLabelText("Not Done");
      expect(notDoneButton).toBeChecked();
    });

    it("should select Done status", () => {
      render(
        <HHStatusField {...defaultProps} changeValue={STATUS_CODES.DONE} />
      );

      const doneButton = screen.getByLabelText("Done");
      expect(doneButton).toBeChecked();
    });

    it("should select Not Home status", () => {
      render(
        <HHStatusField {...defaultProps} changeValue={STATUS_CODES.NOT_HOME} />
      );

      const notHomeButton = screen.getByLabelText("Not Home");
      expect(notHomeButton).toBeChecked();
    });

    it("should select DNC status", () => {
      render(
        <HHStatusField
          {...defaultProps}
          changeValue={STATUS_CODES.DO_NOT_CALL}
        />
      );

      const dncButton = screen.getByLabelText("DNC");
      expect(dncButton).toBeChecked();
    });

    it("should select Invalid status", () => {
      render(
        <HHStatusField {...defaultProps} changeValue={STATUS_CODES.INVALID} />
      );

      const invalidButton = screen.getByLabelText("Invalid");
      expect(invalidButton).toBeChecked();
    });
  });

  describe("user interaction", () => {
    it("should call handleGroupChange when button is clicked", async () => {
      const handleGroupChange = vi.fn();
      const user = userEvent.setup();

      render(
        <HHStatusField
          {...defaultProps}
          handleGroupChange={handleGroupChange}
        />
      );

      const doneButton = screen.getByText("Done");
      await user.click(doneButton);

      expect(handleGroupChange).toHaveBeenCalled();
    });
  });

  describe("button variants", () => {
    it("should have correct variant classes", () => {
      const { container } = render(<HHStatusField {...defaultProps} />);

      const buttons = container.querySelectorAll(
        ".btn-outline-dark, .btn-outline-success, .btn-outline-secondary, .btn-outline-danger, .btn-outline-info"
      );
      expect(buttons.length).toBe(5);
    });
  });

  describe("styling", () => {
    it("should have fluid-button class on all buttons", () => {
      const { container } = render(<HHStatusField {...defaultProps} />);

      const fluidButtons = container.querySelectorAll(".fluid-button");
      expect(fluidButtons.length).toBe(5);
    });

    it("should have centered text", () => {
      const { container } = render(<HHStatusField {...defaultProps} />);

      const centered = container.querySelector(".text-center");
      expect(centered).toBeInTheDocument();
    });
  });

  describe("form group", () => {
    it("should be part of form group", () => {
      const { container } = render(<HHStatusField {...defaultProps} />);

      const formGroup = container.querySelector(".mb-1");
      expect(formGroup).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper button labels", () => {
      render(<HHStatusField {...defaultProps} />);

      const buttons = screen.getAllByRole("radio");
      expect(buttons).toHaveLength(5);
    });

    it("should have unique IDs for each button", () => {
      const { container } = render(<HHStatusField {...defaultProps} />);

      expect(container.querySelector("#status-tb-0")).toBeInTheDocument();
      expect(container.querySelector("#status-tb-1")).toBeInTheDocument();
      expect(container.querySelector("#status-tb-2")).toBeInTheDocument();
      expect(container.querySelector("#status-tb-4")).toBeInTheDocument();
      expect(container.querySelector("#status-tb-5")).toBeInTheDocument();
    });
  });
});
