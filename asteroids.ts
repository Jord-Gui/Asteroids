// FIT2102 2019 Assignment 1 - Jord Gui 29805457
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

function asteroids() {
  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!  
  // Explain which ideas you have used ideas from the lectures to 
  // create reusable, generic functions.

  // HTML file contains instructions on how to play the game. 
  /*Definition of functions that help with logic calculation can be
    found in the helperfunctions.ts file
  */
  /* Detail of design given below: 
    The...
  */

  const svg = document.getElementById("canvas")!;

  let 
    // make a group for the spaceship and a transform to move it and rotate it
    // the spaceship is animated by updating the transform and rotate property
    g: Elem = new Elem(svg,'g')
      .attr("transform","translate(300 300) rotate(0)")  
      .attr("velocity", 10)
      .attr("rpm", 10)
      .attr("hitbox", 20)
      .attr("invincible", "true"),
    // create a polygon shape for the ship as a child of the transform group
    ship: Elem = new Elem(svg, 'polygon', g.elem)
      .attr("points","-15,20 0,10 15,20 0,-20")
      .attr("style","fill:yellow;stroke:white;stroke-width:1"),
    // attribute to check whether the game is over
    isGameOver: boolean = false,
    // countdown to let players get ready to play at the start of the game
    startTimer = new Elem(svg, 'text')
      .attr('x', 50)
      .attr('y', 100)
      .attr('fill', 'black')
      .attr('font-size', 100)
      .attr("stroke", "white")
      .attr("stroke-width", 1)
    // set startTime initial value
    startTimer.elem.textContent = "3"

  const
    // create an interval of time that represents a time step in the game
    mainInterval: Observable<number> = Observable.interval(10),
    // observable for actions that require the game to be over
    gameOver: Observable<number> = mainInterval.filter(_ => isGameOver === true),
    // observable for when player hits a key down
    keydown: Observable<KeyboardEvent> = Observable.fromEvent<KeyboardEvent>(document, "keydown").takeUntil(gameOver),
    // observable for when there is a key up
    keyup: Observable<KeyboardEvent> = Observable.fromEvent<KeyboardEvent>(document, "keyup").takeUntil(gameOver),
    // regex that gets the current position of the ship and stores it in an array
    currentShipPosition: RegExpExecArray = /translate\((\d+) (\d+)\) rotate\((\d+)\)/.exec(g.attr("transform")) as RegExpExecArray,
    // array to store lasers after they are created
    lasers: Elem[] = [],
    // array to store asteroids after they are created
    asteroids: Elem[] = [],
    // main observable that represents the passage of time in the game
    mainObservable = mainInterval
      .takeUntil(gameOver)
      .map((time) => {
        return {
          laserArray: lasers,
          asteroidArray: asteroids,
          time: time,
          countDown: startTimer
        }
      })

  // function to move the ship depending on which key is pressed
  function moveShip(Key: String, moveFunction: () => {x: Number, y: Number, rotation: Number}): void {
    keydown
    .filter((e) => e.code === Key && !e.repeat) // ensure that when key is held down e.repeat keys are filtered out
    .flatMap(() => {
      return mainInterval // while the key is being held down, update the position of the ship
        .takeUntil(keyup)
        .map(() => {
          return {x: String(moveFunction().x), y: String(moveFunction().y), rotation: String(moveFunction().rotation)}
        })
    })
    .subscribe(({x, y, rotation}) => {
      // update the current position of the ship
      g.attr("transform", `translate(${currentShipPosition[1] = x} ${currentShipPosition[2] = y}) rotate(${currentShipPosition[3] = rotation})`)
    })
  }
  
  // function to move the ship anti-clockwise by subtracting from the rotation of the g element
  const moveShipACW = () => ({x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), rotation: Number(currentShipPosition[3]) - Number(g.attr("rpm"))})
  // function to move the ship clockwise by adding to the rotation of the g element
  const moveShipCW = () => ({x: Number(currentShipPosition[1]), y: Number(currentShipPosition[2]), rotation: Number(currentShipPosition[3]) + Number(g.attr("rpm"))})
  // function to move the ship forward in the direction of the front of the ship and wrapping the ship around if it gets to the edge of the canvas
  const moveShipForward = () => {
    // update ship position and wrap it around if it has reached the edges of the canvas
    const newPosition = nextPosition(svg, Number(currentShipPosition[1]), Number(currentShipPosition[2]), Number(g.attr("velocity")), Number(currentShipPosition[3]), true)
    return {x: newPosition.nextX, y: newPosition.nextY, rotation: Number(currentShipPosition[3])}
  }
  
  // call the function to move the ship
  moveShip("KeyW", moveShipForward);
  moveShip("KeyA", moveShipACW);
  moveShip("KeyD", moveShipCW);

  // create lasers whenever the space bar is pressed down
  keydown
    // if ship is invincible, they can't shoot lasers
    // can't hold down space bar and shoot - must keep pressing
    .filter((e) => e.code === "Space" && !(e.repeat) && g.attr("invincible") === "false") 
    .map(() => {
      // create a new laser
      return new Elem(svg, 'circle')
        .attr("cx", currentShipPosition[1])
        .attr("cy", currentShipPosition[2])
        .attr("rotation", currentShipPosition[3])
        .attr("r", 2)
        .attr("velocity", 10)
        .attr("style", "fill:#66ff66;stroke:#00cc66;stroke-width:1")
      })
    .subscribe((laser) => lasers.push(laser))
  
   // make laser move at each time step
  mainObservable
    .flatMap(({laserArray, asteroidArray}) => {
      return Observable // turn the lasers array into an observable that can then be flatmapped
        .fromArray(laserArray)
        .map((laser) => {
          // move laser based on direction of when it was initially shot
          const newPosition = nextPosition(svg, Number(laser.attr("cx")), Number(laser.attr("cy")), Number(laser.attr("velocity")), Number(laser.attr("rotation")), false)
          // get the asteroids that the laser has hit
          const collidedAsteroids = asteroidArray.filter((a: Elem) => collisionDetectedCircles(newPosition.nextX, newPosition.nextY, Number(a.attr('cx')), Number(a.attr('cy')), Number(laser.attr('r')), Number(a.attr('r'))))
          return {x: newPosition.nextX, y: newPosition.nextY, laser: laser, collidedAsteroids: collidedAsteroids}
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

  // Observable to create a random number of asteroids
  mainInterval
    .takeUntil(mainInterval.filter((t) => t === 50))
    .map(() => {
      // create new asteroid
      return new Elem(svg, "circle")
        .attr("r", 30)
        .attr("cx", Math.floor(Math.random()*svg.clientWidth))
        .attr("cy", Math.floor(Math.random()*svg.clientHeight))
        .attr("rotation", Math.floor(Math.random()*360))
        .attr("velocity", 2)
        .attr("style","fill:black;stroke:white;stroke-width:1") 
    })
    .subscribe((asteroid) => asteroids.push(asteroid))
  
    // give the asteroids movement at each time step
  mainObservable
    .flatMap(({asteroidArray}) => {
      return Observable
        .fromArray(asteroidArray) // turn the array of asteroids into an observable which can then be flatmapped 
        .map((asteroid) => {
          // update the position of the asteroid and check if asteroid has reached edge of map, in which case wrap around
          const newPosition = nextPosition(svg, Number(asteroid.attr("cx")), Number(asteroid.attr("cy")), Number(asteroid.attr("velocity")), Number(asteroid.attr("rotation")), true)
          // check if the asteroid has collided with the ship
          const collisionDetected = collisionDetectedCircles(newPosition.nextX, newPosition.nextY, Number(currentShipPosition[1]), Number(currentShipPosition[2]), Number(asteroid.attr("r")), Number(g.attr("hitbox")))
          return {x: newPosition.nextX, y: newPosition.nextY, asteroid: asteroid, collision: collisionDetected}
        })
    })
    .subscribe(({x, y, asteroid, collision}) => {
      // update the position of the asteroid but if the ship collides with an asteroid it is game over
      collision && (g.attr("invincible") === "false")? isGameOver=true: asteroid.attr("cx", x), asteroid.attr("cy", y)
    })
  
  // animate the countdown timer 
  // make ship invincible for first 3 seconds in case asteroids spawn on it
  mainObservable
  .filter(({time}) => time%1000 === 0)
  // refactor if time permits
  .subscribe(({time, countDown}) => {
    if (time === 1000) {
      countDown.elem.textContent = "2"
    } 
    else if (time === 2000) {
      countDown.elem.textContent = "1"
    }
    else if (time === 3000) {
      countDown.elem.textContent = "GO!"
      g.attr("invincible", "false")
      ship.attr("style","fill:black;stroke:white;stroke-width:1")
    }
    else {
      countDown.elem.remove()
    }
  })

  // display You Win message when all asteroids are destroyed
  mainObservable
    // assume it doesn't take a second to complete the game and give time to create asteroids
    .filter(({time, asteroidArray}) => time > 1000 && asteroidArray.length === 0)
    .subscribe((win) => {
      // display You Win message
      document.getElementById("lives")!.innerHTML = "YOU WIN 💚"
      document.getElementById("lives")!.style.color = "green"
      // change colour of ship to green
      ship.attr("style", "fill:green;stroke:white;stroke-width:1")
      isGameOver = true
    })

  // display You Lose message if the player loses
  gameOver
    .filter(() => asteroids.length > 0) // check that the player is the one that lost
    .subscribe(() => {
      // display Game Over message
      document.getElementById("lives")!.innerHTML = "YOU LOSE 😡"
      document.getElementById("lives")!.style.color = "red"
      // change colour of ship to red
      ship.attr("style", "fill:red;stroke:white;stroke-width:1")
    }) 
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }

 

 
