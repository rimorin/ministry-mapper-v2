import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import {
  Combobox,
  ComboboxActions,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  ComboboxTrigger
} from "./combobox";

type Option = { value: string; label: string };

const Harness = ({
  items,
  searching = false,
  open = true
}: {
  items: Option[];
  searching?: boolean;
  open?: boolean;
}) => (
  <Combobox
    items={items}
    defaultOpen={open}
    itemToStringLabel={(i: Option) => i.label}
  >
    <ComboboxInputGroup>
      <ComboboxInput />
      <ComboboxActions>
        <ComboboxClear />
        <ComboboxTrigger />
      </ComboboxActions>
    </ComboboxInputGroup>
    <ComboboxContent>
      <ComboboxStatus>{searching && "Searching..."}</ComboboxStatus>
      <ComboboxEmpty>No results found.</ComboboxEmpty>
      <ComboboxList>
        {(item: Option) => (
          <ComboboxItem key={item.value} value={item}>
            {item.label}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>
);

const region = (slot: string) =>
  document.querySelector(`[data-slot="combobox-${slot}"]`);

describe("Combobox", () => {
  it("renders an item per entry", () => {
    render(<Harness items={[{ value: "1", label: "Ada" }]} />);

    expect(screen.getByText("Ada")).toBeInTheDocument();
  });

  // Base UI keeps Status and Empty mounted as aria-live regions, so the padded
  // box has to be an inner child. If it ever moves onto the region itself,
  // the popup gains a permanent blank row -- these two guard that.
  it("leaves the live regions empty while results are showing", () => {
    render(<Harness items={[{ value: "1", label: "Ada" }]} />);

    expect(region("status")).toBeEmptyDOMElement();
    expect(region("empty")).toBeEmptyDOMElement();
  });

  it("shows the empty and status messages only when they apply", () => {
    render(<Harness items={[]} searching />);

    expect(region("empty")).toHaveTextContent("No results found.");
    expect(region("status")).toHaveTextContent("Searching...");
  });

  it("gives the open control a translated label", () => {
    render(<Harness items={[]} open={false} />);

    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
  });
});
