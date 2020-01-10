

function flipHorizontally(context, around) {
  context.translate(around, 0);
  context.scale(-1, 1);
  context.translate(-around, 0);
}



var CanvasDisplay = class CanvasDisplay {
  constructor(parent, level) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = Math.min(900, level.width * scale);
    this.canvas.height = Math.min(670, level.height * scale);
    parent.appendChild(this.canvas);
    this.cx = this.canvas.getContext("2d");

    this.flipPlayer = false;
	this.flipEnemy = false;

    this.viewport = {
      left: 0,
      top: 0,
      width: this.canvas.width / scale,
      height: this.canvas.height / scale
    };
  }

  clear() {
    this.canvas.remove();
  }
}

CanvasDisplay.prototype.syncState = function(state) {
  this.updateViewport(state);
  this.clearDisplay(state.status);
  this.drawBackground(state.level);
  this.drawActors(state.actors);
};

CanvasDisplay.prototype.updateViewport = function(state) {
  let view = this.viewport, margin = view.width / 3;
  let player = state.player;
  let center = player.pos.plus(player.size.times(0.5));

  if (center.x < view.left + margin) {
    view.left = Math.max(center.x - margin, 0);
  } else if (center.x > view.left + view.width - margin) {
    view.left = Math.min(center.x + margin - view.width,
                         state.level.width - view.width);
  }
  if (center.y < view.top + margin) {
    view.top = Math.max(center.y - margin, 0);
  } else if (center.y > view.top + view.height - margin) {
    view.top = Math.min(center.y + margin - view.height,
                        state.level.height - view.height);
  }
};

CanvasDisplay.prototype.clearDisplay = function(status) {
  if (status == "won") {
    this.cx.fillStyle = "rgb(68, 191, 255)";
  } else if (status == "lost") {
    this.cx.fillStyle = "rgb(44, 136, 214)";
  } else {
    this.cx.fillStyle = "rgb(22, 55, 32);";
  }
  this.cx.fillRect(0, 0,
                   this.canvas.width, this.canvas.height);
};

var walls = document.createElement("img");
walls.src = "sprites/tiles/wall/wall_2.png";

var floor = document.createElement("img");
floor.src = "sprites/tiles/floor/floor_1.png";

CanvasDisplay.prototype.drawBackground = function(level) {
  let {left, top, width, height} = this.viewport;
  let xStart = Math.floor(left);
  let xEnd = Math.ceil(left + width);
  let yStart = Math.floor(top);
  let yEnd = Math.ceil(top + height);

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
		//console.log(level.rows[y][x]);
		let tile = level.rows[y][x];
		let screenX = (x - left) * scale;
		let screenY = (y - top) * scale;
		switch(tile){
			case "floor":
				this.cx.drawImage(floor,
                        0,         0, 16, 16,
                        screenX, screenY, scale, scale);
			break;
			case "wall":
				this.cx.drawImage(walls,
                        0,         0, 16, 16,
                        screenX, screenY, scale, scale);
			break;
			default:
				this.cx.drawImage(floor,
                        0,         0, 16, 16,
                        screenX, screenY, scale, scale);
			break;
		}
    }
  }
};

var playerIdleSprites = document.createElement("img");
playerIdleSprites.src = "sprites/heroes/knight/knight_idle_spritesheet.png";

var playerIdleBlinkSprites = document.createElement("img");
playerIdleBlinkSprites.src = "sprites/heroes/knight/knight_idle_blink_spritesheet.png";

var playerRunSprites = document.createElement("img");
playerRunSprites.src = "sprites/heroes/knight/knight_run_spritesheet.png";

var playerRunBlinkSprites = document.createElement("img");
playerRunBlinkSprites.src = "sprites/heroes/knight/knight_run_blink_spritesheet.png";

var playerIdleSwordSprites = document.createElement("img");
playerIdleSwordSprites.src = "sprites/heroes/knight/knight_idle_with_sword_spritesheet.png";

var playerIdleSwordBlinkSprites = document.createElement("img");
playerIdleSwordBlinkSprites.src = "sprites/heroes/knight/knight_idle_blink_with_sword_spritesheet.png";

var playerRunSwordSprites = document.createElement("img");
playerRunSwordSprites.src = "sprites/heroes/knight/knight_run_with_sword_spritesheet.png";

var playerRunSwordBlinkSprites = document.createElement("img");
playerRunSwordBlinkSprites.src = "sprites/heroes/knight/knight_run_blink_with_sword_spritesheet.png";

var playerAttackSprites = document.createElement("img");
playerAttackSprites.src = "sprites/heroes/knight/knight_attack.png";


