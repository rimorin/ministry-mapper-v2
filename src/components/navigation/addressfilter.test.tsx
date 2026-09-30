import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, userEvent } from "../../utils/test/test-wrapper";
import { STATUS_CODES } from "../../utils/constants";
import { ANALYTICS_EVENTS } from "../../utils/analytics";
import type { AddressFilter, HHOptionProps } from "../../utils/interface";
import { EMPTY_ADDRESS_FILTER } from "../../hooks/useAddressFilter";
import AddressFilterPopover from "./addressfilter";

type Umami = NonNullable<Window["umami"]>;

const mockTrack = vi.fn();

beforeEach(() => {
  window.umami = { track: mockTrack, identify: vi.fn() } as unknown as Umami;
});

afterEach(() => {
  vi.clearAllMocks();
  delete window.umami;
});

const option = (id: string, description: string): HHOptionProps => ({
  id,
  code: id,
  description,
  isCountable: true,
  sequence: 1
});

const setup = (
  filter: AddressFilter = EMPTY_ADDRESS_FILTER,
  options = [option("chinese", "Chinese"), option("malay", "Malay")]
) => {
  const onChange = vi.fn();
  render(
    <AddressFilterPopover
      filter={filter}
      onChange={onChange}
      options={options}
      surface="publisher"
      trigger={<button type="button">Filter</button>}
    />
  );
  return { onChange };
};

const open = () =>
  userEvent.click(screen.getByRole("button", { name: "Filter" }));

describe("AddressFilterPopover", () => {
  it("adds a status to the filter", async () => {
    const { onChange } = setup();
    await open();
    await userEvent.click(screen.getByRole("button", { name: /not home/i }));

    expect(onChange).toHaveBeenCalledWith({
      statuses: [STATUS_CODES.NOT_HOME],
      types: []
    });
  });

  it("adds a household type alongside the statuses already chosen", async () => {
    const { onChange } = setup({ statuses: [STATUS_CODES.DONE], types: [] });
    await open();
    await userEvent.click(screen.getByRole("checkbox", { name: /^Malay/ }));

    expect(onChange).toHaveBeenCalledWith({
      statuses: [STATUS_CODES.DONE],
      types: ["malay"]
    });
  });

  it("leaves out the household group when there is only one type", async () => {
    setup(EMPTY_ADDRESS_FILTER, [option("chinese", "Chinese")]);
    await open();

    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("removes a household type when it is unticked", async () => {
    const { onChange } = setup({ statuses: [], types: ["chinese", "malay"] });
    await open();
    await userEvent.click(screen.getByRole("checkbox", { name: /^Chinese/ }));

    expect(onChange).toHaveBeenCalledWith({ statuses: [], types: ["malay"] });
  });

  it("offers a search once the household list gets long", async () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      option(`type${i}`, `Type ${i}`)
    );
    setup(EMPTY_ADDRESS_FILTER, [...many, option("malay", "Malay")]);
    await open();
    await userEvent.type(screen.getByRole("textbox"), "mal");

    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(
      screen.getByRole("checkbox", { name: /^Malay/ })
    ).toBeInTheDocument();
  });

  it("clears every selection", async () => {
    const { onChange } = setup({
      statuses: [STATUS_CODES.DONE],
      types: ["malay"]
    });
    await open();
    await userEvent.click(screen.getByRole("button", { name: /clear/i }));

    expect(onChange).toHaveBeenCalledWith(EMPTY_ADDRESS_FILTER);
  });

  it("reports the filter once, when the popover closes", async () => {
    setup({ statuses: [STATUS_CODES.NOT_HOME], types: ["malay"] });
    await open();
    await userEvent.keyboard("{Escape}");

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ADDRESS_FILTER_APPLIED,
      { surface: "publisher", statuses: STATUS_CODES.NOT_HOME, types: 1 }
    );
  });
});
