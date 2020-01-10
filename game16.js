
var scale = 33;

var Level = class Level {
  constructor(plan) {
    let rows = plan.trim().split("\n").map(l => [...l]);
    this.height = rows.length;
    this.width = rows[0].length;
    this.startActors = [];

    this.rows = rows.map((row, y) => {
      return row.map((ch, x) => {
        let type = levelChars[ch];
        if (typeof type == "string") return type;
        this.startActors.push(
          type.create(new Vec(x, y), ch));
        return "empty";
      });
    });
  }
}

var State = class State {
  constructor(level, actors, status) {
    this.level = level;
    this.actors = actors;
    this.status = status;
  }

  static start(level) {
    return new State(level, level.startActors, "playing");
  }

  get player() {
    return this.actors.find(a => a.type == "player");
  }
}

var Vec = class Vec {
  constructor(x, y) {
    this.x = x; this.y = y;
  }
  plus(other) {
    return new Vec(this.x + other.x, this.y + other.y);
  }
  times(factor) {
    return new Vec(this.x * factor, this.y * factor);
  }
}

var initialPlayerHp = 40;
var playerHp = initialPlayerHp;
var goblinHp = 35;

var swordHitPoints = 15;
var swordRange = 0.60;
var swordPickedUp = 0;
var swordAngleOfAttack = 45;

var attack = 0;

var Player = class Player {
  constructor(pos, orientation, score, speed, hp, strucked, sword, meleeRange, attackAngle, attacking) {
    this.pos = pos;
	this.orientation = orientation;
	this.score = score;
    this.speed = speed;
	this.hp = hp;
	this.strucked = strucked;
	this.sword = sword;
	this.meleeRange = meleeRange;
	this.attackAngle = attackAngle;
	this.attacking = attacking;
  }

  get type() { return "player"; }

  static create(pos) {
    return new Player(pos.plus(new Vec(0, -0.5)), 1, 0,
                      new Vec(0, 0), initialPlayerHp, 0, 0, 0, 0, attack);
  }
}

Player.prototype.size = new Vec(0.8, 1.5);

var Goblin = class Goblin {
  constructor(pos, orientation, speed, lifePoints, originalPos, walkingRange) {
    this.pos = pos;
	this.orientation = orientation;
    this.speed = speed;
    this.hp =  lifePoints;
	this.originalPos = originalPos;
	this.walkingRange = walkingRange;
  }
  
  get type() { return "goblin"; }
  
  static create(pos) {
     return new Goblin(pos, 1, new Vec(2, 0), goblinHp, pos, 3);
  }
}

Goblin.prototype.size = new Vec(0.4, 0.8);

var Spikes = class Spikes {
	constructor(pos, animFrame, speed) {
		this.pos = pos;
		this.animFrame = animFrame;
		this.speed = speed
	}

	get type() { return "spikes"; }

	static create(pos, ch) {
		if (ch == "S")
			return new Spikes(pos, 0, 300);
		return new Spikes(pos, 0, 60);
    }
}

Spikes.prototype.size = new Vec(0.9, 0.8);

var Lava = class Lava {
  constructor(pos, speed, reset) {
    this.pos = pos;
    this.speed = speed;
    this.reset = reset;
  }

  get type() { return "lava"; }

  static create(pos, ch) {
    if (ch == "=") {
      return new Lava(pos, new Vec(2, 0));
    } else if (ch == "|") {
      return new Lava(pos, new Vec(0, 2));
    } else if (ch == "v") {
      return new Lava(pos, new Vec(0, 3), pos);
    }
  }
}

Lava.prototype.size = new Vec(1, 1);

var Coin = class Coin {
	constructor(pos, basePos, wobble) {
		this.pos = pos;
		this.basePos = basePos;
		this.wobble = wobble;
	}

	get type() { return "coin"; }

	static create(pos) {
		let basePos = pos.plus(new Vec(0.2, 0.1));
		return new Coin(basePos, basePos, Math.random() * Math.PI * 2);
	}
}

Coin.prototype.size = new Vec(0.9, 0.9);

var Sword = class Sword {
	constructor(pos, hitPoints, range, attackAngle, basePos, wobble, pickedUp) {
		this.pos = pos;
		this.hitPoints = hitPoints;
		this.range = range;
		this.attackAngle = attackAngle;
		this.basePos = basePos;
		this.wobble = wobble;
		this.pickedUp = pickedUp;
	}
	
	get type() { return "sword"; }
	
	static create(pos) {
		let basePos = pos.plus(new Vec(0.2, 0.1));
		return new Sword(basePos, swordHitPoints, swordRange, swordAngleOfAttack, basePos, Math.random() * Math.PI * 2, swordPickedUp);
	}
}

Sword.prototype.size = new Vec(0.6, 0.6);

