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
  let 
    g = new Elem(svg,'g')
      .attr("transform","translate(300 300) rotate(0)")  
      .attr("velocity", 10)
      .attr("rpm", 10)
      .attr("hitbox", 20),

      ship = new Elem(svg, 'polygon', g.elem) // create a polygon shape for the ship as a child of the transform group
      .attr("points","-15,20 0,10 15,20 0,-20")
      .attr("style","fill:black;stroke:white;stroke-width:1"),
    
      gameOver = false;

  const
    // create a time observable for movement
    timeObservable = Observable.interval(10),
    // observable for when player hits a key down 
    keydown = Observable.fromEvent<KeyboardEvent>(document, 'keydown').takeUntil(timeObservable.filter(_ => gameOver === true)),
    // observable for key up
    keyup = Observable.fromEvent<KeyboardEvent>(document, 'keyup').takeUntil(timeObservable.filter(_ => gameOver === true)),
    // current position of the ship
    currentShipPosition = /translate\((\d+) (\d+)\) rotate\((\d+)\)/.exec(g.attr('transform')) as RegExpExecArray,
    // array to store lasers
    lasers: Elem[] = [],
    // array to store asteroids
    asteroids: Elem[] = [],
    // create main observable for game time
    mainGame = timeObservable
      .takeUntil(timeObservable.filter(_ => gameOver === true))
      .map(() => {
        return {
          lasers: lasers,
          asteroids: asteroids
        }
      })

  // a function that determines whether two circles have collided
  function collisionDetectedCircles(x1: number, y1: number, x2: number, y2: number, r1: number, r2: number): boolean {
    const distance = Math.sqrt((x2-x1)**2 + (y2-y1)**2), sum = r1+r2;
    return distance < sum? true: false;
  }

  // function to move the ship depending on waht key is pressed
  function moveShip(Key: String, moveFunction: () => {x: Number, y: Number, z: Number}): void {
    keydown
    .filter((e) => e.code === Key && !e.repeat)
    .flatMap(() => {
      return timeObservable
        .takeUntil(keyup)
        .map(() => {
          return {x: String(moveFunction().x), y: String(moveFunction().y), z: String(moveFunction().z)}
        })
    })
    .subscribe(({x, y, z}) => {
      g.attr("transform", `translate(${currentShipPosition[1] = x} ${currentShipPosition[2] = y}) rotate(${currentShipPosition[3] = z})`)
    })
  }
  // function to move the ship anti-clockwise
  const moveACW = () => ({x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), z: Number(currentShipPosition[3]) - Number(g.attr("rpm"))})
  // function to move the ship clockwise
  const moveCW = () => ({x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), z: Number(currentShipPosition[3]) + Number(g.attr("rpm"))})
  // function to move the ship forward
  const moveForward = () => {
    const x = Number(currentShipPosition[1])
    const y = Number(currentShipPosition[2])
    const z = Number(currentShipPosition[3])
    const newX = x<0? svg.clientWidth: x>svg.clientWidth? 0: x+Number(g.attr("velocity"))*Math.cos((z-90)*(Math.PI/180))
    const newY = y<0? svg.clientHeight: y>svg.clientHeight? 0: y+Number(g.attr("velocity"))*Math.sin((z-90)*(Math.PI/180))
    return {x: newX, y: newY, z: z}
  }
  // call the functions to move the ship
  moveShip("KeyW", moveForward);
  moveShip("KeyA", moveACW);
  moveShip("KeyD", moveCW);

  // create lasers when key is pressed down
  keydown
    .filter((e) => e.code === 'Space')
    .map(() => {
      // create a new laser
      return new Elem(svg, 'circle')
        .attr("cx", currentShipPosition[1])
        .attr("cy", currentShipPosition[2])
        .attr("z", currentShipPosition[3])
        .attr("r", 2)
        .attr("velocity", 10)
        .attr("style", "fill:black;stroke:red;stroke-width:1")
      })
    .subscribe((laser) => lasers.push(laser))
  // make laser move
  mainGame
    .flatMap(({lasers}) => {
      return Observable
        .fromArray(lasers)
        .map((laser) => {
          // move laser based on direction of when it was initially shot
          const x = Number(laser.attr('cx')) + Number(laser.attr("velocity"))*Math.cos((Number(laser.attr('z'))-90)*(Math.PI/180));
          const y = Number(laser.attr('cy')) + Number(laser.attr("velocity"))*Math.sin((Number(laser.attr('z'))-90)*(Math.PI/180));
          return {x: x, y: y, laser: laser}
        })
    })
    .subscribe(({x, y, laser}) => {
        // laser disappears if it reaches the edge of the map, otherwise move it
        x<0 || y<0 || x>svg.clientWidth || y>svg.clientHeight? (laser.elem.remove(), lasers.splice(lasers.indexOf(laser), 1)): laser.attr('cx', x) && laser.attr('cy', y);
    })

  // Observable to create asteroids in set intervals
  timeObservable
    .takeUntil(timeObservable.filter(i => i === 50))
    .map(() => {
      // create new asteroid
      return new Elem(svg, 'circle')
        .attr("r", 25)
        .attr("cx", Math.floor(Math.random()*svg.clientWidth))
        .attr("cy", Math.floor(Math.random()*svg.clientHeight))
        .attr("z", Math.floor(Math.random()*360))
        .attr("velocity", 2)
        .attr("style","fill:black;stroke:white;stroke-width:1") 
    })
    .subscribe((asteroid) => asteroids.push(asteroid))

    // Give the asteroids movement
    mainGame
      .flatMap(({asteroids}) => {
        return Observable
          .fromArray(asteroids)
          .map((asteroid) => {
            // check if asteroid has reached edge of map, in which case wrap around
            const x = Number(asteroid.attr("cx"))
            const newX = x < 0? svg.clientWidth: x > svg.clientWidth? 0: x + Number(asteroid.attr("velocity"))*Math.cos((Number(asteroid.attr('z'))-90)*(Math.PI/180))
            const y = Number(asteroid.attr("cy"))
            const newY = y < 0? svg.clientHeight: y > svg.clientHeight? 0: y + Number(asteroid.attr("velocity"))*Math.sin((Number(asteroid.attr('z'))-90)*(Math.PI/180))
                      // check if the asteroid hits the ship
            const collisionDetected = collisionDetectedCircles(x, y, Number(currentShipPosition[1]), Number(currentShipPosition[2]), Number(asteroid.attr('r')), Number(g.attr('hitbox')))
            return {x: newX, y: newY, asteroid: asteroid, collision: collisionDetected}
          })
      })
      .subscribe(({x, y, asteroid, collision}) => {
        collision? (ship.elem.remove(), gameOver=true): asteroid.attr("cx", x), asteroid.attr("cy", y)
      })
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }

 

 
