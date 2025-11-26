# Progressive Web App Implementation Guide for Verdict

## 🎯 PWA Benefits for Verdict

### **User Experience**
- **App-like Feel**: Native mobile app experience
- **Offline Capability**: View past verdicts without internet
- **Push Notifications**: Alert users when verdicts are ready
- **Home Screen Install**: One-tap access from mobile home screen
- **Fast Loading**: Instant app startup with caching

### **Business Benefits**
- **Higher Engagement**: 2-3x more engagement than mobile web
- **Better Retention**: App-like experience increases return visits
- **Reduced Friction**: No app store download required
- **Cross-Platform**: Single codebase for all devices
- **SEO Benefits**: Still discoverable via search engines

---

## 📋 PWA Requirements Checklist

### **Core Requirements**
- [ ] HTTPS (already have with Vercel/Netlify)
- [ ] Web App Manifest
- [ ] Service Worker
- [ ] Responsive Design (✅ already implemented)
- [ ] App Shell Architecture

### **Enhanced Features**
- [ ] Offline Functionality
- [ ] Push Notifications
- [ ] Background Sync
- [ ] Install Prompts
- [ ] App-like Navigation

---

## 🛠 Implementation Roadmap

### **Phase 1: PWA Foundation (Week 1)**

#### 1.1 Web App Manifest
```json
// public/manifest.json
{
  "name": "Verdict - Get Honest Opinions",
  "short_name": "Verdict",
  "description": "Get honest, anonymous feedback on anything in minutes",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#4f46e5",
  "theme_color": "#4f46e5",
  "orientation": "portrait-primary",
  "categories": ["productivity", "social", "utilities"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "640x1136",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/desktop-1.png", 
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "shortcuts": [
    {
      "name": "New Request",
      "short_name": "New",
      "description": "Create a new verdict request",
      "url": "/start-simple",
      "icons": [{ "src": "/icons/shortcut-new.png", "sizes": "96x96" }]
    },
    {
      "name": "My Verdicts", 
      "short_name": "Verdicts",
      "description": "View your verdict history",
      "url": "/my-verdicts",
      "icons": [{ "src": "/icons/shortcut-verdicts.png", "sizes": "96x96" }]
    }
  ]
}
```

#### 1.2 Next.js PWA Configuration
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }
  ]
});

module.exports = withPWA({
  // Your existing Next.js config
});
```

#### 1.3 App Shell Architecture
```typescript
// components/pwa/app-shell.tsx
'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { LoadingSpinner } from '@/components/ui/loading-states';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Verdict</h1>
          <LoadingSpinner className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main id="main-content" className="pb-safe">
        {children}
      </main>
    </div>
  );
}
```

### **Phase 2: Offline Functionality (Week 2)**

#### 2.1 Offline Data Management
```typescript
// lib/offline-storage.ts
interface CachedRequest {
  id: string;
  title: string;
  context: string;
  status: string;
  created_at: string;
  cached_at: number;
}

export class OfflineStorage {
  private dbName = 'verdict-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create requests store
        if (!db.objectStoreNames.contains('requests')) {
          const requestStore = db.createObjectStore('requests', { keyPath: 'id' });
          requestStore.createIndex('status', 'status', { unique: false });
          requestStore.createIndex('created_at', 'created_at', { unique: false });
        }
        
        // Create verdicts store
        if (!db.objectStoreNames.contains('verdicts')) {
          const verdictStore = db.createObjectStore('verdicts', { keyPath: 'id' });
          verdictStore.createIndex('request_id', 'request_id', { unique: false });
        }
      };
    });
  }

  async cacheRequest(request: CachedRequest): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    
    await store.put({
      ...request,
      cached_at: Date.now()
    });
  }

  async getCachedRequests(): Promise<CachedRequest[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['requests'], 'readonly');
      const store = transaction.objectStore('requests');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldCache(maxAge = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) return;
    
    const cutoff = Date.now() - maxAge;
    const transaction = this.db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        if (cursor.value.cached_at < cutoff) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }
}
```

#### 2.2 Network Detection Hook
```typescript
// hooks/use-network-status.ts
import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: 'unknown'
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      setNetworkStatus({
        isOnline: navigator.onLine,
        isSlowConnection: connection ? connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' : false,
        connectionType: connection?.effectiveType || 'unknown'
      });
    };

    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
}
```

#### 2.3 Offline-First My Verdicts Page
```typescript
// components/pwa/offline-verdicts.tsx
'use client';

import { useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { OfflineStorage } from '@/lib/offline-storage';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineVerdicts() {
  const { isOnline } = useNetworkStatus();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storage] = useState(new OfflineStorage());

  useEffect(() => {
    const loadData = async () => {
      await storage.init();
      
      if (isOnline) {
        // Try to fetch from network
        try {
          const response = await fetch('/api/requests');
          const data = await response.json();
          
          // Cache the data
          for (const request of data) {
            await storage.cacheRequest(request);
          }
          
          setRequests(data);
        } catch (error) {
          // Network failed, use cache
          const cached = await storage.getCachedRequests();
          setRequests(cached);
        }
      } else {
        // Offline, use cache only
        const cached = await storage.getCachedRequests();
        setRequests(cached);
      }
      
      setLoading(false);
    };

    loadData();
  }, [isOnline, storage]);

  return (
    <div className="space-y-4">
      {/* Network Status Banner */}
      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
        isOnline ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
      }`}>
        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        {isOnline ? 'Connected - Data synced' : 'Offline - Showing cached data'}
      </div>

      {/* Requests List */}
      <div className="grid gap-4">
        {requests.map((request: any) => (
          <Card key={request.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium">{request.title || 'Untitled Request'}</h3>
                <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                  {request.status}
                </Badge>
              </div>
              
              {request.context && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {request.context}
                </p>
              )}
              
              <div className="text-xs text-gray-500">
                {new Date(request.created_at).toLocaleDateString()}
              </div>
              
              {!isOnline && (
                <div className="absolute top-2 right-2">
                  <WifiOff className="w-3 h-3 text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### **Phase 3: Push Notifications (Week 3)**

#### 3.1 Push Notification Service
```typescript
// lib/push-notifications.ts
export class PushNotificationService {
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
    });

    return subscription;
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return await subscription.unsubscribe();
    }
    
    return false;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      });
    }
  }
}
```

#### 3.2 Push Notification Hook
```typescript
// hooks/use-push-notifications.ts
import { useState, useEffect } from 'react';
import { PushNotificationService } from '@/lib/push-notifications';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [service] = useState(new PushNotificationService());

  useEffect(() => {
    const checkSupport = () => {
      setIsSupported('Notification' in window && 'serviceWorker' in navigator);
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  const requestPermission = async () => {
    try {
      const perm = await service.requestPermission();
      setPermission(perm);
      return perm;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  };

  const subscribe = async () => {
    try {
      if (permission !== 'granted') {
        const perm = await requestPermission();
        if (perm !== 'granted') return null;
      }

      const sub = await service.subscribeToPush();
      setSubscription(sub);
      
      // Send subscription to backend
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub)
        });
      }
      
      return sub;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  };

  const unsubscribe = async () => {
    try {
      const success = await service.unsubscribeFromPush();
      if (success) {
        setSubscription(null);
        
        // Remove subscription from backend
        await fetch('/api/push/unsubscribe', {
          method: 'POST'
        });
      }
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe
  };
}
```

### **Phase 4: Install Prompts & App-like Features (Week 4)**

#### 4.1 Install Prompt Component
```typescript
// components/pwa/install-prompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show custom install prompt after user has used the app
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // Show after 30 seconds
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already running as installed app
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Don't show if already installed or recently dismissed
  const dismissedTime = localStorage.getItem('installPromptDismissed');
  if (isInstalled || !showPrompt || !deferredPrompt) return null;
  
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="shadow-lg border-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                Install Verdict App
              </h3>
              <p className="text-xs opacity-90 mb-3">
                Get app-like experience with offline access and push notifications
              </p>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleInstall}
                  size="sm"
                  className="bg-white text-indigo-600 hover:bg-gray-100 font-medium text-xs h-8 px-3"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Install
                </Button>
                
                <Button
                  onClick={handleDismiss}
                  size="sm" 
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-8 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 4.2 PWA Status Bar
```typescript
// components/pwa/status-bar.tsx
'use client';

import { useEffect, useState } from 'react';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Smartphone, Chrome } from 'lucide-react';

export function PWAStatusBar() {
  const { isOnline, isSlowConnection, connectionType } = useNetworkStatus();
  const [displayMode, setDisplayMode] = useState<'browser' | 'standalone'>('browser');
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setDisplayMode('standalone');
    }

    // Check if iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  // Only show in development or when useful
  if (process.env.NODE_ENV === 'production' && displayMode === 'standalone' && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900 text-white text-xs p-2">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center gap-2">
          {displayMode === 'standalone' ? (
            <Badge variant="secondary" className="bg-green-600 text-white border-0">
              <Smartphone className="w-3 h-3 mr-1" />
              PWA Mode
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-600 text-white border-0">
              <Chrome className="w-3 h-3 mr-1" />
              Browser
            </Badge>
          )}
          
          <Badge variant="secondary" className={`border-0 ${
            isOnline ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          
          {isOnline && isSlowConnection && (
            <Badge variant="secondary" className="bg-yellow-600 text-white border-0">
              Slow Connection
            </Badge>
          )}
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs opacity-75">
            {connectionType} • PWA Dev Mode
          </div>
        )}
      </div>
    </div>
  );
}
```

### **Phase 5: Advanced PWA Features (Week 5)**

#### 5.1 Background Sync for Form Submissions
```typescript
// lib/background-sync.ts
export class BackgroundSyncService {
  private static SYNC_TAG = 'verdict-form-sync';

