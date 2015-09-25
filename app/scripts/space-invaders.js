var SI = (function() {
	function Ship(ctx, pos) {
		var self = this,
		// canvas dom
		canvasD = $("canvas")[0];

		self.x = pos.x;
		self.y = pos.y;
		self.gunPoint = { x: self.x + Ship.GUNPOINT_OFFSET, y: self.y };
		self.firedBullets = [];

		self.fire = function() {
			var bullet = new Bullet(ctx, self.gunPoint, "ship");

			if (self.firedBullets.length < 7) {
				self.firedBullets.push(bullet);
			}
		};

		self.draw = function() {
			self.drawBackground();
			self.drawShip();
			self.drawGun();
		};

		self.drawShip = function() {
			ctx.beginPath();
			ctx.fillStyle = "#800080";

			ctx.rect(self.x, self.y, Ship.WIDTH, Ship.HEIGHT);
			ctx.fill();
		};

		self.drawGun = function() {
			ctx.beginPath();
			ctx.fillStyle = "#e6c200";

			ctx.rect(self.gunPoint.x - 4, self.gunPoint.y - 5, 10, 5);
			ctx.fill();
		};

		self.drawBackground = function() {
			ctx.beginPath();
//			ctx.fillStyle = "#c0ed9e";
			ctx.fillStyle = "#000000";

			ctx.rect(0, Game.DIM.height - 30, Game.DIM.width, 30);
			ctx.fill();
		};

		self.update = function(val) {
			if (!self.blocked(val)) {
				self.x += val;
				self.gunPoint.x += val;
			}
		};

		self.blocked = function(val) {
			var temp = self.x + val;

			if (((temp + 40) >= Game.DIM.width) || (temp <= 0)) {
				return true;
			}

			return false;
		};

		self.keyBindings = function() {
			key("left", function() {
				self.update(-30);
			});

			key("right", function() {
				self.update(30);
			});

			key("space", function() {
				self.fire();
			});
		};

		self.getMousePosition = function(canvas, evt) {
			var rect = canvas.getBoundingClientRect();
			return {
				x: evt.clientX - rect.left,
				y: evt.clientY - rect.top
			};
		}
		// bound mouse clicks to the fire function
		canvasD.addEventListener("click", self.fire.bind(this), false);

		// Track the ship to the mouse
		canvasD.addEventListener('mousemove', function(evt) {
			var mousePos = self.getMousePosition(canvasD, evt);
			var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;
			self.update(mousePos.x - self.x);
		}.bind(this), false);

		// prevent double clicks
		canvasD.addEventListener('dblclick', function(e) {
			e.preventDefault();
		});
	}

	Ship.WIDTH = 40;
	Ship.HEIGHT = 20;
	Ship.GUNPOINT_OFFSET = 20;

	function Bullet(ctx, pos, vehicle) {
		var self = this;

		self.x = pos.x;
		self.y = pos.y;

		self.speed = 2;
		self.vehicles = {
			"ship": -4,
			"alien": 2
		};
		self.velocity = self.vehicles[vehicle];

		self.draw = function() {
			ctx.beginPath();
			ctx.fillStyle = "#ff0000";

			ctx.rect(self.x, self.y, 5, 10);
			ctx.fill();
		};

		self.update = function() {
			self.y += (self.velocity * self.speed);
		};
	}

	function Alien(ctx, pos, person) {
		var self = this;
		self.x = pos.x;
		self.y = pos.y;
		self.speed = 1;
		self.firedBullets = [];
		self.hitCount = 0;
		self.baseImage = new Image();
		self.leftImage = new Image();
		self.leftImage['data-toggle'] = "tooltip";
		self.leftImage['title'] = person.name;
		self.rightImage = new Image();
		self.funImage = new Image();
		self.centerImage = new Image();
		self.rightImageSrc = person.images.right;
		self.leftImageSrc = person.images.left;
		self.funImageSrc = person.images.fun;
		self.centerImageSrc = person.images.center;
		self.oldDirection = undefined;
		self.hit = false;

		self.leftImage.src = self.leftImageSrc;
		self.rightImage.src = self.rightImageSrc;
		self.funImage.src = self.funImageSrc;
		self.centerImage.src = self.centerImageSrc;

		self.draw = function() {
			if (self.hit) {
				self.baseImage = self.funImage;
			} else {
				if (self.oldDirection !== self.direction) {
					self.oldDirection = self.direction;
					if (self.direction > 0) {
						self.baseImage = self.rightImage;
					} else {
						self.baseImage = self.leftImage;
					}
				}
			}
			ctx.drawImage(self.baseImage, self.x, self.y, Alien.WIDTH, Alien.HEIGHT);
		};

		self.update = function(direction) {
			self.direction = direction;
			self.x += direction * self.speed;
		};

		self.isHit = function(bullets) {
			for (var i = 0; i < bullets.length; i++) {
				if (bullets[i].y <= (self.y + Alien.HEIGHT) && (bullets[i]) && (bullets[i].x ) >= self.x && bullets[i].x <= (self.x + Alien.WIDTH)) {
					if (!self.hit) {
						bullets.splice(i, 1);
					}
					self.hit = true;
					return true;
				}
				return false;
			}
		};
	}

	Alien.WIDTH = 100;
	Alien.HEIGHT = 100;
	Alien.HITSTOREMOVE = 25;

	Alien.buildAlienRow = function(ctx, firstPos, people) {
		var alienRow = [],
		firstPosx = firstPos.x,
		firstPosy = 0,
		skip = true,
		xPos;

		for (var i = 1, personCount = 0, xCount = 1; i <= people.length; i++) {
			if (i === 1 || i % 9 === 1) {
				firstPosy = firstPos.y + firstPosy;
				if (!skip) {
					firstPosy = firstPosy + Alien.HEIGHT;
				}
				skip = false;
			}

			if ((xCount !== 1) && (xCount % 10 === 0)) {
				xCount = 1;
			}
			xPos = (firstPosx * xCount);
			xCount++;

			var pos = {
				x: (xPos),
				y: (firstPosy)
			}, person;

			person = people[personCount];
			personCount++;
			var a = new Alien(ctx, pos, person);
			alienRow.push(a);
		}

		return alienRow;
	};

	Alien.wallHit = function(aliens) {
		var firstAlien, lastAlien, minX, maxX;

		$.each(aliens, function(index, alien) {
			if ((minX === undefined) || (minX > alien.x)) {
				firstAlien = alien;
				minX = alien.x;
			} else if ((maxX === undefined) || (maxX < alien.x)) {
				lastAlien = alien;
				maxX = alien.x;
			}
		}.bind(this));

		if ((lastAlien !== null) && (lastAlien !== undefined) && (lastAlien.x + Alien.WIDTH) >= Game.DIM.width) {
			return true;
		} else if (firstAlien !== null && (firstAlien !== undefined) && firstAlien.x <= 0) {
			return true;
		}

		return false;
	};

	function Game(ctx, people) {
		var self = this;

		self.ship = new Ship(ctx, Ship.STARTING_POS);
		self.shipBullets = self.ship.firedBullets;
		self.aliens = Alien.buildAlienRow(ctx, { x: 110, y: 40 }, people);
		self.alienDirection = 2;

		self.start = function() {
			self.ship.keyBindings();
			self.intervalId = setInterval(self.gameLoop, 1000 / 24);
		};

		self.gameLoop = function() {
			ctx.clearRect(0, 0, 1200, 800);
			self.update();
			self.draw();

			if (self.aliens.length === 0) {
				// When out of aliens clear the interval and show a message.
				clearInterval(self.intervalId);
				ctx.clearRect(0, 0, 1200, 800);
				ctx.font = '88px Calibri';
				ctx.fillStyle = 'white';
				ctx.fillText('You Won!', 425, 400);
				// after 5 seconds hide the game and enable the button.
				setTimeout(function() {
					//TODO: reset the game
					$('.people').removeClass('hide');
					$("canvas").removeClass('game-time');
				}.bind(this), 3000);
			}
		};

		self.draw = function() {
			self.ship.draw();
			// draw aliens
			for (var i = 0; i < self.aliens.length; i++) {
				var a = self.aliens[i];
				a.draw();
			}
			// draw bullets
			for (var j = 0; j < self.shipBullets.length; j++) {
				var b = self.shipBullets[j];
				b.draw();
			}
		};

		self.update = function() {
			self.updateBullets();
			self.updateAliens();
		};

		// canvas update helpers
		self.updateBullets = function() {
			for (var i = 0; i < self.shipBullets.length; i++) {
				var b = self.shipBullets[i];
				b.update();

				if (b.y < 0) {
					self.shipBullets.splice(i, 1);
				}
			}
		};

		self.updateAliens = function() {
			if (Alien.wallHit(self.aliens)) {
				self.alienDirection *= -1;

				for (var i = 0; i < self.aliens.length; i++) {
					var a = self.aliens[i];
					a.y += 20;
				}
			}

			for (var j = 0; j < self.aliens.length; j++) {
				var a = self.aliens[j];
				a.update(self.alienDirection);
				if (a.isHit(self.shipBullets) || a.hit) {
					a.hitCount++;
					if (a.hitCount >= Alien.HITSTOREMOVE) {
						self.aliens.splice(j, 1);
					}
				}
			}
		};
	}

	Game.DIM = { width: 1200, height: 800 };
	Ship.STARTING_POS = { x: (Game.DIM.width / 2 - 20), y: Game.DIM.height - 50 };

	return {
		Ship: Ship,
		Bullet: Bullet,
		Alien: Alien,
		Game: Game
	};

})();

