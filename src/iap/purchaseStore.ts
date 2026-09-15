import { Platform } from 'react-native';

import type { DevicePlatform, HeartsPackageDto } from '../api/types';

export interface StorePurchase {
  platform: DevicePlatform;
  productId: string;
  transactionId: string;
  receipt: string | null;
}

/**
 * Abstraction over the app stores. Today only the sandbox path exists: it fabricates a
 * transaction id that the backend accepts when Purchases:SandboxMode is on. When Google Play /
 * App Store products are configured, implement this with react-native-iap and keep the same shape.
 */
export interface PurchaseStore {
  readonly name: string;
  purchase(pkg: HeartsPackageDto): Promise<StorePurchase | null>;
}

export const platform: DevicePlatform = Platform.OS === 'ios' ? 'Ios' : 'Android';

export const sandboxStore: PurchaseStore = {
  name: 'sandbox',
  async purchase(pkg) {
    const productId = (platform === 'Ios' ? pkg.storeProductIdIos : pkg.storeProductIdAndroid) ?? pkg.code;
    return {
      platform,
      productId,
      transactionId: `sandbox-${productId}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      receipt: null,
    };
  },
};

export function getPurchaseStore(sandboxMode: boolean): PurchaseStore | null {
  return sandboxMode ? sandboxStore : null;
}
