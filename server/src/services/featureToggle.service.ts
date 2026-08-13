import { FeatureToggle, DEFAULT_FEATURES } from '../models/featureToggle.model';
import { ApiError } from '../utils/ApiError';

let cachedToggles: Record<string, boolean> | null = null;

export const initializeDefaultFeatures = async () => {
  for (const feature of DEFAULT_FEATURES) {
    await FeatureToggle.updateOne({ key: feature.key }, { $setOnInsert: feature }, { upsert: true });
  }
};

export const getAllFeatures = async () => {
  const features = await FeatureToggle.find().sort({ category: 1, key: 1 }).lean();
  return features;
};

export const updateFeature = async (key: string, enabled: boolean, userId: string) => {
  const feature = await FeatureToggle.findOneAndUpdate({ key }, { enabled, updatedBy: userId }, { new: true });
  if (!feature) throw ApiError.notFound(`Feature '${key}' not found`);
  cachedToggles = null;
  return feature;
};

export const isFeatureEnabled = async (key: string): Promise<boolean> => {
  if (cachedToggles) {
    return cachedToggles[key] ?? true;
  }

  const all = await FeatureToggle.find().lean();
  cachedToggles = {};
  for (const f of all) {
    cachedToggles[f.key] = f.enabled;
  }
  return cachedToggles[key] ?? true;
};

export const invalidateCache = () => {
  cachedToggles = null;
};

export const bulkSeedFeatures = async () => {
  await initializeDefaultFeatures();
  cachedToggles = null;
  return await getAllFeatures();
};
