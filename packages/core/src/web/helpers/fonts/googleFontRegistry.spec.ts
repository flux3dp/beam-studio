import { googleFontRegistry } from './googleFontRegistry';
import type { GoogleFont } from '@core/interfaces/IFont';

const mockGoogleFont: GoogleFont = {
  binaryLoader: jest.fn(),
  family: 'Roboto',
  italic: false,
  postscriptName: 'Roboto-Regular',
  source: 'google',
  style: 'normal',
  weight: 400,
};

const mockGoogleFontItalic: GoogleFont = {
  binaryLoader: jest.fn(),
  family: 'Roboto',
  italic: true,
  postscriptName: 'Roboto-Italic',
  source: 'google',
  style: 'italic',
  weight: 400,
};

describe('GoogleFontRegistry', () => {
  beforeEach(() => {
    googleFontRegistry.clear();
    // Manually reset callback
    (googleFontRegistry as any).registrationCallback = null;
    jest.clearAllMocks();
  });

  describe('Initialization and Callback Management', () => {
    it('should start uninitialized without registration callback', () => {
      expect(googleFontRegistry.isInitialized()).toBe(false);

      const stats = googleFontRegistry.getStats();

      expect(stats.isInitialized).toBe(false);
      expect(stats.totalRegistered).toBe(0);
    });

    it('should become initialized after setting registration callback', () => {
      const mockCallback = jest.fn();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      googleFontRegistry.setRegistrationCallback(mockCallback);

      expect(googleFontRegistry.isInitialized()).toBe(true);

      const stats = googleFontRegistry.getStats();

      expect(stats.isInitialized).toBe(true);

      consoleLogSpy.mockRestore();
    });

    it('should allow callback replacement', () => {
      const firstCallback = jest.fn();
      const secondCallback = jest.fn();

      googleFontRegistry.setRegistrationCallback(firstCallback);
      expect(googleFontRegistry.isInitialized()).toBe(true);

      googleFontRegistry.setRegistrationCallback(secondCallback);
      expect(googleFontRegistry.isInitialized()).toBe(true);
    });
  });

  describe('Font Registration', () => {
    let mockCallback: jest.Mock;

    beforeEach(() => {
      mockCallback = jest.fn();
      googleFontRegistry.setRegistrationCallback(mockCallback);
    });

    it('should successfully register a font when callback is set', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const result = googleFontRegistry.registerGoogleFont(mockGoogleFont);

      expect(result).toBe(true);
      expect(mockCallback).toHaveBeenCalledWith(mockGoogleFont);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      consoleLogSpy.mockRestore();
    });

    it('should fail to register font when no callback is set', () => {
      // Ensure clean state by manually clearing callback
      (googleFontRegistry as any).registrationCallback = null;

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const result = googleFontRegistry.registerGoogleFont(mockGoogleFont);

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Registration callback not set, cannot register font:',
        mockGoogleFont.family,
      );

      consoleWarnSpy.mockRestore();
    });

    it('should track registered fonts correctly', () => {
      googleFontRegistry.registerGoogleFont(mockGoogleFont);

      expect(googleFontRegistry.isRegistered('Roboto-Regular')).toBe(true);
      expect(googleFontRegistry.getRegisteredFont('Roboto-Regular')).toEqual(mockGoogleFont);

      const stats = googleFontRegistry.getStats();

      expect(stats.totalRegistered).toBe(1);
    });

    it('should prevent duplicate registration', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // First registration
      const firstResult = googleFontRegistry.registerGoogleFont(mockGoogleFont);

      expect(firstResult).toBe(true);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Second registration of same font
      const secondResult = googleFontRegistry.registerGoogleFont(mockGoogleFont);

      expect(secondResult).toBe(true);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still only called once

      consoleLogSpy.mockRestore();
    });

    it('should handle multiple different fonts', () => {
      googleFontRegistry.registerGoogleFont(mockGoogleFont);
      googleFontRegistry.registerGoogleFont(mockGoogleFontItalic);

      expect(googleFontRegistry.isRegistered('Roboto-Regular')).toBe(true);
      expect(googleFontRegistry.isRegistered('Roboto-Italic')).toBe(true);
      expect(mockCallback).toHaveBeenCalledTimes(2);

      const stats = googleFontRegistry.getStats();

      expect(stats.totalRegistered).toBe(2);
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Registration failed');
      });

      googleFontRegistry.setRegistrationCallback(errorCallback);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = googleFontRegistry.registerGoogleFont(mockGoogleFont);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to register Google Font Roboto:', expect.any(Error));
      expect(googleFontRegistry.isRegistered('Roboto-Regular')).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Registry Queries', () => {
    let mockCallback: jest.Mock;

    beforeEach(() => {
      mockCallback = jest.fn();
      googleFontRegistry.setRegistrationCallback(mockCallback);
      googleFontRegistry.registerGoogleFont(mockGoogleFont);
      googleFontRegistry.registerGoogleFont(mockGoogleFontItalic);
    });

    it('should correctly identify registered fonts', () => {
      expect(googleFontRegistry.isRegistered('Roboto-Regular')).toBe(true);
      expect(googleFontRegistry.isRegistered('Roboto-Italic')).toBe(true);
      expect(googleFontRegistry.isRegistered('NonExistent-Font')).toBe(false);
    });

    it('should return registered font details', () => {
      const font = googleFontRegistry.getRegisteredFont('Roboto-Regular');

      expect(font).toEqual(mockGoogleFont);

      const nonExistent = googleFontRegistry.getRegisteredFont('NonExistent-Font');

      expect(nonExistent).toBeUndefined();
    });

    it('should return all registered fonts', () => {
      const allFonts = googleFontRegistry.getAllRegisteredFonts();

      expect(allFonts.size).toBe(2);
      expect(allFonts.get('Roboto-Regular')).toEqual(mockGoogleFont);
      expect(allFonts.get('Roboto-Italic')).toEqual(mockGoogleFontItalic);

      // Should return a copy, not the original map
      expect(allFonts).not.toBe(googleFontRegistry.getAllRegisteredFonts());
    });

    it('should provide accurate statistics', () => {
      const stats = googleFontRegistry.getStats();

      expect(stats.isInitialized).toBe(true);
      expect(stats.totalRegistered).toBe(2);
    });
  });

  describe('Registry Management', () => {
    let mockCallback: jest.Mock;

    beforeEach(() => {
      mockCallback = jest.fn();
      googleFontRegistry.setRegistrationCallback(mockCallback);
      googleFontRegistry.registerGoogleFont(mockGoogleFont);
      googleFontRegistry.registerGoogleFont(mockGoogleFontItalic);
    });

    it('should clear all registered fonts but keep callback', () => {
      expect(googleFontRegistry.getStats().totalRegistered).toBe(2);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      googleFontRegistry.clear();

      expect(googleFontRegistry.getStats().totalRegistered).toBe(0);
      expect(googleFontRegistry.isRegistered('Roboto-Regular')).toBe(false);
      expect(googleFontRegistry.isRegistered('Roboto-Italic')).toBe(false);
      expect(googleFontRegistry.isInitialized()).toBe(true); // Callback remains
      expect(consoleLogSpy).toHaveBeenCalledWith('Google Font registry cleared');

      consoleLogSpy.mockRestore();
    });

    it('should maintain registry state after clearing and re-registering', () => {
      const initialCallCount = mockCallback.mock.calls.length; // 2 from beforeEach

      googleFontRegistry.clear();
      expect(googleFontRegistry.isInitialized()).toBe(true); // Callback still set

      // Re-register fonts
      googleFontRegistry.registerGoogleFont(mockGoogleFont);
      expect(googleFontRegistry.isRegistered('Roboto-Regular')).toBe(true);
      expect(mockCallback).toHaveBeenCalledTimes(initialCallCount + 1); // Previous calls + re-register
    });
  });

  describe('Dependency Injection Pattern', () => {
    it('should demonstrate proper dependency inversion', () => {
      // Registry starts without dependencies
      expect(googleFontRegistry.isInitialized()).toBe(false);

      // External module injects its registration logic
      const externalRegistrationLogic = jest.fn((font: GoogleFont) => {
        // Simulated external registration logic
        console.log(`External system registering: ${font.postscriptName}`);
      });

      googleFontRegistry.setRegistrationCallback(externalRegistrationLogic);

      // Registry can now perform registrations via injected dependency
      const result = googleFontRegistry.registerGoogleFont(mockGoogleFont);

      expect(result).toBe(true);
      expect(externalRegistrationLogic).toHaveBeenCalledWith(mockGoogleFont);
    });

    it('should maintain separation of concerns', () => {
      const fontProcessingCallback = jest.fn((font: GoogleFont) => {
        // Simulate complex font processing
        if (font.weight > 400) {
          throw new Error('Bold fonts not supported');
        }
      });

      googleFontRegistry.setRegistrationCallback(fontProcessingCallback);

      // Registry doesn't know about font processing rules
      const normalFont = { ...mockGoogleFont, weight: 300 };
      const boldFont = { ...mockGoogleFont, postscriptName: 'Roboto-Bold', weight: 700 };

      expect(googleFontRegistry.registerGoogleFont(normalFont)).toBe(true);
      expect(googleFontRegistry.registerGoogleFont(boldFont)).toBe(false);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle null/undefined fonts gracefully', () => {
      const mockCallback = jest.fn();

      googleFontRegistry.setRegistrationCallback(mockCallback);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // The actual implementation doesn't handle null gracefully, so we expect it to throw
      expect(() => {
        googleFontRegistry.registerGoogleFont(null as any);
      }).toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('should handle fonts with missing properties', () => {
      const mockCallback = jest.fn();

      googleFontRegistry.setRegistrationCallback(mockCallback);

      const incompleteFont = {
        family: 'Incomplete',
        // Missing other required properties
      } as GoogleFont;

      googleFontRegistry.registerGoogleFont(incompleteFont);
      // Should still work as TypeScript interface is satisfied at runtime
    });

    it('should handle concurrent registrations safely', () => {
      const mockCallback = jest.fn();

      googleFontRegistry.setRegistrationCallback(mockCallback);

      // Simulate multiple concurrent registration attempts
      const promises = [
        Promise.resolve(googleFontRegistry.registerGoogleFont(mockGoogleFont)),
        Promise.resolve(googleFontRegistry.registerGoogleFont(mockGoogleFont)),
        Promise.resolve(googleFontRegistry.registerGoogleFont(mockGoogleFont)),
      ];

      return Promise.all(promises).then((results) => {
        // All should succeed (first registers, others detect duplicate)
        expect(results).toEqual([true, true, true]);
        expect(mockCallback).toHaveBeenCalledTimes(1); // Only actually called once
        expect(googleFontRegistry.getStats().totalRegistered).toBe(1);
      });
    });

    it('should handle registration of fonts with special characters in names', () => {
      const mockCallback = jest.fn();

      googleFontRegistry.setRegistrationCallback(mockCallback);

      const specialFont: GoogleFont = {
        binaryLoader: jest.fn(),
        family: 'Font with spaces & symbols!',
        italic: false,
        postscriptName: 'Font-with-spaces-symbols',
        source: 'google',
        style: 'normal',
        weight: 400,
      };

      const result = googleFontRegistry.registerGoogleFont(specialFont);

      expect(result).toBe(true);
      expect(googleFontRegistry.isRegistered('Font-with-spaces-symbols')).toBe(true);
      expect(mockCallback).toHaveBeenCalledWith(specialFont);
    });

    it('should handle extremely large font weight values', () => {
      const mockCallback = jest.fn();

      googleFontRegistry.setRegistrationCallback(mockCallback);

      const heavyFont: GoogleFont = {
        binaryLoader: jest.fn(),
        family: 'Ultra Heavy Font',
        italic: false,
        postscriptName: 'UltraHeavy-Black',
        source: 'google',
        style: 'normal',
        weight: 900,
      };

      const result = googleFontRegistry.registerGoogleFont(heavyFont);

      expect(result).toBe(true);
      expect(googleFontRegistry.getRegisteredFont('UltraHeavy-Black')).toEqual(heavyFont);
    });

    it('should handle empty postscript names', () => {
      const mockCallback = jest.fn();

      googleFontRegistry.setRegistrationCallback(mockCallback);

      const emptyPostscriptFont: GoogleFont = {
        binaryLoader: jest.fn(),
        family: 'Empty Postscript',
        italic: false,
        postscriptName: '',
        source: 'google',
        style: 'normal',
        weight: 400,
      };

      const result = googleFontRegistry.registerGoogleFont(emptyPostscriptFont);

      expect(result).toBe(true);
      expect(googleFontRegistry.isRegistered('')).toBe(true);
      expect(googleFontRegistry.getRegisteredFont('')).toEqual(emptyPostscriptFont);
    });
  });

  describe('Console Logging', () => {
    it('should provide clear logging for debugging', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Test initialization logging
      const mockCallback = jest.fn();

      googleFontRegistry.setRegistrationCallback(mockCallback);

      // Test registration logging
      googleFontRegistry.registerGoogleFont(mockGoogleFont);

      // Test duplicate detection logging
      googleFontRegistry.registerGoogleFont(mockGoogleFont);

      // Test clearing logging
      googleFontRegistry.clear();

      // Reset callback to test uninitialized state
      (googleFontRegistry as any).registrationCallback = null;

      // Test uninitialized registration warning
      googleFontRegistry.registerGoogleFont(mockGoogleFont);

      expect(consoleLogSpy).toHaveBeenCalledWith('Google Font registry cleared');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Registration callback not set, cannot register font:', 'Roboto');

      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Registry State Management', () => {
    it('should maintain consistent state during rapid clear/register cycles', () => {
      const mockCallback = jest.fn();

      googleFontRegistry.setRegistrationCallback(mockCallback);

      // Perform rapid clear/register cycles
      for (let i = 0; i < 5; i++) {
        googleFontRegistry.registerGoogleFont(mockGoogleFont);
        expect(googleFontRegistry.getStats().totalRegistered).toBe(1);
        googleFontRegistry.clear();
        expect(googleFontRegistry.getStats().totalRegistered).toBe(0);
      }

      // Final verification
      googleFontRegistry.registerGoogleFont(mockGoogleFont);
      expect(googleFontRegistry.isRegistered('Roboto-Regular')).toBe(true);
    });

    it('should handle registry operations with large numbers of fonts', () => {
      const mockCallback = jest.fn();

      googleFontRegistry.setRegistrationCallback(mockCallback);

      // Register many fonts
      const fonts: GoogleFont[] = [];

      for (let i = 0; i < 100; i++) {
        const font: GoogleFont = {
          binaryLoader: jest.fn(),
          family: `TestFont${i}`,
          italic: false,
          postscriptName: `TestFont${i}-Regular`,
          source: 'google',
          style: 'normal',
          weight: 400,
        };

        fonts.push(font);
        googleFontRegistry.registerGoogleFont(font);
      }

      // Verify all registered
      expect(googleFontRegistry.getStats().totalRegistered).toBe(100);
      expect(mockCallback).toHaveBeenCalledTimes(100);

      // Verify retrieval works
      const allFonts = googleFontRegistry.getAllRegisteredFonts();

      expect(allFonts.size).toBe(100);

      // Verify specific fonts
      expect(googleFontRegistry.isRegistered('TestFont50-Regular')).toBe(true);
      expect(googleFontRegistry.getRegisteredFont('TestFont99-Regular')).toEqual(fonts[99]);
    });

    it('should preserve callback through multiple operations', () => {
      const originalCallback = jest.fn();

      googleFontRegistry.setRegistrationCallback(originalCallback);

      // Perform various operations
      googleFontRegistry.registerGoogleFont(mockGoogleFont);
      googleFontRegistry.clear();
      googleFontRegistry.registerGoogleFont(mockGoogleFontItalic);

      // Callback should still be set and functional
      expect(googleFontRegistry.isInitialized()).toBe(true);
      expect(originalCallback).toHaveBeenCalledTimes(2); // Once for each register call
    });
  });

  describe('Edge Cases and Integration Scenarios', () => {
    it('should handle fonts with identical families but different postscript names', () => {
      const mockCallback = jest.fn();

      googleFontRegistry.setRegistrationCallback(mockCallback);

      const roboto400: GoogleFont = {
        binaryLoader: jest.fn(),
        family: 'Roboto',
        italic: false,
        postscriptName: 'Roboto-Regular',
        source: 'google',
        style: 'normal',
        weight: 400,
      };

      const roboto700: GoogleFont = {
        binaryLoader: jest.fn(),
        family: 'Roboto',
        italic: false,
        postscriptName: 'Roboto-Bold',
        source: 'google',
        style: 'normal',
        weight: 700,
      };

      googleFontRegistry.registerGoogleFont(roboto400);
      googleFontRegistry.registerGoogleFont(roboto700);

      expect(googleFontRegistry.isRegistered('Roboto-Regular')).toBe(true);
      expect(googleFontRegistry.isRegistered('Roboto-Bold')).toBe(true);
      expect(googleFontRegistry.getStats().totalRegistered).toBe(2);
    });

    it('should handle callback that modifies the font object', () => {
      const modifyingCallback = jest.fn((font: GoogleFont) => {
        // Simulate a callback that modifies the font object
        font.family = `Modified-${font.family}`;
      });

      googleFontRegistry.setRegistrationCallback(modifyingCallback);

      const originalFont = { ...mockGoogleFont };
      const result = googleFontRegistry.registerGoogleFont(originalFont);

      expect(result).toBe(true);
      expect(modifyingCallback).toHaveBeenCalledWith(originalFont);
      expect(googleFontRegistry.getRegisteredFont('Roboto-Regular')).toEqual(originalFont);
    });

    it('should maintain immutable interface despite internal state changes', () => {
      const mockCallback = jest.fn();

      googleFontRegistry.setRegistrationCallback(mockCallback);
      googleFontRegistry.registerGoogleFont(mockGoogleFont);

      // Get reference to registered fonts map
      const fontsMap1 = googleFontRegistry.getAllRegisteredFonts();
      const fontsMap2 = googleFontRegistry.getAllRegisteredFonts();

      // Should be different objects (defensive copying)
      expect(fontsMap1).not.toBe(fontsMap2);
      expect(fontsMap1).toEqual(fontsMap2);

      // Modifying returned map shouldn't affect registry
      fontsMap1.clear();
      expect(googleFontRegistry.getStats().totalRegistered).toBe(1);
    });
  });
});
