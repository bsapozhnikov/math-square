/* MoMath Math Square Behavior
 *
 *        Title: Center of Mass
 *  Description: Users form a polygon and try to place its center of mass (centroid) over the target
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

const DEBUG = false;

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

const GAME_STATES = {
  PLAYING: 0,
  DONE: 1
};

const CENTER_RADIUS = 10;
const GOAL_RADIUS = 10;
const GOAL_BOUNDS_SIZE_FACTOR = DEBUG ? (1/3) : (2/3);
const MASS_CONNECTORS_STROKE_WEIGHT = 4;

// Other vars which aren't consts
let p5, goalX, goalY;
var gameState = GAME_STATES.PLAYING;

const THEMES = [
  {
    centroidConnections: COLORS.PURPLE,
    centroid: COLORS.PURPLE,
    target: null,
    targetStroke: COLORS.GREEN,
    closeColor: COLORS.RED,
    farColor: COLORS.BLUE,
    winCentroidColor: COLORS.PURPLE,
    winCentroidStroke: COLORS.RED,
    winShapeColor: COLORS.RED,
    shadeStyle: true //if true, use's brian's shader, if false use direct
  },
  {
    centroidConnections: COLORS.TEAL,
    centroid: COLORS.TEAL,
    target: null,
    targetStroke: COLORS.PURPLE,
    closeColor: COLORS.GREEN,
    farColor: COLORS.BLUE,
    winCentroidColor: COLORS.TEAL,
    winCentroidStroke: COLORS.PURPLE,
    winShapeColor: COLORS.GREEN,
    shadeStyle: false //if true, use's brian's shader, if false use direct
  }  
];
const COLOR_SCHEME = 1;
const THEME = THEMES[COLOR_SCHEME];

/** Helper Functions **/
const drawCircle = function(x, y, r, color) {
  if (color) {
    p5.fill(color);
  }
  p5.ellipse(x, y, r * 2, r * 2);
};

const drawLine = function(x1, y1, x2, y2, strokeColor, strokeWeight) {
  p5.strokeWeight(strokeWeight);
  p5.stroke(strokeColor);
  p5.line(x1, y1, x2, y2);
  restoreDefaults();
};

const drawShape = function(points, color, offsetX=0, offsetY=0) {
  p5.fill(color);
  p5.noStroke();
  p5.beginShape();
  points.forEach(point => p5.vertex(point.x - offsetX, point.y - offsetY));
  p5.endShape(p5.CLOSE);
};

const drawCenterMassConnectors = function (x1, y1, x2, y2) {
  drawLine(x1, y1, x2, y2, THEME.centroidConnections, MASS_CONNECTORS_STROKE_WEIGHT);
};

const restoreDefaults = function() {
  // Reset defaults for fill/stroke colors.
  p5.strokeWeight(1);
  p5.stroke(COLORS.BLACK);
};

const drawGoal = function(){
  p5.strokeWeight(2);
  // TODO refactors into enums/constants up top.
  p5.stroke(THEME.targetStroke);
  
  if (THEME.target == null){
    p5.noFill();
  }
  drawCircle(goalX, goalY, GOAL_RADIUS, THEME.target);

};

const updateGoal = function(){
  const BOUNDING_OFFSET_FACTOR = (1 - GOAL_BOUNDS_SIZE_FACTOR) / 2;
  const boundingX = Display.width * BOUNDING_OFFSET_FACTOR;
  const boundingY = Display.height * BOUNDING_OFFSET_FACTOR;
  const boundingWidth = Display.width * GOAL_BOUNDS_SIZE_FACTOR;
  const boundingHeight = Display.height * GOAL_BOUNDS_SIZE_FACTOR;
  goalX = parseInt(Math.random() * boundingX + boundingWidth);
  goalY = parseInt(Math.random() * boundingY + boundingHeight);
};

const distToColor = function(d) {
  let maxDist, ratio;
  const MIDPOINT = 0.3;
  if (THEME.shadeStyle){
    const corners = [
      [0, 0], 
      [0, Display.height],
      [Display.width, 0],
      [Display.width, Display.height]
    ];
    const dists = corners.map(point => p5.dist(point[0], point[1], goalX, goalY));
    maxDist = p5.max(dists);

    ratio = d / maxDist;
      const closecolor = p5.color(THEME.closeColor[0],THEME.closeColor[1],THEME.closeColor[2]);
    const farcolor = p5.color(THEME.farColor[0],THEME.farColor[1],THEME.farColor[2]);

    const sat = parseInt(p5.abs(ratio - MIDPOINT) * 100 / MIDPOINT);
    const colStr = 'hsb(' + p5.hue(ratio > MIDPOINT ? farcolor : closecolor) + ', ' + sat + '%, 100%)';
    return p5.color(colStr);
  } else {
    maxDist = (p5.sqrt(2))/2 * Display.width;
    ratio = d / maxDist;
      return p5.color(
	  p5.sqrt(
	      p5.sq(THEME.farColor[0])*ratio + p5.sq(THEME.closeColor[0])*(1-ratio)
	  ),
	  p5.sqrt(
	      p5.sq(THEME.farColor[1])*ratio + p5.sq(THEME.closeColor[1])*(1-ratio)
	  ),
	  p5.sqrt(
	      p5.sq(THEME.farColor[2])*ratio + p5.sq(THEME.closeColor[2])*(1-ratio)
	  )	 
    );
  }
};

