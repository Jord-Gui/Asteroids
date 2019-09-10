// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

function asteroids() {
  // Inside this function you will use the classes and functions 
  // defined in svgelement.ts and observable.ts
  // to add visuals to the svg element in asteroids.html, animate them, and make them interactive.
  // Study and complete the Observable tasks in the week 4 tutorial worksheet first to get ideas.
  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!  
  // Explain which ideas you have used ideas from the lectures to 
  // create reusable, generic functions.
  const svg = document.getElementById("canvas")!;
  // make a group for the spaceship and a transform to move it and rotate it
  // to animate the spaceship you will update the transform property
  let g = new Elem(svg,'g')
    .attr("transform","translate(300 300) rotate(0)")  
    .attr("velocity", 20)
    .attr("rpm", 20)
    .attr("x", 300) // x coordinate of translate
    .attr("y", 300) // y coordinate of translate
    .attr("z", 0) // rotation 
    .attr("hitbox", 20) // hitbox is a circle of radius '_'
  
  // create a polygon shape for the ship as a child of the transform group
  let ship = new Elem(svg, 'polygon', g.elem) 
    .attr("points","-15,20 15,20 0,-20") // this just creates the points of the ship
    .attr("style","fill:black;stroke:purple;stroke-width:5") // this is just the colour

  const
    // observable for when player hits a key down 
    keydown = Observable.fromEvent<KeyboardEvent>(document, 'keydown'), // it is the actual 'document' that takes keyboard events, not just svg
    // create a time observable for movement
    timeObservable = Observable.interval(10);
  let 
    // array to hold asteroids
    asteroids: Elem[] = [],
    // global variable to check when game is over
    gameOver: boolean = false;

  // a function that determines whether two circles have collided
  function collisionDetectedCircles(x1: number, y1: number, x2: number, y2: number, r1: number, r2: number): boolean {
    const distance = Math.sqrt((x2-x1)**2 + (y2-y1)**2), sum = r1+r2;
    return distance < sum? true: false;
  }

  // observable to move the ship around by updating the translate and rotate coordinates 
  keydown
    .filter(e => e.code === "KeyA" || e.code === "KeyD" || e.code === "KeyW") // e.keyCode==96 is depracated
    .scan({x: 300, y: 300, z: 0}, ({x, y, z}, e) => {
      if (e.code === "KeyW") {
        // if the x coordinate has reached the edges of svg, wrap it around
        x = x<0? svg.clientWidth: x>svg.clientWidth? 0: x+Number(g.attr("velocity"))*Math.cos((z-90)*(Math.PI/180)) // get front of ship in relation to the rotation
        // if the y coordinate has reached the edges svg, wrap it around
        y = y<0? svg.clientHeight: y>svg.clientHeight? 0: y+Number(g.attr("velocity"))*Math.sin((z-90)*(Math.PI/180)) // this ensures the ship moves in the direction it is facing
        g.attr("x", x) // set x coordinate of translate to be used for shooting
        g.attr("y", y) // set y coordinate of translate to be used for shooting
        return {x: x, y: y, z: z}
      }
      else if (e.code === "KeyA") {
        z = z-Number(g.attr("rpm")) // set z coordinate of translate to be used for shooting
        g.attr("z", z)
        return {x: x, y: y, z: z} // rotate anti-clockwise
      }
      else if (e.code === "KeyD") {
        z = z+Number(g.attr("rpm")) // set z coordinate of translate to be used for shooting
        g.attr("z", z)
        return {x: x, y: y, z: z} // rotate clockwise
      }
      else {
        return {x: x, y: y, z: z}
      }
    })
    .subscribe(value => g.attr("transform", `translate(${value.x} ${value.y}) rotate(${value.z})`));
  
  // shoot laser from ship
  keydown
    .takeUntil(timeObservable.filter(() => gameOver))
    .filter(e => e.code === "Space")
    .flatMap(() => {
      // create a new laser
      let laser = new Elem(svg, 'circle')
        .attr("cx", g.attr("x"))
        .attr("cy", g.attr("y"))
        .attr("z", g.attr("z"))
        .attr("r", 2)
        .attr("style", "fill:blue;stroke:purple;stroke-width:1")
      // move laser based on the direction of when it was initially shot
      return Observable.interval(1)
        .map(() => {
          let x = Number(laser.attr('cx')) + Math.cos((Number(laser.attr('z'))-90)*(Math.PI/180))
          let y = Number(laser.attr('cy')) + Math.sin((Number(laser.attr('z'))-90)*(Math.PI/180))
          return {
            x: x,
            y: y,
            laser: laser
          }
        })
    })
    .subscribe(({x, y, laser}) => {
      // laser disappears if it reaches the edge of the map, otherwise, move it
      x<0 || y<0 || x>svg.clientWidth || y>svg.clientHeight? laser.elem.remove(): laser.attr('cx', x) && laser.attr('cy', y);
    });
  
  // Observable to create asteroids in set intervals
  const asteroidObservable = Observable.interval(1)
  asteroidObservable
    .takeUntil(asteroidObservable.filter(i => i === 5))
    .map(() => {
      // create new asteroid
      return new Elem(svg, 'circle')
        .attr("r", 25)
        .attr("cx", Math.floor(Math.random()*svg.clientWidth))
        .attr("cy", Math.floor(Math.random()*svg.clientHeight))
        .attr("z", Math.floor(Math.random()*360))
        .attr("style","fill:pink;stroke:purple;stroke-width:1") 
    })
    .subscribe((asteroid) => asteroids.push(asteroid))
  
  // Give the asteroids movement
  timeObservable
    .takeUntil(timeObservable.filter(() => gameOver))
    .subscribe(() => {
      asteroids.forEach((asteroid) => {
        // check if asteroid has reached edge of map, in which case wrap around
        let x = Number(asteroid.attr("cx"))
        x = x < 0? svg.clientWidth: x > svg.clientWidth? 0: x + Math.cos((Number(asteroid.attr('z'))-90)*(Math.PI/180))
        let y = Number(asteroid.attr("cy"))
        y = y < 0? svg.clientHeight: y > svg.clientHeight? 0: y + Math.sin((Number(asteroid.attr('z'))-90)*(Math.PI/180))
        // check if the asteroid hits the ship
        const collisionDetected = collisionDetectedCircles(x, y, Number(g.attr('x')), Number(g.attr('y')), Number(asteroid.attr('r')), Number(g.attr('hitbox')))
        // update asteroid position and destroy ship if it hits asteroid
        collisionDetected? (ship.elem.remove(), gameOver=true): asteroid.attr("cx", x), asteroid.attr("cy", y)
      })
    })
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }

 

 
