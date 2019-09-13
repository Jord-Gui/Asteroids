/**
 * a pure function that determines whether two circles have collided 
 * @param x1 the x-coordinate of the first circle
 * @param y1 the y-coordinate of the first circle
 * @param x2 the x-coordinate of the second circle
 * @param y2 the y-coordinate of the second circle
 * @param r1 the radius of the first circle
 * @param r2 the radius of the second circle
 */
function collisionDetectedCircles(x1: number, y1: number, x2: number, y2: number, r1: number, r2: number): boolean {
// check whether the distance between the centre of the two circles is less than the sum of their radii
const distance = Math.sqrt((x2-x1)**2 + (y2-y1)**2), sum = r1+r2;
// collision occurs if the distance between the centre of the two circles is less than the sum of their radii
return distance < sum? true: false;
}

/**
 * a pure function that determines the next position of an object based on its direction and velocity
 * @param svg the map that the object is on
 * @param x the initial x position of the object
 * @param y teh initial y position of the object
 * @param velocity the velocity of the object
 * @param rotation the rotation of the object
 * @param wrapping whether the object wraps around the map or not
 */
function nextPosition(svg: HTMLElement, x: number, y: number, velocity: number, rotation: number, wrapping: boolean): {nextX: number, nextY: number} {
let nextX: number, nextY: number;
if (wrapping) {
    nextX = x<0? svg.clientWidth: x>svg.clientWidth? 0: x+velocity*Math.cos((rotation-90)*(Math.PI/180))
    nextY = y<0? svg.clientHeight: y>svg.clientHeight? 0: y+velocity*Math.sin((rotation-90)*(Math.PI/180))
}
else {
    // next position is based on their current position, velocity, and the direction that they are facing
    nextX = x + velocity*Math.cos((rotation-90)*(Math.PI/180));
    nextY = y + velocity*Math.sin((rotation-90)*(Math.PI/180));
}
return {nextX: nextX, nextY: nextY}
}