var doorKeyPickedUp = 0;
var chestKeyPickedUp = 0;
var openedTime = 0;

var Door = class Door {
	constructor(pos, blocked, openedTime) {
		this.pos = pos;
		this.blocked = blocked;
		this.openedTime = openedTime;
	}

	get type() { return "door"; }

	static create(pos) {
		console.log(!doorKeyPickedUp);
		return new Door(pos, 1, openedTime);
	}
}

Door.prototype.size = new Vec(1.5, 1);

var Key = class Key {
	constructor(pos, basePos, wobble, pickedUp, opens) {
		this.pos = pos;
		this.basePos = basePos;
		this.wobble = wobble;
		this.pickedUp = pickedUp;
		this.opens = opens;
	}
	
	get type() { return "key"; }
	
	static create(pos, ch) {
		let basePos = pos.plus(new Vec(0.2, 0.1));
		if (ch == "K")
			return new Key(basePos, basePos, Math.random() * Math.PI * 2, doorKeyPickedUp, "door");
		return new Key(basePos, basePos, Math.random() * Math.PI * 2, chestKeyPickedUp, "chest");
	}
}

Key.prototype.size = new Vec(0.7, 0.65);
	

var levelChars = {
  ".": "floor", "#": "wall", "+": "lava", "D": Door,
  "P": Player, "g": Goblin, "s": Sword, "o": Coin,
  "K": Key, "S": Spikes, "k": Key, "^": Spikes
};

Level.prototype.touches = function(pos, size, type) {
	var xStart = Math.floor(pos.x);
	var xEnd = Math.ceil(pos.x + size.x);
	var yStart = Math.floor(pos.y);
	var yEnd = Math.ceil(pos.y + size.y);

	for (var y = yStart; y < yEnd; y++) {
		for (var x = xStart; x < xEnd; x++) {
		let isOutside = x < 0 || x >= this.width ||
                      y < 0 || y >= this.height;
		let here = isOutside ? "wall" : this.rows[y][x];
		if (here == type) return true;
		}
	}
	return false;
};

Level.prototype.knockBackCheck = function(pos, direction, maxDistance) {
	console.log(pos);
	console.log(direction);
	var xStart = Math.floor(pos.x);
	console.log(xStart);
	maxDistance = Math.ceil(maxDistance);
	console.log(maxDistance);
	var xEnd = (direction == 1) ? xStart + maxDistance : xStart - maxDistance;
	console.log(xEnd);
	currentY = Math.floor(pos.y);
	for( var x = xStart; direction == 1 && x <= xEnd || direction == -1 && x >= xEnd; x += direction) {
		console.log();
		if (this.rows[currentY][x] == "wall") {
			return x -= direction;
		}
	}
	return xEnd;
}


State.prototype.update = function(time, keys) {
	let actors = this.actors.map(actor => actor.update(time, this, keys));
	let newState = new State(this.level, actors, this.status);

	if (newState.status != "playing") return newState;

	let player = newState.player;
	if (player.attacking) { newState = playerAttack(newState); }
	
	for (let actor of actors) {
		if (actor != player && overlap(actor, player)) {
			newState = actor.collide(newState);
		}
	}
	return newState;
};

function overlap(actor1, actor2) {
  return actor1.pos.x + actor1.size.x > actor2.pos.x &&
         actor1.pos.x < actor2.pos.x + actor2.size.x &&
         actor1.pos.y + actor1.size.y > actor2.pos.y &&
         actor1.pos.y < actor2.pos.y + actor2.size.y;
}

var enemies = ['goblin'];

function playerAttack(state) {
	let playerPos = state.player.pos;
	let currentEnemies = state.actors.filter(actor => enemies.includes(actor.type));
	
	if (state.player.orientation) {
		currentEnemies = currentEnemies.filter(actor => actor.pos.x < state.player.pos.x);
	} else {
		currentEnemies = currentEnemies.filter(actor => actor.pos.x > state.player.pos.x);
	}
	
	let inRangeEnemies = currentEnemies.filter(e => Math.sqrt(((playerPos.x + state.player.size.x)/2 - (e.pos.x + e.size.x)/2)*
							((playerPos.x + state.player.size.x)/2 - (e.pos.x + e.size.x)/2) +
		((playerPos.y + state.player.size.y)/2 - (e.pos.y + e.size.y)/2)*
		((playerPos.y + state.player.size.y)/2 - (e.pos.y + e.size.y)/2)) <= state.player.meleeRange);
		
	let newState = new State(state.level, state.actors, state.status);
	for (var index = 0; index < inRangeEnemies.length; index++) {
		let angle = Math.abs(Math.atan2((playerPos.y + state.player.size.y)/2 - (inRangeEnemies[index].pos.y + inRangeEnemies[index].size.y)/2, 
							(playerPos.x + inRangeEnemies[index].size.x)/2 - (inRangeEnemies[index].pos.x + inRangeEnemies[index].pos.x)/2) * 180) / Math.PI;
		if (angle < 180 && angle > 175) {
			newState = inRangeEnemies[index].attacked(newState);
		}
	}
	return new State(newState.level, newState.actors, newState.status);
}