CanvasDisplay.prototype.drawPlayer = function(player, x, y, width, height){
  this.cx.save();
  if (player.orientation) {
    flipHorizontally(this.cx, x + width / 2);
  }
  tile = Math.floor(Date.now() / 60) % 6;
  let tileX = (player.sword ? tile * 24 : tile * 16 );
  if (player.speed.x == 0 && player.speed.y == 0) {
	if (!player.strucked) {
		if (!player.sword) {
			this.cx.drawImage(playerIdleSprites, tileX, 0, 16, 16,
										x,     y, width, height);
		} else {
			if (!player.attacking) {
				this.cx.drawImage(playerIdleSwordSprites, tileX, 0, 24, 16,
													x,     y, width, height);
			} else {
				this.cx.drawImage(playerAttackSprites, tileX, 0, 24, 18,
													x,     y, width, height);
			}
		}
	} else {
		if (!player.sword) {
			this.cx.drawImage(playerIdleBlinkSprites, tileX, 0, 16, 16,
												x,     y, width, height);
		} else {
			this.cx.drawImage(playerIdleSwordBlinkSprites, tileX, 0, 24, 16,
										x,     y, width, height);
		}
	}
  } else {
		if (!player.strucked) {
			if (!player.sword) {
				this.cx.drawImage(playerRunSprites, tileX, 0, 16, 16,
											x,     y, width, height);
			} else {
				this.cx.drawImage(playerRunSwordSprites, tileX, 0, 24, 16,
											x,     y, width, height);
			}
		} else {
			if (!player.sword) {
				this.cx.drawImage(playerRunBlinkSprites, tileX, 0, 16, 16,
													x,     y, width, height);
			} else {
				this.cx.drawImage(playerRunSwordBlinkSprites, tileX, 0, 24, 16,
											x,     y, width, height);
			}
		}
  }
  this.cx.restore();
};

var goblinIdleSprites = document.createElement("img");
goblinIdleSprites.src = "sprites/enemies/goblin/goblin_idle_spritesheet.png";

var goblinRunSprites = document.createElement("img");
goblinRunSprites.src = "sprites/enemies/goblin/goblin_run_spritesheet.png";

CanvasDisplay.prototype.drawEnemies = function(enemy, x, y, width, height){
  this.cx.save();
  if (this.oreintation) {
    flipHorizontally(this.cx, x + width / 2);
  }
  
  tile = Math.floor(Date.now() / 60) % 6;
  let tileX = tile * 16;
  if (enemy.speed.x == 0 && enemy.speed.y == 0) {
	this.cx.drawImage(goblinIdleSprites, tileX, 0, 16, 16,
										x,     y, width, height);
  } else {
	 this.cx.drawImage(goblinRunSprites, tileX, 0, 16, 16,
										x,     y, width, height);
  }
  this.cx.restore();
};

var swordSprite = document.createElement("img");
swordSprite.src = "sprites/heroes/knight/weapon_sword_1.png";

var doorSprites = document.createElement("img");
doorSprites.src = "sprites/tiles/wall/door_spritesheet.png";

var silverKeySprite = document.createElement("img");
silverKeySprite.src = "sprites/props_itens/key_silver1.png";

var goldKeySprite = document.createElement("img");
goldKeySprite.src = "sprites/props_itens/key_gold.png";

CanvasDisplay.prototype.drawDoor = function(door, x, y, width, height) {
	if (door.blocked) {
		this.cx.drawImage(doorSprites, 0, 0, 32, 32,
								   x, y, width, height);
	} else {
		if ((Date.now() - door.openedTime) /60 < 14) {
			let tileX = 32 * (Math.floor((Date.now() - door.openedTime) / 60) % 14);
			this.cx.drawImage(doorSprites, tileX, 0, 32, 32,
											x,     y, width, height);
		} else {
			this.cx.drawImage(doorSprites, 416, 0, 32, 32,
											x,     y, width, height);
		}
	}	
}

var spikeSprites = document.createElement("img");
spikeSprites.src = "sprites/tiles/floor/spikes_spritesheet.png"
var lastSpikeChange = Date.now();

CanvasDisplay.prototype.drawSpikes = function(spikes, x, y, width, height) {
	let tileX = spikes.animFrame * 16;
	this.cx.drawImage(spikeSprites, tileX, 0, 16, 16,
											x,     y, width, height);
}

var coinSprites = document.createElement("img");
coinSprites.src = "sprites/props_itens/bag_coins.png";
	

CanvasDisplay.prototype.drawActors = function(actors) {
  var index;
  for(index = 0; index < actors.length; index += 1) {
        if(actors[index].type === "player") {
            break;
        }
  }
  actors.push(actors.splice(index, 1)[0]);
  
  for (let actor of actors) {
    let width = actor.size.x * scale;
    let height = actor.size.y * scale;
    let x = (actor.pos.x - this.viewport.left) * scale;
    let y = (actor.pos.y - this.viewport.top) * scale;
	switch (actor.type) {
		case "player":
			this.drawPlayer(actor, x, y, width, height);
		break;
		case "goblin":
			this.drawEnemies(actor, x, y, width, height);
		break;
		case "sword":
			this.cx.drawImage(swordSprite, 0, 0, 16, 16,
								   x, y, width, height);
		break;
		case "door":
			this.drawDoor(actor, x, y, width, height);
		break;
		case "key":
			if (actor.opens == "door")
				this.cx.drawImage(silverKeySprite, 0, 0, 16, 16,
								   x, y, width, height);
			else 
				this.cx.drawImage(goldKeySprite, 0, 0, 16, 16,
								   x, y, width, height);
		break;
		case "spikes":
			this.drawSpikes(actor, x, y, width, height);
		break;
		case "coin":
			this.cx.drawImage(coinSprites, 0, 0, 16, 16,
								   x, y, width, height);
		break;

	}
  }
};