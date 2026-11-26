export type ImageInputCapability = "supported" | "unknown";

type ConfirmedImageModel = {
  providerId: string;
  modelIds: readonly string[];
  presetIds?: readonly string[];
};

// Only exact provider + model ID pairs maintained by the platform belong here.
// Keep unverified models unknown; a successful connection test does not confirm vision support.
const PLATFORM_CONFIRMED_IMAGE_MODELS: readonly ConfirmedImageModel[] = [
  { providerId: "qwen", modelIds: ["qwen-plus", "qwen3.8-max"], presetIds: ["qwen3.8-max"] },
];

export function getImageInputCapability(
  providerId: string | undefined,
  modelId: string | undefined,
): ImageInputCapability {
  const normalizedModelId = modelId?.trim().toLowerCase();
  const platformConfirmed = PLATFORM_CONFIRMED_IMAGE_MODELS.some(
    (item) => (item.providerId === providerId || (!providerId && item.presetIds?.some((id) => id.toLowerCase() === normalizedModelId)))
      && item.modelIds.some((id) => id.toLowerCase() === normalizedModelId),
  );

  return platformConfirmed ? "supported" : "unknown";
}

export function isPlatformConfirmedImageModel(providerId: string | undefined, modelId: string | undefined) {
  const normalizedModelId = modelId?.trim().toLowerCase();
  return PLATFORM_CONFIRMED_IMAGE_MODELS.some(
    (item) => (item.providerId === providerId || (!providerId && item.presetIds?.some((id) => id.toLowerCase() === normalizedModelId)))
      && item.modelIds.some((id) => id.toLowerCase() === normalizedModelId),
  );
}

export function isPlatformConfirmedPresetImageModel(presetId: string) {
  const normalizedPresetId = presetId.trim().toLowerCase();
  return PLATFORM_CONFIRMED_IMAGE_MODELS.some((item) =>
    item.presetIds?.some((id) => id.toLowerCase() === normalizedPresetId),
  );
}
