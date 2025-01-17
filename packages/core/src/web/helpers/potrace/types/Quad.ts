class Quad {
  private data: Array<number>;

  constructor() {
    this.data = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  public at(x: number, y: number): number {
    return this.data[x * 3 + y];
  }
}

export default Quad;
