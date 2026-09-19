import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import SubmitButton from "./submit-button";

const spinnerIn = (container: HTMLElement) =>
  container.querySelector("svg[data-icon='inline-start']");

describe("SubmitButton", () => {
  describe("rendering", () => {
    it("should render its label", () => {
      render(<SubmitButton pending={false}>Save</SubmitButton>);

      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("should have submit type", () => {
      render(<SubmitButton pending={false}>Save</SubmitButton>);

      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });
  });

  describe("button state", () => {
    it("should be enabled when not pending", () => {
      render(<SubmitButton pending={false}>Save</SubmitButton>);

      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    it("should be disabled when pending", () => {
      render(<SubmitButton pending={true}>Save</SubmitButton>);

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should be disabled when the disabled prop is true", () => {
      render(
        <SubmitButton pending={false} disabled={true}>
          Save
        </SubmitButton>
      );

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should be disabled when both pending and disabled are true", () => {
      render(
        <SubmitButton pending={true} disabled={true}>
          Save
        </SubmitButton>
      );

      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("spinner display", () => {
    it("should show the spinner when pending", () => {
      const { container } = render(
        <SubmitButton pending={true}>Save</SubmitButton>
      );

      expect(screen.getByRole("button")).toBeDisabled();
      expect(spinnerIn(container)).toBeInTheDocument();
    });

    it("should not show the spinner when not pending", () => {
      const { container } = render(
        <SubmitButton pending={false}>Save</SubmitButton>
      );

      expect(spinnerIn(container)).not.toBeInTheDocument();
    });

    it("should hide the spinner from assistive tech", () => {
      const { container } = render(
        <SubmitButton pending={true}>Save</SubmitButton>
      );

      expect(
        container.querySelector(
          "svg[aria-hidden='true'][data-icon='inline-start']"
        )
      ).toBeInTheDocument();
    });
  });
});
