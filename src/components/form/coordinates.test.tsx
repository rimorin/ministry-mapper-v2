import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  userEvent,
  waitFor,
  setNavigatorGeolocation,
  restoreBrowserStubs
} from "../../utils/test";
import AddressCoordinatesField from "./coordinates";

const SINGAPORE = { lat: 1.2814921, lng: 103.8635768 };

const stubPosition = () =>
  setNavigatorGeolocation({
    getCurrentPosition: (success: PositionCallback) =>
      success({
        coords: { latitude: SINGAPORE.lat, longitude: SINGAPORE.lng }
      } as GeolocationPosition)
  });

const stubFailure = () =>
  setNavigatorGeolocation({
    getCurrentPosition: (
      _success: PositionCallback,
      error: PositionErrorCallback
    ) => error({ code: 1 } as GeolocationPositionError)
  });

describe("AddressCoordinatesField", () => {
  afterEach(() => {
    restoreBrowserStubs();
    vi.restoreAllMocks();
  });

  it("says so when the address has no pin", () => {
    render(
      <AddressCoordinatesField onChange={vi.fn()} onSelectOnMap={vi.fn()} />
    );

    expect(screen.getByText("No pin set")).toBeTruthy();
  });

  it("reports a captured fix upward", async () => {
    stubPosition();
    const onChange = vi.fn();

    render(
      <AddressCoordinatesField onChange={onChange} onSelectOnMap={vi.fn()} />
    );
    await userEvent.click(screen.getByText("Use my location"));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(SINGAPORE));
  });

  it("keeps the map picker usable when no fix is available", async () => {
    stubFailure();
    const onChange = vi.fn();
    const onSelectOnMap = vi.fn();

    render(
      <AddressCoordinatesField
        onChange={onChange}
        onSelectOnMap={onSelectOnMap}
      />
    );
    await userEvent.click(screen.getByText("Use my location"));
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText("On map"));
    expect(onSelectOnMap).toHaveBeenCalled();
  });
});
