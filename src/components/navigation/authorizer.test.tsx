import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import ComponentAuthorizer from "./authorizer";

describe("ComponentAuthorizer", () => {
  describe("authorization logic", () => {
    it("should render children when user has sufficient permission", () => {
      render(
        <ComponentAuthorizer
          requiredPermission="conductor"
          userPermission="admin"
        >
          <button>Authorized Content</button>
        </ComponentAuthorizer>
      );

      expect(screen.getByText("Authorized Content")).toBeInTheDocument();
    });

    it("should render children when user has exact required permission", () => {
      render(
        <ComponentAuthorizer
          requiredPermission="conductor"
          userPermission="conductor"
        >
          <button>Authorized Content</button>
        </ComponentAuthorizer>
      );

      expect(screen.getByText("Authorized Content")).toBeInTheDocument();
    });

    it("should hide children when user lacks permission", () => {
      render(
        <ComponentAuthorizer
          requiredPermission="administrator"
          userPermission="conductor"
        >
          <button>Restricted Content</button>
        </ComponentAuthorizer>
      );

      expect(screen.queryByText("Restricted Content")).not.toBeInTheDocument();
    });

    it("should hide children when userPermission is undefined", () => {
      render(
        <ComponentAuthorizer
          requiredPermission="conductor"
          userPermission={undefined}
        >
          <button>Content</button>
        </ComponentAuthorizer>
      );

      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });
  });

  describe("permission levels", () => {
    it("should allow administrator to see admin-only content", () => {
      render(
        <ComponentAuthorizer
          requiredPermission="administrator"
          userPermission="administrator"
        >
          <div>Admin Only</div>
        </ComponentAuthorizer>
      );

      expect(screen.getByText("Admin Only")).toBeInTheDocument();
    });

    it("should allow administrator to see conductor content", () => {
      render(
        <ComponentAuthorizer
          requiredPermission="conductor"
          userPermission="administrator"
        >
          <div>Administrator Can See This</div>
        </ComponentAuthorizer>
      );

      expect(
        screen.getByText("Administrator Can See This")
      ).toBeInTheDocument();
    });

    it("should prevent read_only from seeing conductor content", () => {
      render(
        <ComponentAuthorizer
          requiredPermission="conductor"
          userPermission="read_only"
        >
          <div>Conductor Content</div>
        </ComponentAuthorizer>
      );

      expect(screen.queryByText("Conductor Content")).not.toBeInTheDocument();
    });

    it("should allow administrator to see any content", () => {
      render(
        <ComponentAuthorizer
          requiredPermission="read_only"
          userPermission="administrator"
        >
          <div>Basic Content</div>
        </ComponentAuthorizer>
      );

      expect(screen.getByText("Basic Content")).toBeInTheDocument();
    });
  });

  describe("rendering", () => {
    it("should render complex children correctly", () => {
      render(
        <ComponentAuthorizer
          requiredPermission="conductor"
          userPermission="administrator"
        >
          <div>
            <h1>Title</h1>
            <button>Action Button</button>
            <p>Description text</p>
          </div>
        </ComponentAuthorizer>
      );

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Action Button")).toBeInTheDocument();
      expect(screen.getByText("Description text")).toBeInTheDocument();
    });

    it("should return empty fragment when unauthorized", () => {
      render(
        <ComponentAuthorizer
          requiredPermission="administrator"
          userPermission="read_only"
        >
          <button>Hidden</button>
        </ComponentAuthorizer>
      );

      expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    });
  });
});
