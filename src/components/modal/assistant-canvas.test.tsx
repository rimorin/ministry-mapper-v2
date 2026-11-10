import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, userEvent } from "@/utils/test";

const { getListMock } = vi.hoisted(() => ({ getListMock: vi.fn() }));

vi.mock("../../utils/pocketbase", () => ({
  getList: getListMock,
  isAbortError: (error: unknown) =>
    (error as { isAbort?: boolean })?.isAbort === true
}));

// jsdom cannot render Leaflet; the canvas's own logic is what is under test.
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="map">{children}</div>
  ),
  Polygon: () => <div data-testid="boundary" />,
  Marker: () => <div data-testid="destination" />,
  CircleMarker: () => <div data-testid="block" />,
  useMap: () => ({
    getContainer: () => document.createElement("div"),
    invalidateSize: vi.fn(),
    setView: vi.fn(),
    fitBounds: vi.fn()
  })
}));
vi.mock("../map/themedtilelayer", () => ({ ThemedTileLayer: () => null }));
vi.mock("../map/directionsmap", () => ({
  default: ({ coordinates }: { coordinates: { lat: number; lng: number } }) => (
    <div>Directions to {`${coordinates.lat},${coordinates.lng}`}</div>
  )
}));

const { default: AssistantCanvas } = await import("./assistant-canvas");

const territory = {
  id: "terr1",
  code: "M06",
  description: "Marsiling Rise",
  progress: 40,
  coordinates: [
    { lat: 1.44, lng: 103.77 },
    { lat: 1.44, lng: 103.78 },
    { lat: 1.45, lng: 103.78 }
  ]
};
const maps = [
  {
    id: "map1",
    description: "114, Marsiling Rise",
    type: "multi",
    progress: 95,
    coordinates: { lat: 1.441, lng: 103.771 },
    aggregates: { notDone: 2 }
  },
  {
    id: "map2",
    description: { en: "115, Marsiling Rise", zh: "马西岭115" },
    type: "multi",
    progress: 10,
    coordinates: { lat: 1.442, lng: 103.772 },
    aggregates: { notDone: 30 }
  }
];

const handlers = {
  onSelectPlace: vi.fn(),
  onClose: vi.fn(),
  onOpenInAdmin: vi.fn()
};

const show = (place: {
  kind: "territory" | "map";
  id: string;
  title: string;
}) =>
  render(
    <AssistantCanvas
      congregation="cong1"
      place={{ ...place, territoryId: "terr1" }}
      {...handlers}
    />
  );

describe("AssistantCanvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getListMock.mockImplementation((collection: string) =>
      Promise.resolve(collection === "territories" ? [territory] : maps)
    );
  });

  it("shows a territory's boundary, blocks and homes left", async () => {
    show({ kind: "territory", id: "terr1", title: "M06 · Marsiling Rise" });

    expect(await screen.findByTestId("boundary")).toBeInTheDocument();
    expect(screen.getAllByTestId("block")).toHaveLength(2);
    expect(screen.getByText("40% done")).toBeInTheDocument();
    expect(screen.getByText("32 homes not done")).toBeInTheDocument();
    expect(getListMock).toHaveBeenCalledWith(
      "territories",
      expect.objectContaining({
        filter: 'congregation="cong1" && id="terr1"'
      })
    );
  });

  it("opens a block from the list", async () => {
    show({ kind: "territory", id: "terr1", title: "M06" });
    await userEvent.click(await screen.findByText("115, Marsiling Rise"));
    expect(handlers.onSelectPlace).toHaveBeenCalledWith({
      kind: "map",
      id: "map2",
      title: "115, Marsiling Rise",
      territoryId: "terr1"
    });
  });

  it("gives directions to a block inside the canvas", async () => {
    show({ kind: "map", id: "map1", title: "114, Marsiling Rise" });
    expect(await screen.findByTestId("destination")).toBeInTheDocument();
    expect(screen.getByText("95% done")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Directions" }));
    expect(screen.getByText("Directions to 1.441,103.771")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.queryByText(/Directions to/)).toBeNull();
    expect(handlers.onClose).not.toHaveBeenCalled();
  });

  it("goes back to the chat", async () => {
    show({ kind: "territory", id: "terr1", title: "M06" });
    await userEvent.click(
      await screen.findByRole("button", { name: "Back to chat" })
    );
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("opens the territory in the admin view on request", async () => {
    show({ kind: "map", id: "map1", title: "114" });
    await userEvent.click(
      await screen.findByRole("button", { name: "Open in admin view" })
    );
    expect(handlers.onOpenInAdmin).toHaveBeenCalledWith("terr1");
  });

  it("says when a place cannot be loaded", async () => {
    getListMock.mockRejectedValue(new Error("offline"));
    show({ kind: "territory", id: "terr1", title: "M06" });
    expect(
      await screen.findByText(
        "This place could not be loaded. Please try again."
      )
    ).toBeInTheDocument();
  });

  it("numbers maps found nearby and opens one", async () => {
    render(
      <AssistantCanvas
        congregation="cong1"
        place={{
          kind: "nearby",
          title: "Nearby maps",
          origin: { lat: 1.44, lng: 103.77 },
          points: [
            {
              mapId: "map1",
              territoryId: "terr1",
              title: "114",
              lat: 1.441,
              lng: 103.771,
              distance: 120
            },
            {
              mapId: "map2",
              territoryId: "terr1",
              title: "115",
              lat: 1.442,
              lng: 103.772,
              distance: 1500
            }
          ]
        }}
        {...handlers}
      />
    );

    expect(screen.getAllByTestId("destination")).toHaveLength(3);
    expect(screen.getByText("120 m")).toBeInTheDocument();
    expect(screen.getByText("1.5 km")).toBeInTheDocument();
    expect(getListMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText("115"));
    expect(handlers.onSelectPlace).toHaveBeenCalledWith({
      kind: "map",
      id: "map2",
      title: "115",
      territoryId: "terr1"
    });
  });
});
