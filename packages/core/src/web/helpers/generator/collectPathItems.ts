import paper from 'paper';

/** Flattens an imported paper item (groups, layers) into its Path / CompoundPath leaves. */
export const collectPathItems = (item: paper.Item): paper.PathItem[] => {
  if (item instanceof paper.Path || item instanceof paper.CompoundPath) return [item];

  return item.children?.flatMap(collectPathItems) ?? [];
};
