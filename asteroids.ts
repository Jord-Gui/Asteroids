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

  let 
    // make a group for the spaceship and a transform to move it and rotate it
    // the spaceship is animated by updating the transform and rotate property
    g = new Elem(svg,'g')
      .attr("transform","translate(300 300) rotate(0)")  
      .attr("velocity", 10)
      .attr("rpm", 10)
      .attr("hitbox", 20),
      // create a polygon shape for the ship as a child of the transform group
      ship = new Elem(svg, 'polygon', g.elem)
      .attr("points","-15,20 0,10 15,20 0,-20")
      .attr("style","fill:black;stroke:white;stroke-width:1"),
      // attribute to check whether the game is over
      isGameOver = false;

  const
    // create an interval of time that represents a time step in the game
    tickTockInterval = Observable.interval(10),
    // observable for when the game is over
    gameOver = tickTockInterval.filter(_ => isGameOver === true),
    // observable for when player hits a key down
    keydown = Observable.fromEvent<KeyboardEvent>(document, "keydown").takeUntil(gameOver),
    // observable for when there is a key up
    keyup = Observable.fromEvent<KeyboardEvent>(document, "keyup").takeUntil(gameOver),
    // regex that gets the current position of the ship and stores it in an array
    currentShipPosition = /translate\((\d+) (\d+)\) rotate\((\d+)\)/.exec(g.attr("transform")) as RegExpExecArray,
    // array to store lasers after they are created
    lasers: Elem[] = [],
    // array to store asteroids after they are created
    asteroids: Elem[] = [],
    // main observable that represents the passage of time in the game
    tickTockObservable = tickTockInterval
      .takeUntil(gameOver)
      .map(() => {
        return {
          lasers: lasers,
          asteroids: asteroids
        }
      })

  // a function that determines whether two circles have collided 
  //by determining whether the distance between the centre of the two circles is less than the sum of their radii
  function collisionDetectedCircles(x1: number, y1: number, x2: number, y2: number, r1: number, r2: number): boolean {
    const distance = Math.sqrt((x2-x1)**2 + (y2-y1)**2), sum = r1+r2;
    return distance < sum? true: false;
  }

  // function to move the ship depending on which key is pressed
  function moveShip(Key: String, moveFunction: () => {x: Number, y: Number, z: Number}): void {
    keydown
    .filter((e) => e.code === Key && !e.repeat) // ensure that when key is held down e.repeat keys are filtered out
    .flatMap(() => {
      return tickTockInterval // while the key is being held down, update the position of the ship
        .takeUntil(keyup)
        .map(() => {
          return {x: String(moveFunction().x), y: String(moveFunction().y), z: String(moveFunction().z)}
        })
    })
    .subscribe(({x, y, z}) => {
      // update the current position of the ship
      g.attr("transform", `translate(${currentShipPosition[1] = x} ${currentShipPosition[2] = y}) rotate(${currentShipPosition[3] = z})`)
    })
  }
  // function to move the ship anti-clockwise by subtracting from the rotation of the g element
  const moveACW = () => ({x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), z: Number(currentShipPosition[3]) - Number(g.attr("rpm"))})
  // function to move the ship clockwise by adding to the rotation of the g element
  const moveCW = () => ({x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), z: Number(currentShipPosition[3]) + Number(g.attr("rpm"))})
  // function to move the ship forward in the direction of the front of the ship and wrapping the ship around if it gets to the edge of the canvas
  const moveForward = () => {
    // get the current position of the ship
    const x = Number(currentShipPosition[1])
    const y = Number(currentShipPosition[2])
    const z = Number(currentShipPosition[3])
    // check if ship has reached the edges of the canvas, and if it has, wrap it around
    // otherwise update its position
    const newX = x<0? svg.clientWidth: x>svg.clientWidth? 0: x+Number(g.attr("velocity"))*Math.cos((z-90)*(Math.PI/180))
    const newY = y<0? svg.clientHeight: y>svg.clientHeight? 0: y+Number(g.attr("velocity"))*Math.sin((z-90)*(Math.PI/180))
    return {x: newX, y: newY, z: z}
  }
  // call the function to move the ship
  moveShip("KeyW", moveForward);
  moveShip("KeyA", moveACW);
  moveShip("KeyD", moveCW);

  // create lasers whenever the space bar is pressed down
  keydown
    .filter((e) => e.code === "Space")
    .map(() => {
      // create a new laser
      return new Elem(svg, 'circle')
        .attr("cx", currentShipPosition[1])
        .attr("cy", currentShipPosition[2])
        .attr("z", currentShipPosition[3])
        .attr("r", 2)
        .attr("velocity", 10)
        .attr("style", "fill:#66ff66;stroke:#00cc66;stroke-width:1")
      })
    .subscribe((laser) => lasers.push(laser))
  // make laser move at each time step
  tickTockObservable
    .flatMap(({lasers}) => {
      return Observable // turn the lasers array into an observable that can then be flatmapped
        .fromArray(lasers)
        .map((laser) => {
          // move laser based on direction of when it was initially shot
          const x = Number(laser.attr("cx")) + Number(laser.attr("velocity"))*Math.cos((Number(laser.attr("z"))-90)*(Math.PI/180));
          const y = Number(laser.attr("cy")) + Number(laser.attr("velocity"))*Math.sin((Number(laser.attr("z"))-90)*(Math.PI/180));
          // get the asteroids that the laser has hit
          const collidedAsteroids = asteroids.filter((a: Elem) => collisionDetectedCircles(x, y, Number(a.attr('cx')), Number(a.attr('cy')), Number(laser.attr('r')), Number(a.attr('r'))))
          return {x: x, y: y, laser: laser, collidedAsteroids: collidedAsteroids}
        })
    })
    .subscribe(({x, y, laser, collidedAsteroids}) => {
        // move laser and it disappears if it reaches the edge of the map
        x<0 || y<0 || x>svg.clientWidth || y>svg.clientHeight? (laser.elem.remove(), lasers.splice(lasers.indexOf(laser), 1)): laser.attr("cx", x) && laser.attr("cy", y);
        // destroy the asteroid and laser if they collide
        collidedAsteroids.forEach((asteroid) => {
          asteroid.elem.remove() // remove asteroid svg element from canvas
          asteroids.splice(asteroids.indexOf(asteroid), 1) // remove asteroid object from array
          laser.elem.remove() // remove laser svg element from canvas
          lasers.splice(lasers.indexOf(laser), 1) // remove laser object from array
        })
    })

  // Observable to create a limited number of asteroids
  tickTockInterval
    .takeUntil(tickTockInterval.filter(i => i === 50))
    .map(() => {
      // create new asteroid
      return new Elem(svg, "circle")
        .attr("r", 25)
        .attr("cx", Math.floor(Math.random()*svg.clientWidth))
        .attr("cy", Math.floor(Math.random()*svg.clientHeight))
        .attr("z", Math.floor(Math.random()*360))
        .attr("velocity", 2)
        .attr("style","fill:black;stroke:white;stroke-width:1") 
    })
    .subscribe((asteroid) => asteroids.push(asteroid))

  // give the asteroids movement at each time step
  tickTockObservable
    .flatMap(({asteroids}) => {
      return Observable
        .fromArray(asteroids) // turn the array of asteroids into an observable which can then be flatmapped 
        .map((asteroid) => {
          // update the position of the asteroid and check if asteroid has reached edge of map, in which case wrap around
          const x = Number(asteroid.attr("cx"))
          const newX = x < 0? svg.clientWidth: x > svg.clientWidth? 0: x + Number(asteroid.attr("velocity"))*Math.cos((Number(asteroid.attr("z"))-90)*(Math.PI/180))
          const y = Number(asteroid.attr("cy"))
          const newY = y < 0? svg.clientHeight: y > svg.clientHeight? 0: y + Number(asteroid.attr("velocity"))*Math.sin((Number(asteroid.attr("z"))-90)*(Math.PI/180))
          // check if the asteroid has collided with the ship
          const collisionDetected = collisionDetectedCircles(x, y, Number(currentShipPosition[1]), Number(currentShipPosition[2]), Number(asteroid.attr("r")), Number(g.attr("hitbox")))
          return {x: newX, y: newY, asteroid: asteroid, collision: collisionDetected}
        })
    })
    .subscribe(({x, y, asteroid, collision}) => {
      // update the position of the asteroid but if the ship collides with an asteroid it is game over
      collision? isGameOver=true: asteroid.attr("cx", x), asteroid.attr("cy", y)
    })

  // display game win message when all asteroids are destroyed
  tickTockInterval
    .takeUntil(gameOver)
    .filter(t => t>1000) // assuming it doesn't take a second to complete the game
    .filter(() => asteroids.length === 0)
    .subscribe(() => {
      // create the game win message
      let win = new Elem(svg, "text")
        .attr("x", 110)
        .attr("y", svg.clientHeight/2)
        .attr("fill", "green")
        .attr("font-family", "liberation sans")
        .attr("font-size", 80)
      win.elem.textContent = "YOU WIN"
      // change colour of ship
      ship.attr("style", "fill:green;stroke:white;stroke-width:1")
      isGameOver = true
    })

  // display game over message if the player loses
  gameOver
    .filter(() => asteroids.length > 0) // check that the player is the one that lost
    .subscribe(() => {
      // create the game over message
      let endGame = new Elem(svg, "text")
        .attr("x", 65)
        .attr("y", svg.clientHeight/2)
        .attr("fill", "red")
        .attr("font-family", "liberation sans")
        .attr("font-size", 80)
      endGame.elem.textContent = "GAME OVER"
      // change colour of ship
      ship.attr("style", "fill:red;stroke:white;stroke-width:1")
    }) 
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }

 

 
