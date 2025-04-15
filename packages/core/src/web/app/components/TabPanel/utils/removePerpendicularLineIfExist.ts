import paper from 'paper';

import { PERPENDICULAR_LINE_GROUP_NAME } from './constant';

export function removePerpendicularLineIfExist() {
  const perpendicularGroups = paper.project.getItems({ name: PERPENDICULAR_LINE_GROUP_NAME });

  perpendicularGroups.forEach((group) => {
    group.remove();
  });
}
