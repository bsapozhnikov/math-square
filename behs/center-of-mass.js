/* MoMath Math Square Behavior
 *
 *        Title: Center of Mass
 *  Description: Displays center of mass of users
 * Scheduler ID: 
 *    Framework: P5
 *       Author: Brian Sapozhnikov <brian.sapozhnikov@gmail.com>, ***ENTER NAMES HERE***
 *      Created: 2017-08-05
 *       Status: works
 */

import P5Behavior from 'p5beh';

const pb = new P5Behavior();

const CENTER_DIAMETER = 50;

pb.draw = function (floor, p) {
  this.clear();
  let x = 0, y = 0, n = 0;
  for (let user of floor.users) {
    x += user.x;
    y += user.y;
    n++;
    pb.drawUser(user);
  }
  x /= n;
  y /= n;  
  this.ellipse(x, y, CENTER_DIAMETER, CENTER_DIAMETER);
  for (let user of floor.users) {
    this.line(user.x, user.y, x, y);
  }
};


export const behavior = {
  title: "Center of Mass",
  init: pb.init.bind(pb),
  frameRate: 'sensors',
  render: pb.render.bind(pb),
  numGhosts: 4
};
export default behavior;
