const AVATAR_SIZE = 512;

/**
 * Crops an image to a centred square and re-encodes it as a 512px JPEG.
 * Phone photos are often several MB, so this keeps uploads small and fast.
 */
export const prepareAvatarImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (PNG, JPG or WebP).");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("We couldn't read that image. Try a JPG, PNG or WebP photo.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Your browser couldn't process this photo. Please try another browser.");
  }

  const side = Math.min(bitmap.width, bitmap.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
  context.imageSmoothingQuality = "high";
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) {
    throw new Error("Could not prepare this photo. Please try another one.");
  }
  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
};
