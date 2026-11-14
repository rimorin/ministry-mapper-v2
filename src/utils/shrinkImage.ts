// Makes a photo small enough to send to the assistant: redrawn on a canvas at
// a size that keeps unit numbers legible, as a JPEG. Redrawing also turns the
// photo upright and drops what the file carries besides the picture, such as
// where it was taken.

// Mirrors MaxImageLength in the backend's assistant package.
export const MAX_IMAGE_LENGTH = 2_000_000;

// Longest side and JPEG quality, tried in order until the result fits.
const ATTEMPTS: Array<[side: number, quality: number]> = [
  [2000, 0.85],
  [1600, 0.8],
  [1200, 0.75]
];

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export const isPhoto = (file: Blob) => ACCEPTED.includes(file.type);

const load = (file: Blob) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The photo could not be read"));
    };
    image.src = url;
  });

// Returns the photo as a JPEG data URL, or throws when it is not a photo the
// assistant takes or cannot be made small enough.
export const shrinkImage = async (file: Blob): Promise<string> => {
  if (!isPhoto(file)) throw new Error("Not a JPEG, PNG or WebP");
  const image = await load(file);
  const longest = Math.max(image.naturalWidth, image.naturalHeight);
  if (!longest) throw new Error("The photo is empty");
  for (const [side, quality] of ATTEMPTS) {
    const scale = Math.min(1, side / longest);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The photo could not be drawn");
    // A transparent PNG would turn black as a JPEG.
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (
      dataUrl.startsWith("data:image/jpeg;base64,") &&
      dataUrl.length <= MAX_IMAGE_LENGTH
    ) {
      return dataUrl;
    }
  }
  throw new Error("The photo is too large");
};
