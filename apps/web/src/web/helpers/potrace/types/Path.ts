class Path {
  public area: number;

  public len: number;

  public curve: any; // Assuming that curve is an object with arbitrary properties

  public pt: Array<any>; // Assuming that pt is an array of objects with arbitrary properties

  public minX: number;

  public minY: number;

  public maxX: number;

  public maxY: number;

  constructor() {
    this.area = 0;
    this.len = 0;
    this.curve = {};
    this.pt = [];
    this.minX = 100000;
    this.minY = 100000;
    this.maxX = -1;
    this.maxY = -1;
  }
}

export default Path;
