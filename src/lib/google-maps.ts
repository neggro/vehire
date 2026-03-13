// Singleton Google Maps loader — prevents duplicate script tags
// Uses loading=async + callback for best-practice loading per Google's recommendation

let loadPromise: Promise<void> | null = null;
let isLoaded = false;

function mapsReady(): boolean {
  return !!(window.google?.maps?.Map);
}

export function loadGoogleMaps(): Promise<void> {
  // Already loaded
  if (isLoaded || mapsReady()) {
    isLoaded = true;
    return Promise.resolve();
  }

  // Already loading — return the same promise
  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key not configured"));
  }

  // Check if a script tag already exists (e.g. from a prior mount)
  const existing = document.querySelector(
    'script[src*="maps.googleapis.com/maps/api/js"]'
  );
  if (existing) {
    loadPromise = new Promise<void>((resolve) => {
      if (mapsReady()) {
        isLoaded = true;
        resolve();
      } else {
        existing.addEventListener("load", () => {
          // With loading=async, wait for constructors to be available
          const check = () => {
            if (mapsReady()) {
              isLoaded = true;
              resolve();
            } else {
              setTimeout(check, 50);
            }
          };
          check();
        });
      }
    });
    return loadPromise;
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    // Use a global callback for the Maps API
    const callbackName = `__gmapsInit_${Date.now()}`;
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      // With loading=async, constructors may need a moment
      const check = () => {
        if (mapsReady()) {
          isLoaded = true;
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete (window as any)[callbackName];
      loadPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function isGoogleMapsLoaded(): boolean {
  return isLoaded || mapsReady();
}