States = {
	caffeinated: false,
	invading: false,
	drunk: false,

	shuffleArray: function(array) {
		var currentIndex = array.length,
		temporaryValue,
		randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {

			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	}
};


(function() {
	$.ajax({
		url: "config.json",
		success: function(result) {

			$("[name=spaceInvader]").click(function() {

				var canvas = $("canvas")[0];
				if (States.invading) {
					$('.people').removeClass('hide');
					$("canvas").removeClass('game-time');
					clearInterval(States.game);
					States.invading = false;
				} else {
					canvas.width = 1200;
					canvas.height = 800;

					var ctx = canvas.getContext("2d");
					States.game = new SI.Game(ctx, States.shuffleArray(result.people));
					$('.people').addClass('hide');
					$("canvas").addClass('game-time');
					States.game.start();
					States.invading = true;
				}
			}.bind(this));

			$("[name=shakeBtn]").click(function() {
				if (States.caffeinated) {
					$.each($(".pRow a img"), function(index, pic) {
						$(pic).removeClass("shake");
						States.caffeinated = false;
					});
				} else {
					$.each($(".pRow a img"), function(index, pic) {
						setTimeout(function() {
							$(pic).addClass("shake")
						}.bind(this), Math.floor(Math.random() * 201));
						States.caffeinated = true;
					});
				}
			}.bind(this));

			$("[name=beerBtn]").click(function() {
				if (States.drunk) {
					$.each($(".pRow a img"), function(index, pic) {
						var picSrc = pic.src;
						picSrc = picSrc.replace("fun", "center");
						pic.src = picSrc;
						States.drunk = false;
					});
				} else {
					$.each($(".pRow a img"), function(index, pic) {
						var picSrc = pic.src,
						newSrc = picSrc.replace("center", "fun");
						pic.src = newSrc;
						States.drunk = true;
					});
				}
			}.bind(this));

			var row;
			var body = $('body');
			var rowCount = 0;
			$.each(States.shuffleArray(result.people), function(index, person) {
				if (index % 10 === 0) {
					$('.people').append('<div class="pRow" id="pRow' + rowCount + '"></div>');
					row = $('#pRow' + rowCount);
					rowCount++;
				}
				row.append('<a href="#" id="' + person.name + '" data-toggle="tooltip" title="' + person.name + '"><img class="pic" src="' + person.images.center + '"></a>').tooltip();

				var modalName = person.name.replace(/\s+/g, '') + 'Modal';
				var modalDom = Array(
				'<div name="' + modalName + '" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="' + person.name + '" aria-hidden="true">',
				'<div class="modal-header">',
				'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>',
				'<h3 id="' + person.name + 'ModalLabel">' + person.name + '<small> '+ person.twitter + '</small></h3>',
				'</div>',
				'<div class="modal-body">',
				'<div class="modal-img-holder">',
				'<img class="img-rounded" src="' + person.images.left + '" alt="">',
				'<img class="img-rounded" src="' + person.images.center + '" alt="">',
				'<img class="img-rounded" src="' + person.images.fun + '" alt="">',
				'<img class="img-rounded" src="' + person.images.right + '" alt="">',
				'</div>',
				'</a>',
				'</li>',
				'</ul>',
				person.info,
				'</div>',
				'</div>'
				).join(' ');
				console.log(modalDom);
				body.append(modalDom);
			}.bind(this));

			$.each($("[data-toggle='tooltip']"), function(index, picDom) {
				var pd = $(picDom);
				pd.tooltip();
				pd.on('click', function(e) {
					var modalId = pd[0].id.replace(/\s+/g, '') + 'Modal';
					$("[name=" + modalId + "]").modal('show');
				}.bind(this));

			});
		}
	});

})();
