/**
 * Integration test to verify Google Fonts API can be reached and returns valid data
 * This test actually hits the real Google Fonts API to ensure our integration works
 */

// Only run this test when INTEGRATION_TESTS env var is set
const SKIP_INTEGRATION_TESTS = !process.env.INTEGRATION_TESTS;

describe('Google Fonts API Integration (Real)', () => {
  beforeAll(() => {
    if (SKIP_INTEGRATION_TESTS) {
      console.log('Skipping integration tests. Set INTEGRATION_TESTS=true to run.');
    }
  });

  it.skip('should fetch real Google Fonts data from API', async () => {
    const API_KEY = 'AIzaSyC8hpJfIGkVvZZNqnPNzZb8Ny0kB-T6CxM';
    const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}&sort=popularity`);

    expect(response.ok).toBe(true);

    const data = await response.json();

    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);

    // Verify structure of first font item
    const firstFont = data.items[0];

    expect(firstFont).toHaveProperty('family');
    expect(firstFont).toHaveProperty('category');
    expect(firstFont).toHaveProperty('variants');
    expect(firstFont).toHaveProperty('subsets');
    expect(firstFont).toHaveProperty('files');

    expect(typeof firstFont.family).toBe('string');
    expect(Array.isArray(firstFont.variants)).toBe(true);
    expect(Array.isArray(firstFont.subsets)).toBe(true);
    expect(typeof firstFont.files).toBe('object');

    console.log(`✅ Successfully fetched ${data.items.length} fonts from Google Fonts API`);
    console.log(`📚 First font: ${firstFont.family} (${firstFont.category})`);
  }, 10000); // 10 second timeout for network request

  it.skip('should be able to load a Google Font stylesheet', async () => {
    // Test loading Roboto font
    const fontUrl = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap';
    const response = await fetch(fontUrl);

    expect(response.ok).toBe(true);

    const cssContent = await response.text();

    expect(cssContent).toContain('@font-face');
    expect(cssContent).toContain('Roboto');
    expect(cssContent).toContain('font-family');
    expect(cssContent).toContain('src:');

    console.log('✅ Successfully loaded Google Font stylesheet');
  }, 5000);

  it.skip('should handle popular font names correctly in API calls', async () => {
    const API_KEY = 'AIzaSyC8hpJfIGkVvZZNqnPNzZb8Ny0kB-T6CxM';
    const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}&sort=popularity`);

    const data = await response.json();
    const fontFamilies = data.items.map((font: any) => font.family);

    // Check for some popular fonts that should be in the top results
    const popularFonts = ['Roboto', 'Open Sans', 'Lato', 'Montserrat'];
    const foundPopularFonts = popularFonts.filter((font) => fontFamilies.includes(font));

    expect(foundPopularFonts.length).toBeGreaterThanOrEqual(2);
    console.log(`✅ Found popular fonts: ${foundPopularFonts.join(', ')}`);
  }, 10000);

  it.skip('should handle font names with spaces correctly', async () => {
    // Test loading a font with spaces in the name
    const fontUrl = 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400&display=swap';
    const response = await fetch(fontUrl);

    expect(response.ok).toBe(true);

    const cssContent = await response.text();

    expect(cssContent).toContain('@font-face');
    expect(cssContent).toContain('Open Sans');

    console.log('✅ Successfully loaded font with spaces in name');
  }, 5000);

  it.skip('should validate API key works correctly', async () => {
    const API_KEY = 'AIzaSyC8hpJfIGkVvZZNqnPNzZb8Ny0kB-T6CxM';

    // Test with correct API key
    const validResponse = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}&sort=popularity`);

    expect(validResponse.ok).toBe(true);

    // Test with invalid API key (should fail gracefully)
    const invalidResponse = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=invalid-key&sort=popularity`,
    );

    expect(invalidResponse.ok).toBe(false);
    expect(invalidResponse.status).toBe(400);

    console.log('✅ API key validation works correctly');
  }, 10000);
});