const rotatePolygon = function(points, centerX, centerY, angle){
  p5.translate(centerX, centerY);
  p5.angleMode(p5.RADIANS);
  p5.rotate(angle);

  drawShape(points, THEME.winShapeColor, centerX, centerY);
  p5.strokeWeight(3);
  p5.stroke(THEME.winCentroidStroke);
  drawCircle(0, 0, CENTER_RADIUS, THEME.winCentroidColor);

};

const orderPoints = function(points){
  const sortedpoints = points.slice().sort((p1, p2) => {
    if (p1.x == p2.x){
      return p1.y - p2.y;
    }
    return p1.x - p2.x;
  });

  function YOnLine(point,leftpoint,rightpoint){
    const fraction = (point.x - leftpoint.x) / (rightpoint.x - leftpoint.x);
    return leftpoint.y + fraction * (rightpoint.y - leftpoint.y);
  }

  var answer = new Array(sortedpoints.length);

  answer[0] = sortedpoints[0];
  answer[sortedpoints.length - 1] = sortedpoints[sortedpoints.length - 1];

  var answerFront = 1;
  var answerBack = sortedpoints.length - 1;

  for (var i = 1; i < sortedpoints.length - 1; i++) {
    let lineY = YOnLine(sortedpoints[i],sortedpoints[0],sortedpoints[sortedpoints.length-1]);
    if (sortedpoints[i].y > lineY) {
      answer[answerFront] = sortedpoints[i];
      answerFront++;
    } else {
      answer[answerBack] = sortedpoints[i];
      answerBack--;
    }
  }
  answer[answerFront] = sortedpoints[sortedpoints.length - 1];
  return answer;
};

/** Lifecycle Functions **/
pb.setup = function(p) {
  p5 = this;
  gameState = GAME_STATES.PLAYING;
  updateGoal();
};

var angle = 0;
var finalUserLocations = [];
var finalCenterOfMass = [];
pb.draw = function(floor, p) {
  this.clear();
  if(gameState == GAME_STATES.PLAYING){
    let centerX = 0, centerY = 0, numUsers = 0;
    var userLocations = [];
    var users = [];

    // calculate users and centroid info
    floor.users.forEach((user) => {
      userLocations.push({x:user.x,y:user.y});
      users.push(user);
      centerX += user.x;
      centerY += user.y;
      numUsers++;
    });
    centerX /= numUsers;
    centerY /= numUsers;
    var tmpUserLocations = orderPoints(userLocations);

    // draw polygon, connectors, centroid, goal, and users
    const distToGoal = this.dist(centerX, centerY, goalX, goalY);
    drawShape(tmpUserLocations, distToColor(distToGoal), 0, 0);
    floor.users.forEach((user) => {
      drawCenterMassConnectors(user.x, user.y, centerX, centerY);
    });
    drawCircle(centerX, centerY, CENTER_RADIUS, THEME.centroid);
    drawGoal();
    users.forEach(user => {
      pb.drawUser(user);
    });
      
    // check if winner
    if (distToGoal < 10) {
      gameState = GAME_STATES.DONE;
      finalUserLocations = tmpUserLocations;
      finalCenterOfMass = [];
      finalCenterOfMass.push(centerX);
      finalCenterOfMass.push(centerY);
    }

  } else {
    if(angle >= 3*p5.PI){
      // done rotating
      p5.rotate(-1 * angle);
      p5.translate(-1 * finalCenterOfMass[0], -1 * finalCenterOfMass[1]);
      gameState = GAME_STATES.PLAYING;
      updateGoal();
      angle = 0;
    } else {
      // rotate polygon
      rotatePolygon(finalUserLocations, finalCenterOfMass[0], finalCenterOfMass[1], angle);
      angle += p5.PI/24;
    }
  }

};

/** Export **/
export const behavior = {
  title: "Center of Mass",
  init: pb.init.bind(pb),
  frameRate: 'sensors',
  render: pb.render.bind(pb),
  numGhosts: 6,
  ghostBounds: {
    x: Display.width / 6,
    y: Display.height / 6,
    width: Display.width * 2 / 3,
    height: Display.height * 2 / 3
  }
};
export default behavior;
