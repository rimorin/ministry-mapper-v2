import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test/test-wrapper";
import type { territoryDetails } from "../../utils/interface";
import UnboundedTerritories from "./unboundedterritories";

const territory = (code: string): territoryDetails => ({
  id: `id-${code}`,
  code,
  name: `${code} Street`,
  aggregates: 40
});

const setup = (territories: territoryDetails[]) => {
  const handleSelect = vi.fn();
  render(
    <UnboundedTerritories
      territories={territories}
      handleSelect={handleSelect}
    />
  );
  return { handleSelect };
};

const trigger = () => screen.getByRole("button", { name: /no boundary/i });

describe("UnboundedTerritories", () => {
  it("names the territories directly when there are only a few", () => {
    setup([territory("W18"), territory("M20")]);

    expect(trigger()).toHaveTextContent("W18, M20");
    expect(trigger()).not.toHaveTextContent("+");
  });

  it("collapses the rest into a count", () => {
    setup([territory("W18"), territory("M20"), territory("M21")]);

    expect(trigger()).toHaveTextContent("W18, M20");
    expect(trigger()).toHaveTextContent("+1");
    expect(trigger()).not.toHaveTextContent("M21");
  });

  it("lists every territory when opened", async () => {
    setup([territory("W18"), territory("M20"), territory("M21")]);
    await userEvent.click(trigger());

    expect(screen.getByText("Not shown on map")).toBeInTheDocument();
    expect(screen.getByText("M21 Street")).toBeInTheDocument();
  });

  it("selects a territory from the list", async () => {
    const { handleSelect } = setup([territory("W18"), territory("M20")]);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole("button", { name: /M20 Street/ }));

    expect(handleSelect).toHaveBeenCalledWith("id-M20", expect.anything());
  });
});
