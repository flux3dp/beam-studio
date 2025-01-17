interface Navigator {
  keyboard?: {
    getLayoutMap: () => Promise<Map<string, string>>;
  };
}