Lava.prototype.collide = function(state) {
	return new State(state.level, state.actors, "lost");
};

Spikes.prototype.collide = function(state) {
	if (this.animFrame == 7 ||	this.animFrame == 8) {
		return new State(state.level, state.actors, "lost");
	} 
	return new State(state.level, state.actors, "playing");
};

Goblin.prototype.attacked = function(state) {
	this.hp -= state.player.sword;
	if (this.hp <= 0) {
		state.actors = state.actors.filter(actor => actor != this);
	}
	else {
		let direction = (state.player.orientation) ? -1 : 1;
		let offset = new Vec(Math.abs(this.speed.x), Math.abs(this.speed.y));
		offset = offset.times(1.5);
		this.pos.x = state.level.knockBackCheck(this.pos, direction, offset.x);
		if (Math.abs(this.originalPos.x - this.pos.x) > this.walkingRange) {
			this.originalPos.x = (this.originalPos.x + this.pos.x)/2;
		}
	}
	return new State(state.level, state.actors, state.status);
}

var enemyColisionTime = 0;
var playerFreezeTime = 10;

Goblin.prototype.collide = function(state) {
	if (!state.player.strucked) {
		playerHp -= 10;
		let direction = (this.orientation) ? -1 : 1;
		if (direction == -1 && state.player.speed.x < 0) {
			direction = 1;
		} else if (direction == 1 && state.player.speed.x > 0) {
			direction = - 1;
		}
		let offset = (state.player.speed.y || state.player.speed.x) ? 
						new Vec(Math.abs(state.player.speed.x), Math.abs(state.player.speed.y)) : 
						new Vec(Math.abs(this.speed.x), Math.abs(this.speed.y));
		offset = (state.player.speed.y || state.player.speed.x) ? offset.times(0.4) : offset.times(1.5);
		state.player.pos.x = state.level.knockBackCheck(state.player.pos, direction, offset.x);
	} 
	if (playerHp <= 0) {
			playerHp = initialPlayerHp;
			return new State(state.level, state.actors, "lost");
	} else {
		state.player.strucked = 1;
		enemyColisionTime = Date.now();
		return new State(state.level, state.actors, "playing");
	}
	return new State(state.level, state.actors, "playing");
};

Coin.prototype.collide = function(state) {
	let newState = state.actors.filter(a => a != this);
	let status = state.status;
	state.player.score += 100;
	var score = window.parent.document.getElementById('score'); 
	var theScore = sprintf("Score %d", score);
	score.innerHTML = theScore;
	return new State(state.level, newState, status);
};

Sword.prototype.collide = function(state) {
	if (!swordPickedUp) {
		state.player.sword = this.hitPoints;
		state.player.meleeRange = this.range;
		state.player.attackAngle = this.attackAngle;
		swordPickedUp = 1;
		let newState = state.actors.filter(a => a != this);
		return new State(state.level, newState, "playing");
	} 
	return new State(state.level, state, "playing");
};

Door.prototype.collide = function(state) {
	if (!this.bocked) {
		return new State(state.level, state, "playing");
	} else {
	    return new State(state.level, state, "won");
	}
};

Key.prototype.collide = function(state) {
	if (!doorKeyPickedUp && this.opens == "door") {
		doorKeyPickedUp = 1;
		let newState = state.actors.filter(a => a != this);
		return new State(state.level, newState, "playing");
	} else if (this.opens == "chest") {
		chestKeyPickedUp = 1;
		let newState = state.actors.filter(a => a != this);
		return new State(state.level, newState, "playing");
	}
	return new State(state.level, state, "playing");
};

var lastSpikeChange = Date.now();

Spikes.prototype.update = function(state) {
	this.animFrame = Math.floor((Date.now() - lastSpikeChange)/this.speed) % 10; 
	return new Spikes(this.pos, this.animFrame, this.speed);
};

Goblin.prototype.update = function(time, state) {
   if (this.speed.x != 0) {
		this.orientation = this.speed.x < 0;
   }
   let newPos = this.pos.plus(this.speed.times(time));
   if (state.level.touches(newPos, this.size, "wall") || 
			(this.speed.x && newPos.x - this.originalPos.x >= this.walkingRange)
			|| (this.speed.x && this.originalPos.x - newPos.x >= this.walkingRange)) {
	  return new Goblin(newPos, this.orientation, this.speed.times(-1), this.hp, this.originalPos, this.walkingRange);
   } else {
		return new Goblin(newPos, this.orientation, this.speed, this.hp, this.originalPos, this.walkingRange);
   }
}

