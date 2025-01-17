export interface ChipSettings {
  uid: string;
  serial: string;
  brand: string;
  type: number;
  color: number;
  offset: number[];
  plScale: number;
  totalCapacity: number;
  timeUsed: number;
  verified?: boolean;
}

export interface RawChipSettings {
  uid?: string;
  serial?: string;
  brand?: string;
  type?: number;
  color?: number;
  pos_offset?: number[];
  pl_scale?: number;
  total_capacity?: number;
  used_time?: number;
  verified?: boolean;
}
