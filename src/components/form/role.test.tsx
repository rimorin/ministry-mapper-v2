import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test";
import UserRoleField from "./role";
import { USER_ACCESS_LEVELS } from "../../utils/constants";

describe("UserRoleField", () => {
  const defaultProps = {
    handleRoleChange: vi.fn(),
    role: USER_ACCESS_LEVELS.CONDUCTOR.CODE
  };

  describe("rendering - update mode", () => {
    it("should render all role buttons in update mode", () => {
      render(<UserRoleField {...defaultProps} isUpdate={true} />);

      expect(screen.getByText("No Access")).toBeInTheDocument();
      expect(screen.getByText("Read-only")).toBeInTheDocument();
      expect(screen.getByText("Conductor")).toBeInTheDocument();
      expect(screen.getByText("Administrator")).toBeInTheDocument();
    });

    it("should render No Access button in update mode", () => {
      render(<UserRoleField {...defaultProps} isUpdate={true} />);

      const noAccessButton = screen.getByText("No Access");
      expect(noAccessButton).toBeInTheDocument();
    });
  });

  describe("rendering - create mode", () => {
    it("should not render No Access button in create mode", () => {
      render(<UserRoleField {...defaultProps} isUpdate={false} />);

      expect(screen.queryByText("No Access")).not.toBeInTheDocument();
    });

    it("should render other role buttons in create mode", () => {
      render(<UserRoleField {...defaultProps} isUpdate={false} />);

      expect(screen.getByText("Read-only")).toBeInTheDocument();
      expect(screen.getByText("Conductor")).toBeInTheDocument();
      expect(screen.getByText("Administrator")).toBeInTheDocument();
    });
  });

  describe("button states", () => {
    it("should select conductor role by default", () => {
      render(
        <UserRoleField
          {...defaultProps}
          role={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
        />
      );

      const conductorButton = screen.getByLabelText("Conductor");
      expect(conductorButton).toBeChecked();
    });

    it("should select read-only role", () => {
      render(
        <UserRoleField
          {...defaultProps}
          role={USER_ACCESS_LEVELS.READ_ONLY.CODE}
        />
      );

      const readOnlyButton = screen.getByLabelText("Read-only");
      expect(readOnlyButton).toBeChecked();
    });

    it("should select administrator role", () => {
      render(
        <UserRoleField
          {...defaultProps}
          role={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
        />
      );

      const adminButton = screen.getByLabelText("Administrator");
      expect(adminButton).toBeChecked();
    });

    it("should select no access role in update mode", () => {
      render(
        <UserRoleField
          {...defaultProps}
          role={USER_ACCESS_LEVELS.NO_ACCESS.CODE}
          isUpdate={true}
        />
      );

      const noAccessButton = screen.getByLabelText("No Access");
      expect(noAccessButton).toBeChecked();
    });
  });

  describe("user interaction", () => {
    it("should call handleRoleChange when button is clicked", async () => {
      const handleRoleChange = vi.fn();
      const user = userEvent.setup();

      render(
        <UserRoleField {...defaultProps} handleRoleChange={handleRoleChange} />
      );

      const readOnlyButton = screen.getByText("Read-only");
      await user.click(readOnlyButton);

      expect(handleRoleChange).toHaveBeenCalled();
    });
  });

  describe("button variants", () => {
    it("should have correct variant classes", () => {
      const { container } = render(
        <UserRoleField {...defaultProps} isUpdate={true} />
      );

      const buttons = container.querySelectorAll(
        ".btn-outline-danger, .btn-outline-secondary, .btn-outline-success, .btn-outline-primary"
      );
      expect(buttons.length).toBe(4);
    });
  });

  describe("styling", () => {
    it("should have fluid-button class on all buttons", () => {
      const { container } = render(
        <UserRoleField {...defaultProps} isUpdate={true} />
      );

      const fluidButtons = container.querySelectorAll(".fluid-button");
      expect(fluidButtons.length).toBe(4);
    });

    it("should have centered text", () => {
      const { container } = render(<UserRoleField {...defaultProps} />);

      const centered = container.querySelector(".text-center");
      expect(centered).toBeInTheDocument();
    });
  });

  describe("form group", () => {
    it("should be part of form group", () => {
      const { container } = render(<UserRoleField {...defaultProps} />);

      const formGroup = container.querySelector(".mb-1");
      expect(formGroup).toBeInTheDocument();
    });

    it("should have radio type toggle buttons", () => {
      const { container } = render(<UserRoleField {...defaultProps} />);

      const toggleGroup = container.querySelector('[name="status"]');
      expect(toggleGroup).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper button labels", () => {
      render(<UserRoleField {...defaultProps} isUpdate={false} />);

      const buttons = screen.getAllByRole("radio");
      expect(buttons).toHaveLength(3);
    });

    it("should have unique IDs for each button", () => {
      const { container } = render(
        <UserRoleField {...defaultProps} isUpdate={true} />
      );

      expect(container.querySelector("#status-tb-0")).toBeInTheDocument();
      expect(container.querySelector("#status-tb-1")).toBeInTheDocument();
      expect(container.querySelector("#status-tb-2")).toBeInTheDocument();
      expect(container.querySelector("#status-tb-4")).toBeInTheDocument();
    });
  });

  describe("default prop values", () => {
    it("should use isUpdate=true by default", () => {
      const { handleRoleChange, role } = defaultProps;
      render(<UserRoleField handleRoleChange={handleRoleChange} role={role} />);

      expect(screen.getByText("No Access")).toBeInTheDocument();
    });
  });
});