var wobbleSpeed = 8, wobbleDist = 0.07;

Coin.prototype.update = function(time) {
	let wobble = this.wobble + time * wobbleSpeed;
	let wobblePos = Math.sin(wobble) * wobbleDist;
	return new Coin(this.basePos.plus(new Vec(0, wobblePos)), this.basePos, wobble);
};

Door.prototype.update = function(state) {
	let openTime = this.openedTime;
	if (doorKeyPickedUp && !openTime) {
		openTime = Date.now();
		this.blocked = 0;
	}
	return new Door(this.pos, this.blocked, openTime);
};

Sword.prototype.update = function(time, state) {
	if (!swordPickedUp) {
		let wobble = this.wobble + time * wobbleSpeed;
		let wobblePos = Math.sin(wobble) * wobbleDist;
		return new Sword(this.basePos.plus(new Vec(0, wobblePos)), this.hitPoints, this.range, this.attackAngle, this.basePos, wobble);
	}
};

Key.prototype.update = function(time, state) {
	if (!doorKeyPickedUp) {
		let wobble = this.wobble + time * wobbleSpeed;
		let wobblePos = Math.sin(wobble) * wobbleDist;
		return new Key(this.basePos.plus(new Vec(0, wobblePos)), this.basePos, wobble, this.pickedUp, this.opens);
	}
};

var playerXSpeed = 7;
var playerYSpeed = 5;
var playerStartAttack = 0;

Player.prototype.update = function(time, state, keys) {
	if (this.speed.x != 0) {
		this.orientation = this.speed.x < 0;
	}	
	if (!this.attacking) { 
		let pos = this.pos;
		let xSpeed = 0;
		let ySpeed = 0;
		if (!this.strucked || (this.strucked && ((Date.now() - enemyColisionTime) > playerFreezeTime * 30 )) ) {
			
			if (keys.a) xSpeed -= playerXSpeed;
			if (keys.d) xSpeed += playerXSpeed;
			let movedX = pos.plus(new Vec(xSpeed * time, 0));
			if (!state.level.touches(movedX, this.size, "wall")) {
				pos = movedX;
			}
			
			if (keys.s) ySpeed += playerYSpeed;
			if (keys.w) ySpeed -= playerYSpeed;
			let movedY = pos.plus(new Vec(0, ySpeed * time));
			if (!state.level.touches(movedY, this.size, "wall")) {
				pos = movedY;
			}
		}
		if ( (Date.now() - enemyColisionTime) > playerFreezeTime * 60 ) {
			this.strucked = 0;
		}
		return new Player(pos, this.orientation, this.score, new Vec(xSpeed, ySpeed), playerHp, this.strucked, this.sword, this.meleeRange, this.attackAngle, attack);
	} else { 
		if (Date.now() - playerStartAttack > 500) {
			attack = 0;
		}
		return new Player(this.pos, this.orientation, this.score, new Vec(0, 0), playerHp, this.strucked, this.sword, this.meleeRange, this.attackAngle, attack);
	}
		
};

function trackKeys(keys) {
	let down = Object.create(null);
	function track(event) {
		if (keys.includes(event.key)) {
		  down[event.key] = event.type == "keydown";
		  event.preventDefault();
		}
	}
	window.addEventListener("keydown", track);
	window.addEventListener("keyup", track);
	return down;
}

var arrowKeys =
  trackKeys(["a", "d", "w", "s", "p"]);
  
document.getElementById("theGameBox").onclick = function() {
	if (swordPickedUp) {
		attack = 1;
		playerStartAttack = Date.now();
	}
};


function runAnimation(frameFunc) {
  let lastTime = null;
  function frame(time) {
    if (lastTime != null) {
      let timeStep = Math.min(time - lastTime, 100) / 1000;
      if (frameFunc(timeStep) === false) return;
    }
    lastTime = time;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function runLevel(level, Display) {
  div = document.getElementById("theGameBox");
  let display = new Display(div, level);
  let state = State.start(level);
  let ending = 1;
  swordPickedUp = 0;
  playerHp = initialPlayerHp;
  doorKeyPickedUp = 0;
  openedTime = 0;
  chestKeyPickedUp = 0;
  lastSpikeChange = Date.now();
  return new Promise(resolve => {
    runAnimation(time => {
      state = state.update(time, arrowKeys);
      display.syncState(state);
      if (state.status == "playing") {
        return true;
      } else if (ending > 0) {
        ending -= time;
        return true;
      } else {
        display.clear();
        resolve(state.status);
        return false;
      }
    });
  });
}

async function runGame(plans, Display) {
  for (let level = 0; level < plans.length;) {
    let status = await runLevel(new Level(plans[level]),
                                Display);
    if (status == "won") level++;
  }
  console.log("You've won!");
}
