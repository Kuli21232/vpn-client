import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

let secureStoreSupport: boolean | null = null;

async function canUseSecureStore() {
  if (secureStoreSupport === null) {
    secureStoreSupport = await SecureStore.isAvailableAsync();
  }

  return secureStoreSupport;
}

export async function getSecureItem(key: string) {
  try {
    if (await canUseSecureStore()) {
      return await SecureStore.getItemAsync(key);
    }
  } catch {
    return AsyncStorage.getItem(key);
  }

  return AsyncStorage.getItem(key);
}

export async function setSecureItem(key: string, value: string) {
  try {
    if (await canUseSecureStore()) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch {
    await AsyncStorage.setItem(key, value);
    return;
  }

  await AsyncStorage.setItem(key, value);
}

export async function removeSecureItem(key: string) {
  try {
    if (await canUseSecureStore()) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
  } catch {
    await AsyncStorage.removeItem(key);
    return;
  }

  await AsyncStorage.removeItem(key);
}
