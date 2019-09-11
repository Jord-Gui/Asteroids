// a pure function that determines whether two circles have collided 
//by determining whether the distance between the centre of the two circles is less than the sum of their radii
function collisionDetectedCircles(x1: number, y1: number, x2: number, y2: number, r1: number, r2: number): boolean {
const distance = Math.sqrt((x2-x1)**2 + (y2-y1)**2), sum = r1+r2;
return distance < sum? true: false;
}


// a pure function that determines the next position of an object based on its direction and velocity
function nextPosition(svg: HTMLElement, x: number, y: number, velocity: number, rotation: number, wrapping: boolean): {nextX: number, nextY: number} {
let nextX: number, nextY: number;
if (wrapping) {
    nextX = x<0? svg.clientWidth: x>svg.clientWidth? 0: x+velocity*Math.cos((rotation-90)*(Math.PI/180))
    nextY = y<0? svg.clientHeight: y>svg.clientHeight? 0: y+velocity*Math.sin((rotation-90)*(Math.PI/180))
}
else {
    nextX = x + velocity*Math.cos((rotation-90)*(Math.PI/180));
    nextY = y + velocity*Math.sin((rotation-90)*(Math.PI/180));
}
return {nextX: nextX, nextY: nextY}
}