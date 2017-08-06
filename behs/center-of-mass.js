/* MoMath Math Square Behavior
 *
 *        Title: Center of Mass
 *  Description: Displays center of mass of users
 * Scheduler ID: 
 *    Framework: P5
 *       Author: Brian Sapozhnikov <brian.sapozhnikov@gmail.com>,  Lise Ho <lise.ho6@gmail.com>, Shaan Sheikh <shaansweb@gmail.com>, Mary Taft <mary.taft97@gmail.com>
 *      Created: 2017-08-05
 *       Status: works
 */

/** Imports and Constants **/
import P5Behavior from 'p5beh';
import * as Display from 'display';

const pb = new P5Behavior();

const COLORS = {
  RED: [255, 0, 0],
  GREEN: [0, 255, 0],
  BLUE: [0, 0, 255],
  GRAY: [155, 155, 155],
  BLACK: [0, 0, 0],
  YELLOW: [255, 255, 0],
  TEAL: [0,255,255]
};

const CENTER_RADIUS = 20;
const GOAL_RADIUS = 10;
const goalX, goalY = parseInt(Math.random() * Display.width);
const MASS_CONNECTORS_STROKE_WEIGHT = 4;

// Other vars which aren't consts
var gameOver = 0; // 0: still playing; 1: done playing (rotating)

/** Helper Functions **/
const drawCircle = function(x, y, r, color) {
  if (color) {
    this.fill(color);
  }
  this.ellipse(x, y, r * 2, r * 2);
};

const drawLine = function(x1, y1, x2, y2, strokeColor, strokeWeight) {
  this.strokeWeight(strokeWeight);
  this.stroke(strokeColor);
  this.line(x1, y1, x2, y2);
  this.restoreDefaults();
};

const drawShape = function(points) {
  this.fill(COLORS.TEAL);
  this.beginShape();
  points.forEach(point => this.vertex(point.x, point.y));
  this.endShape(this.CLOSE);
};

const drawCenterMassConnectors = function (x1, y1, x2, y2) {
  this.drawLine(x1, y1, x2, y2, COLORS.YELLOW, MASS_CONNECTORS_STROKE_WEIGHT);
};

const restoreDefaults = function() {
    // Reset defaults for fill/stroke colors.
    this.strokeWeight(1);
    this.stroke(COLORS.BLACK);
};

const drawGoal = function(){
  this.drawCircle(this.goalX, this.goalY, GOAL_RADIUS, COLORS.RED);
};

const updateGoal = function(){
  this.goalX = parseInt(Math.random() * Display.width * (2/3) + (Display.width * (1/6)));
  this.goalY = parseInt(Math.random() * Display.height * (2/3) + (Display.height * (1/6)));
};

const distToColor = function(d) {
  const corners = [
    [0, 0], 
    [0, Display.height],
    [Display.width, 0],
    [Display.width, Display.height]
  ];
  const dists = corners.map(point => this.dist(point[0], point[1], this.goalX, this.goalY));
  const maxDist = this.max(dists);
  const MIDPOINT = 0.5;
  const ratio = d / maxDist;
  const red = this.color(255, 0, 0);
  const blue = this.color(0, 0, 255);
  const sat = parseInt(this.abs(ratio - MIDPOINT) * 100);
  const colStr = 'hsb(' + this.hue(ratio > MIDPOINT ? blue : red) + ', ' + sat + '%, 100%)';
  return this.color(colStr);
};

const rotatePolygon = function(points, centerX, centerY, angle){
  
  this.translate(centerX, centerY);
  this.angleMode(this.RADIANS);
  this.rotate(angle);
  this.rect(-50,-50,100,100);

};

const orderPoints = function(points){
  const sortedpoints=points.slice().sort((p1, p2) => {
    if (p1.x != p2.x){
      return p1.x-p2.x;
    }else{
      return p1.y-p2.y;
    }
  });

  function YOnLine(point,leftpoint,rightpoint){
    var fraction = (point.x - leftpoint.x) / (rightpoint.x - leftpoint.x);
    return leftpoint.y + fraction*(rightpoint.y - leftpoint.y);
  }

  var answer = new Array(sortedpoints.length);

  answer[0] = sortedpoints[0];
  answer[sortedpoints.length-1] = sortedpoints[sortedpoints.length-1];


  var answerFront = 1;
  var answerBack = sortedpoints.length-1;

  for (var i = 1; i < sortedpoints.length-1; i++) {
    let lineY = YOnLine(sortedpoints[i],sortedpoints[0],sortedpoints[sortedpoints.length-1]);
    if (sortedpoints[i].y > lineY) {
      answer[answerFront] = sortedpoints[i];
      answerFront++;
    }else{
      answer[answerBack] = sortedpoints[i];
      answerBack--;
    }
  }
  answer[answerFront] = sortedpoints[sortedpoints.length-1];
  return answer;
}

/** Lifecycle Functions **/
pb.setup = function(p) {
  this.gameOver = 0;
  this.drawCircle = drawCircle;
  this.drawLine = drawLine;
  this.drawCenterMassConnectors = drawCenterMassConnectors;
  this.restoreDefaults = restoreDefaults;
  this.drawGoal = drawGoal;
  this.distToColor = distToColor;
  this.rotatePolygon = rotatePolygon;
  this.updateGoal = updateGoal;
  this.orderPoints = orderPoints;
  this.drawShape = drawShape;
  this.updateGoal();
};

var angle = 0;
pb.draw = function(floor, p) {
  this.clear();
  if(!this.gameOver){
    let centerX = 0, centerY = 0, numUsers = 0;

    var userLocations = [];
    var users = [];

    for (let user of floor.users) {
      userLocations.push({x:user.x,y:user.y});
      users.push(user);
      centerX += user.x;
      centerY += user.y;
      numUsers++;


    }
    centerX /= numUsers;
    centerY /= numUsers;
    this.drawShape(this.orderPoints(userLocations));
    for (let user of floor.users) {
      this.drawCenterMassConnectors(user.x, user.y, centerX, centerY);
    }
    const distToGoal = this.dist(centerX, centerY, this.goalX, this.goalY);
    this.drawCircle(centerX, centerY, CENTER_RADIUS, this.distToColor(distToGoal));



    this.drawGoal();
    var distance = ((centerX-this.goalX)**2 + (centerY-this.goalY)**2)**0.5
    if ( distance <30)   {
      this.updateGoal(p);
    }
    users.forEach(user => {
      pb.drawUser(user);
    })

  } else {
    this.translate(0,0);
    this.rotatePolygon(null, this.goalX, this.goalY, angle);
    angle += this.PI/24;
    if(angle >= 2*this.PI){
      this.gameOver = 0;
      this.updateGoal(p);
      angle = 0;
    }

  }


};

/** Export **/
export const behavior = {
  title: "Center of Mass",
  init: pb.init.bind(pb),
  frameRate: 'sensors',
  render: pb.render.bind(pb),
  numGhosts: 4
};
export default behavior;
