// Image preloader utility to improve loading performance
export class ImagePreloader {
  private static cache = new Set<string>();
  private static preloadPromises = new Map<string, Promise<void>>();

  static preloadImage(src: string): Promise<void> {
    // Return cached promise if already preloading
    if (this.preloadPromises.has(src)) {
      return this.preloadPromises.get(src)!;
    }

    // Return resolved promise if already cached
    if (this.cache.has(src)) {
      return Promise.resolve();
    }

    // Create new preload promise
    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.cache.add(src);
        this.preloadPromises.delete(src);
        resolve();
      };

      img.onerror = () => {
        this.preloadPromises.delete(src);
        reject(new Error(`Failed to preload image: ${src}`));
      };

      img.src = src;
    });

    this.preloadPromises.set(src, promise);
    return promise;
  }

  static preloadImages(urls: string[]): Promise<void[]> {
    return Promise.allSettled(urls.map((url) => this.preloadImage(url))).then(
      (results) =>
        results
          .map((result) =>
            result.status === "fulfilled" ? result.value : undefined
          )
          .filter(Boolean) as void[]
    );
  }

  static isPreloaded(src: string): boolean {
    return this.cache.has(src);
  }

  static clearCache(): void {
    this.cache.clear();
    this.preloadPromises.clear();
  }
}

// Hook for React components
export const useImagePreloader = () => {
  return {
    preloadImage: ImagePreloader.preloadImage.bind(ImagePreloader),
    preloadImages: ImagePreloader.preloadImages.bind(ImagePreloader),
    isPreloaded: ImagePreloader.isPreloaded.bind(ImagePreloader),
    clearCache: ImagePreloader.clearCache.bind(ImagePreloader),
  };
};
