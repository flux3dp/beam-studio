import Point from './Point'; // Assuming there is a separate file for the Point class

class Opti {
  public pen: number;

  public c: [Point, Point];

  public t: number;

  public s: number;

  public alpha: number;

  constructor() {
    this.pen = 0;
    this.c = [new Point(), new Point()];
    this.t = 0;
    this.s = 0;
    this.alpha = 0;
  }
}

export default Opti;
