export interface ChipSettings {
  brand: string;
  color: number;
  offset: number[];
  plScale: number;
  serial: string;
  timeUsed: number;
  totalCapacity: number;
  type: number;
  uid: string;
  verified?: boolean;
}

export interface RawChipSettings {
  brand?: string;
  color?: number;
  pl_scale?: number;
  pos_offset?: number[];
  serial?: string;
  total_capacity?: number;
  type?: number;
  uid?: string;
  used_time?: number;
  verified?: boolean;
}