  static async register() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(this.SYNC_TAG);
    }
  }

  static async queueRequest(requestData: any) {
    // Store request in IndexedDB for background sync
    const request = indexedDB.open('verdict-sync-queue', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['queue'], 'readwrite');
      const store = transaction.objectStore('queue');
      
      store.add({
        ...requestData,
        timestamp: Date.now(),
        synced: false
      });
    };

    // Register for background sync
    await this.register();
  }
}
```

#### 5.2 App Shortcuts Implementation
```typescript
// components/pwa/app-shortcuts.tsx
'use client';

import { useEffect } from 'react';

export function AppShortcuts() {
  useEffect(() => {
    // Handle app shortcuts
    const handleShortcut = (event: any) => {
      if (event.action === 'new-request') {
        window.location.href = '/start-simple';
      } else if (event.action === 'my-verdicts') {
        window.location.href = '/my-verdicts';
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleShortcut);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleShortcut);
    };
  }, []);

  return null;
}
```

---

## 📱 Mobile-Specific Enhancements

### **iOS Safari Optimizations**
```html
<!-- In app/layout.tsx head -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Verdict" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<link rel="apple-touch-startup-image" href="/splash-screens/iphone5_splash.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
```

### **Safe Area Handling**
```css
/* globals.css */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

.pt-safe {
  padding-top: env(safe-area-inset-top);
}

.px-safe {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

---

## 🚀 Implementation Timeline

### **Week 1: Foundation**
- [ ] Create web app manifest
- [ ] Add PWA meta tags
- [ ] Configure Next.js PWA
- [ ] Implement app shell
- [ ] Generate app icons

### **Week 2: Offline Capability**
- [ ] Implement IndexedDB storage
- [ ] Add network detection
- [ ] Create offline pages
- [ ] Cache critical resources
- [ ] Background sync setup

### **Week 3: Push Notifications**
- [ ] VAPID key generation
- [ ] Push service implementation
- [ ] Notification permissions
- [ ] Backend integration
- [ ] Notification scheduling

### **Week 4: Install Experience**
- [ ] Custom install prompt
- [ ] App shortcuts
- [ ] Splash screens
- [ ] iOS optimizations
- [ ] Testing across devices

### **Week 5: Polish & Testing**
- [ ] Performance optimization
- [ ] Lighthouse PWA audit
- [ ] Cross-platform testing
- [ ] User acceptance testing
- [ ] Production deployment

---

## 📊 Success Metrics

### **PWA Performance Targets**
- **Lighthouse PWA Score**: 100/100
- **Install Rate**: >15% of mobile users
- **Offline Usage**: >30% of sessions work offline
- **Push Engagement**: >60% opt-in rate
- **App Launch Time**: <1.5 seconds

### **User Experience Metrics**
- **Mobile Bounce Rate**: <25%
- **Session Duration**: +40% vs web
- **Return Visits**: +200% for installed users
- **Task Completion**: >90% for core flows
- **User Satisfaction**: >9/10 for app experience

---

## 🔧 Development Tools

### **Testing Tools**
```bash
# PWA testing
npm install --save-dev lighthouse
npm install --save-dev pwa-asset-generator

# Generate icons and splash screens
npx pwa-asset-generator logo.svg public/icons --manifest public/manifest.json
```

### **Debugging**
- **Chrome DevTools**: Application tab for PWA features
- **Lighthouse**: PWA audit and scoring
- **PWA Builder**: Microsoft's PWA testing tools
- **Workbox**: Service worker debugging

This comprehensive PWA implementation will transform Verdict into a native app-like experience that users will love to install and use daily! 🚀