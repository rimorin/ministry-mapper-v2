import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  expect,
  vi
} from "vitest";
import { act, render, screen, userEvent, waitFor } from "@/utils/test";
import { listenForInstall } from "../../utils/install";
import InstallCard from "./install-card";

const device = { touch: true, installed: false, apple: false };

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

const offerToInstall = (outcome: "accepted" | "dismissed") => {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(new Event("beforeinstallprompt"), {
    prompt,
    userChoice: Promise.resolve({ outcome })
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return prompt;
};

describe("InstallCard", () => {
  beforeAll(() => listenForInstall());

  beforeEach(() => {
    localStorage.clear();
    device.touch = true;
    device.installed = false;
    device.apple = false;
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches:
            (query === "(pointer: coarse)" && device.touch) ||
            (query === "(display-mode: standalone)" && device.installed),
          addEventListener: () => {},
          removeEventListener: () => {}
        }) as unknown as MediaQueryList
    );
    vi.spyOn(navigator, "userAgent", "get").mockImplementation(() =>
      device.apple ? IPHONE : ANDROID
    );
  });

  afterEach(() => {
    // Clears any offer left over from a test.
    window.dispatchEvent(new Event("appinstalled"));
    vi.restoreAllMocks();
  });

  it("walks an iPhone through adding the app from Safari", () => {
    device.apple = true;
    render(<InstallCard />);

    expect(screen.getByText("Keep your maps one tap away")).toBeInTheDocument();
    const [share, add] = screen.getAllByRole("listitem");
    expect(share).toHaveTextContent("Tap Share");
    expect(add).toHaveTextContent("Choose Add to Home Screen");
    // Safari's buttons are drawn in the sentence that names them.
    expect(share.querySelector("svg")).not.toBeNull();
    expect(add.querySelector("svg")).not.toBeNull();
    expect(
      screen.getByText("Don't see Share? Tap ⋯ first.")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add to Home Screen" })
    ).not.toBeInTheDocument();
  });

  it("installs on Android with the browser's own prompt", async () => {
    render(<InstallCard />);
    const prompt = offerToInstall("accepted");

    await userEvent.click(
      screen.getByRole("button", { name: "Add to Home Screen" })
    );

    expect(prompt).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByText(/Home Screen/)).not.toBeInTheDocument()
    );
    expect(localStorage.getItem("mm-install-dismissed")).toBe("1");
  });

  it("shows nothing on Android until the browser offers to install", () => {
    render(<InstallCard />);

    expect(screen.queryByText(/Home Screen/)).not.toBeInTheDocument();
  });

  it("stays away once dismissed", async () => {
    device.apple = true;
    const { unmount } = render(<InstallCard />);

    await userEvent.click(screen.getByRole("button", { name: "Not now" }));
    unmount();
    render(<InstallCard />);

    expect(screen.queryByText(/Home Screen/)).not.toBeInTheDocument();
  });

  it("is not shown inside the installed app", () => {
    device.apple = true;
    device.installed = true;
    render(<InstallCard />);

    expect(screen.queryByText(/Home Screen/)).not.toBeInTheDocument();
  });

  it("is not shown on a computer", () => {
    device.touch = false;
    render(<InstallCard />);
    offerToInstall("accepted");

    expect(screen.queryByText(/Home Screen/)).not.toBeInTheDocument();
  });
});
