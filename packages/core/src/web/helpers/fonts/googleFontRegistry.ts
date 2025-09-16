import type { GoogleFont } from '@core/interfaces/IFont';

/**
 * Registry service for managing Google Font registration
 * Uses dependency injection to avoid circular dependencies
 */
class GoogleFontRegistry {
  private registeredFonts = new Map<string, GoogleFont>();
  private registrationCallback: ((googleFont: GoogleFont) => void) | null = null;

  /**
   * Inject the registration callback from font-funcs
   * This breaks the circular dependency by using dependency inversion
   */
  setRegistrationCallback(callback: (googleFont: GoogleFont) => void): void {
    this.registrationCallback = callback;
  }

  /**
   * Register a Google Font using the injected callback
   */
  registerGoogleFont(googleFont: GoogleFont): boolean {
    if (!this.registrationCallback) {
      console.warn('Registration callback not set, cannot register font:', googleFont.family);

      return false;
    }

    if (this.registeredFonts.has(googleFont.postscriptName)) {
      return true; // Already registered
    }

    try {
      // Use the injected callback to perform the actual registration
      this.registrationCallback(googleFont);
      this.registeredFonts.set(googleFont.postscriptName, googleFont);

      return true;
    } catch (error) {
      console.error(`Failed to register Google Font ${googleFont.family}:`, error);

      return false;
    }
  }

  /**
   * Check if a font is registered
   */
  isRegistered(postscriptName: string): boolean {
    return this.registeredFonts.has(postscriptName);
  }

  /**
   * Get registered font
   */
  getRegisteredFont(postscriptName: string): GoogleFont | undefined {
    return this.registeredFonts.get(postscriptName);
  }

  /**
   * Get all registered fonts
   */
  getAllRegisteredFonts(): Map<string, GoogleFont> {
    return new Map(this.registeredFonts);
  }

  /**
   * Clear registry (useful for testing)
   */
  clear(): void {
    this.registeredFonts.clear();
    console.log('Google Font registry cleared');
  }

  /**
   * Check if the registry is initialized (has a callback)
   */
  isInitialized(): boolean {
    return this.registrationCallback !== null;
  }

  /**
   * Get registry statistics
   */
  getStats(): { isInitialized: boolean; totalRegistered: number } {
    return { isInitialized: this.isInitialized(), totalRegistered: this.registeredFonts.size };
  }
}

// Global singleton instance
export const googleFontRegistry = new GoogleFontRegistry();
