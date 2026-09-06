import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.checkoutram.finplan',
  appName: 'FIRE Tracker',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
