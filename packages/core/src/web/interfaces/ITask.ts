export interface TaskMetaData {
  '3D_CURVE_TASK': '0' | '1'; // 1 for curve engraving task
  AUTHOR: string;
  CREATED_AT: string;
  // job x, y, z range, used for framing
  max_x: string;
  max_y: string;
  max_z: string;
  min_x: string;
  min_y: string;
  min_z: string;
  SOFTWARE: string;
  START_WITH_HOME: '0' | '1'; // 1 for start at (0, 0), 0 for job-origin
  time_cost: string;
  traval_dist: string;
  version: string; // fcode version
}
