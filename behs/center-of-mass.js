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
  GREEN: [0, 155, 0],
  BLUE: [0, 0, 255],
  GRAY: [155, 155, 155],
  BLACK: [0, 0, 0],
  YELLOW: [255, 255, 0],
  TEAL: [0,255,255],
  PURPLE: [255,0,255],
  WHITE: [255,255,255]
};

const CENTER_RADIUS = 10;
const GOAL_RADIUS = 10;
const MASS_CONNECTORS_STROKE_WEIGHT = 4;

const DEBUG = 1;

//colorscheme represents which of the two colorschemes to use
//1 means red/blue/teal
//0 means green/red/white
const colorscheme = 1;
// Other vars which aren't consts
var gameOver = 0; // 0: still playing; 1: done playing (rotating)

var theme = {}

if (colorscheme==0){
  theme = {
    "centroid_connections": COLORS.PURPLE,
    "centroid": COLORS.PURPLE,
    "centroid_stroke":null,
    "target": null,
    "target_stroke":COLORS.GREEN,
    "close_color":COLORS.RED,
    "far_color":COLORS.BLUE,
    "win_centroid_color":COLORS.PURPLE,
    "win_centroid_stroke":COLORS.RED,
    "win_shape_color":COLORS.RED,
    "shade_style":true //if true, use's brian's shader, if false use direct
  }
}else{
  theme = {
    "centroid_connections": COLORS.TEAL,
    "centroid": COLORS.TEAL,
    "centroid_stroke":null,
    "target": null,
    "target_stroke":COLORS.PURPLE,
    "close_color":COLORS.GREEN,
    "far_color":COLORS.BLUE,
    "win_centroid_color":COLORS.TEAL,
    "win_centroid_stroke":COLORS.PURPLE,
    "win_shape_color":COLORS.GREEN,
    "shade_style":false //if true, use's brian's shader, if false use direct
  }
}


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

const drawShape = function(points, offsetX=0, offsetY=0,color) {
  this.fill(color);
  this.noStroke();
  this.beginShape();
  points.forEach(point => this.vertex(point.x - offsetX, point.y - offsetY));
  this.endShape(this.CLOSE);
};

const drawCenterMassConnectors = function (x1, y1, x2, y2) {

  this.drawLine(x1, y1, x2, y2, theme["centroid_connections"], MASS_CONNECTORS_STROKE_WEIGHT);

};

const restoreDefaults = function() {
    // Reset defaults for fill/stroke colors.
    this.strokeWeight(1);
    this.stroke(COLORS.BLACK);
};

const drawGoal = function(){
  this.strokeWeight(2);
  // TODO refactors into enums/constants up top.
  this.stroke(theme["target_stroke"]);
  
  if (theme["target"] == null){
    this.noFill();
  }
  this.drawCircle(this.goalX, this.goalY, GOAL_RADIUS, theme["target"]);

};

const updateGoal = function(){
  if (DEBUG){
    this.goalX = parseInt(Math.random() * Display.width * (1/3) + (Display.width * (1/3)));
    this.goalY = parseInt(Math.random() * Display.height * (1/3) + (Display.height * (1/3)));    
  }else{
    this.goalX = parseInt(Math.random() * Display.width * (2/3) + (Display.width * (1/6)));
    this.goalY = parseInt(Math.random() * Display.height * (2/3) + (Display.height * (1/6)));
  }
};

const distToColor = function(d) {
  if (theme["shade_style"]){
    const corners = [
      [0, 0], 
      [0, Display.height],
      [Display.width, 0],
      [Display.width, Display.height]
    ];
    const dists = corners.map(point => this.dist(point[0], point[1], this.goalX, this.goalY));
    const maxDist = this.max(dists);

    const MIDPOINT = 0.3;
    const ratio = d / maxDist;
    const closecolor = this.color(theme["close_color"][0],theme["close_color"][1],theme["close_color"][2]);
    const farcolor = this.color(theme["far_color"][0],theme["far_color"][1],theme["far_color"][2]);

    const sat = parseInt(this.abs(ratio - MIDPOINT) * 100 / MIDPOINT);
    const colStr = 'hsb(' + this.hue(ratio > MIDPOINT ? farcolor : closecolor) + ', ' + sat + '%, 100%)';
    return this.color(colStr);
  }else{
    const maxDist = (2**0.5)/2 * Display.width;
    const MIDPOINT = 0.3;
    const ratio = d / maxDist;
    return this.color(
        ((theme["far_color"][0]**2)*ratio + (theme["close_color"][0]**2)*(1-ratio))**0.5,
        ((theme["far_color"][1]**2)*ratio + (theme["close_color"][1]**2)*(1-ratio))**0.5,
        ((theme["far_color"][2]**2)*ratio + (theme["close_color"][2]**2)*(1-ratio))**0.5,
      );
  }
};

const rotatePolygon = function(points, centerX, centerY, angle){
  this.translate(centerX, centerY);
  this.angleMode(this.RADIANS);
  this.rotate(angle);

  this.drawShape(points,centerX,centerY,theme["win_shape_color"]);
  this.strokeWeight(3);

  this.stroke(theme["win_centroid_stroke"]);
  //
  this.drawCircle(0, 0, CENTER_RADIUS,theme["win_centroid_color"]);

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
};

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
var finalUserLocations = [];
var finalCenterOfMass = [];
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
    var tmpUserLocations = this.orderPoints(userLocations);

    const distToGoal = this.dist(centerX, centerY, this.goalX, this.goalY);

    this.drawShape(tmpUserLocations,0,0,this.distToColor(distToGoal));
    for (let user of floor.users) {
      this.drawCenterMassConnectors(user.x, user.y, centerX, centerY);
    }

    this.drawCircle(centerX, centerY, CENTER_RADIUS, theme["centroid"]);


    this.drawGoal();
    var distance = ((centerX-this.goalX)**2 + (centerY-this.goalY)**2)**0.5
    if (distance < 10)   {
      this.gameOver = true;
      finalUserLocations = tmpUserLocations;
      finalCenterOfMass = [];
      finalCenterOfMass.push(centerX);
      finalCenterOfMass.push(centerY);
    }
    users.forEach(user => {
      pb.drawUser(user);
    })

  } else {
    this.rotatePolygon(finalUserLocations, finalCenterOfMass[0], finalCenterOfMass[1], angle);
    angle += this.PI/24;
    if(angle >= 3*this.PI){
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
  numGhosts: 3,
  ghostBounds: {
    x: Display.width / 6,
    y: Display.height / 6,
    width: Display.width * 2 / 3,
    height: Display.height * 2 / 3
  }
};
export default behavior;
