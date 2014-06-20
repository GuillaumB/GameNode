function App(){
	var ID = null;
	var Socket = null;
	var ThisApp = this;	

	/* ----------------------- */
	/* Player Params */
	var playerID = null;
	var playerName = "";
	var playerCar = "";
	var playerLife =null

	var lastPressedKey = "";

	/**
	 * Init function - connect the socket and start the App
	 */
	App.prototype.init = function(address, port, appID) {
		/* ----------------------- */
		/* Game Params */
		ThisApp.maxPlayer = 100;
		ThisApp.idLength = 6;
		ThisApp.speed = 50;

		/* ----------------------- */
		ThisApp.ID = appID;
		console.info('App launched with ID: '+ThisApp.ID);

		//Connect Socket
		ThisApp.Socket = io.connect(address+':'+port);

		//start the Chat/log
		ThisApp.chat();

		//start shoot animation
		ThisApp.animateShoots();
		ThisApp.watchLife();

		//Set the size of the map
		ThisApp.setMap('#GameNode');
		jQuery(window).resize(function(){
			ThisApp.setMap('#GameNode');
		})

		//activate the reception of server msg to update client's view
		ThisApp.updateClient();

		/* ----------------------- */
		jQuery(window).bind('beforeunload', function(){
			ThisApp.playerQuit();
		});
	}; // /init

	App.prototype.setMap = function(container) {
		var h = jQuery(container).height();
		var w = jQuery(container).width();

		jQuery(container).find('#players').height(h).width(w);
		jQuery(container).find('#shoots').height(h).width(w);
		jQuery(container).find('#map').height(h).width(w);
	}; // /setMap

	App.prototype.setPlayer = function(name, car) {
		if(ThisApp.playerName == undefined){
			var d = new Date();
			var id = String(parseInt(d.getTime()/(Math.random()*ThisApp.maxPlayer)));

			ThisApp.playerID = id.substr(0,ThisApp.idLength);
			ThisApp.playerName = name;
			ThisApp.playerCar = car;
			ThisApp.playerLife = 100;

			//disable Pseudo Input
			jQuery('#playerName').attr('disabled', 'disabled');
			jQuery('#play').text('Change Car');

			//show message on the chat
			ThisApp.Socket.emit('clientversserveur', {serviceid: ThisApp.ID, type: "log", content: ThisApp.playerName+' vient de se connecter !'});
			
			//add the player to the game
			jQuery('#GameNode #players').append('<div id="'+ThisApp.playerID+'" class="player" data-life="100"><h6>'+ThisApp.playerName+'</h6><img src="img/vehicules/'+ThisApp.playerCar+'" alt="'+ThisApp.playerCar+'"></div>');
		
			//update the server
			ThisApp.updateServer();
		}
		else{
			//Change the vehicle
			ThisApp.playerCar = car;

			jQuery('#GameNode #players #'+ThisApp.playerID).find('img').attr('src', 'img/vehicules/'+car);
		}
		jQuery(document).focus();

		ThisApp.detectKey();
		//ThisApp.clickToFire(); //use too more resources :(
	}; // /setPlayer

	App.prototype.playerQuit = function() {
		if(ThisApp.playerName != undefined){
			//show message on the chat
			ThisApp.Socket.emit('clientversserveur', {serviceid: ThisApp.ID, type: "log", content: ThisApp.playerName+' a quitté le jeu.'});
			
			//delete the car of the player
			jQuery('#players #'+ThisApp.playerID).remove();

			//update the server
			ThisApp.updateServer();
		}
	}; // /playerquit


	App.prototype.chat = function() {
		console.info('Chat is running !')

		//Get a msg from server
		ThisApp.Socket.on('serveurversclient', function(data){
			if(data.serviceid == ThisApp.ID){
				if(data.type == 'log'){
					jQuery('#Information').find('#msg').append('<p class="log">'+data.content+'</p>');
				}
				else if(data.type == 'msg'){
					jQuery('#Information').find('#msg').append('<p class="msg">'+data.content+'</p>');
				}
			}
		});

		//unfocus the game when player use the chat
		jQuery('#Information').find('input[name="msg"]').focus(function(){
			jQuery('#Information').find('input[name="msg"]').keypress(function(evt){
				if(evt.keyCode == 13){
     			evt.preventDefault();
     			ThisApp.sendChatMsg();
  			}
			});
		});

		//Send a msg
		jQuery('#Information').find('input[type="submit"]').click(function(evt){
			ThisApp.sendChatMsg();
		});
	}; // /chat

	App.prototype.sendChatMsg = function() {
		if(ThisApp.playerName != undefined){
				var inputContent = jQuery('#Information').find('input[name="msg"]').val();
				if(inputContent != ""){
					var msg = '<span class="player">'+ThisApp.playerName+':</span><br>'+inputContent;
					ThisApp.Socket.emit('clientversserveur', {serviceid: ThisApp.ID, type: "msg", content: msg});
					jQuery('#Information').find('input[name="msg"]').val('');
				}
			}
			else{
				alert('Vous devez être dans le jeu pour pouvoir utiliser le chat.')
			}
	};

	/* ----------------------- */
	/* Update functions */
	App.prototype.updateServer = function() {
		var listPlayers = [];
		var listShoots = [];
		var players = jQuery('#GameNode #players .player');
		var shoots = jQuery('#GameNode #shoots .shoot');

		players.each(function(i){
			var $current = jQuery(players[i]);
			var tmp = {
				id: $current.attr('id'),
				name: $current.find('h6').text(),
				car: $current.find('img').attr('src'),
				posX: $current.css('left'),
				posY: $current.css('top'),
				class: $current.attr('class'),
				life: 100
			};

			listPlayers.push(tmp);
		});

		shoots.each(function(i){
			var $current = jQuery(shoots[i]);
			var tmp = {
				id: $current.attr('id'),
				playerId: $current.attr('data-playerid'),
				class: $current.attr('class'),
				posX: $current.css('left'),
				posY: $current.css('top')
			};

			listShoots.push(tmp);
		});

		ThisApp.Socket.emit('clientversserveur', {serviceid: ThisApp.ID, type: "game", players: listPlayers, shoots: listShoots});
	};

	App.prototype.updateClient = function() {
		ThisApp.Socket.on('serveurversclient', function(data){
			if(data.serviceid == ThisApp.ID && data.type == "game"){
				var players = data.players;
				var shoots = data.shoots;

				// Players update
				for (var i = 0; i < players.length; i++) {
					var player = players[i];
					if(player.id != ThisApp.playerID){
						var existPlayer = jQuery('#GameNode #players #'+player.id);
						if(existPlayer.length == 0){
							jQuery('#GameNode #players').append('<div id="'+player.id+'" class="'+player.class+'" data-life="'+player.life+'"><h6>'+player.name+'</h6><img src="'+player.car+'" alt="'+player.car.split('/')[-1]+'"></div>')
						}

						jQuery('#GameNode #players #'+player.id).removeClass().addClass(player.class);
						jQuery('#GameNode #players #'+player.id).animate({
							'top': player.posY,
							'left': player.posX
						});
					}
				};

				//Shoots update
				for (var i = 0; i < shoots.length; i++) {
					var shoot = shoots[i];
					var existShoot = jQuery("#GameNode #shoots #"+shoot.id);
					
					if(existShoot.length == 0){
						jQuery('#GameNode #shoots').append('<div id="'+shoot.id+'" class="'+shoot.class+'" style="top: '+shoot.posY+'; left: '+shoot.posX+';" data-playerid="'+shoot.playerId+'"></div>')
					}
					else{
						existShoot.css('top', shoot.posY).css('left', shoot.posX);
					}
				}
			}
		});
	};

	/* ----------------------- */
	/* Game functions */

	App.prototype.detectKey = function() {
		document.onkeypress = function(){
			var useChat = jQuery('#Information').find('input[name="msg"]').is(':focus');

			if(!useChat){
				var e = window.event;
				var keyCode = e.keyCode;

				switch(keyCode) {
					case 122:
						// Z - up
						ThisApp.moveVehicle('up');
						ThisApp.lastPressedKey = "Z";
						break;

					case 115:
						// S - down
						ThisApp.moveVehicle('down');
						ThisApp.lastPressedKey = "S";
						break;

					case 113:
						// Q - left
						ThisApp.moveVehicle('left');
						ThisApp.lastPressedKey = "Q";
						break;

					case 100:
						// D - right
						ThisApp.moveVehicle('right');
						ThisApp.lastPressedKey = "D";
						break;
					
					case 32:
						// Space - fire
						ThisApp.useFire();
						break;
				}
			}
		}
	};

	App.prototype.moveVehicle = function(direction) {
		var $player = jQuery('#GameNode #players #'+ThisApp.playerID);
		var topValue = $player.css('top');
		var leftValue = $player.css('left');

		switch(direction) {
			case "up":
				$player.removeClass('down');
				topValue = "-="+ThisApp.speed;
				break;

			case "down":
				$player.removeClass('up');
				topValue = "+="+ThisApp.speed;
				break;

			case "left":
				$player.removeClass('right');
				leftValue = "-="+ThisApp.speed;
				break;

			case "right":
				$player.removeClass('left');
				leftValue = "+="+ThisApp.speed;
				break;
		}

		$player.addClass(direction);

		$player.stop().animate({
			'top': topValue,
			'left': leftValue 
		}, 500, function(){
			var top = parseInt($player.css('top'));
			var left = parseInt($player.css('left'));

			if(top < 0){
				$player.css('top', '16px');
			}

			if(top > jQuery('#map').height()){
				$player.css('top', (jQuery('#map').height()-32)+'px');
			}

			if(left < 0){
				$player.css('left','16px');
			}

			if(left > jQuery('#map').width()){
				$player.css('left', (jQuery('#map').width()-32)+'px');
			}

			//update the server
			ThisApp.updateServer();
		});		
	}; // /moveVehicle

	App.prototype.clickToFire = function() {
		jQuery('#GameNode #players').click(function(evt){
			evt.preventDefault();
			ThisApp.useFire(); 
		})
	};

	App.prototype.useFire = function() {
		var direction = "";
		var vehiculePosX = parseInt(jQuery('#GameNode #players #'+ThisApp.playerID).css('left'));
		var vehiculePosY = parseInt(jQuery('#GameNode #players #'+ThisApp.playerID).css('top'));

		var d = new Date();
		var id = String(parseInt(d.getTime()/(Math.random()*100000)));

		if(ThisApp.lastPressedKey == undefined){
			ThisApp.lastPressedKey = "S";
		}

		switch(ThisApp.lastPressedKey) {
			case "Z":
				direction = "top";
				break;

			case "S":
				direction = "bottom";
				break;

			case "Q":
				direction = "left";
				break;

			case "D":
				direction = "right";
				break;
		}
		
		//add the fire element
		jQuery('#GameNode #shoots').append('<div id="'+id.substr(0,8)+'" class="shoot '+direction+'" style="top: '+(vehiculePosY+16)+'px; left: '+(vehiculePosX+16)+'px;" data-playerid="'+ThisApp.playerID+'"></div>');
	
		//update the server
		ThisApp.updateServer();
	};

	App.prototype.animateShoots = function(){
		var speed = 100;
		var shoots = jQuery('#GameNode #shoots .shoot');

		shoots.each(function(i){
			var $currentShoot = jQuery(shoots[i]);
			var direction = $currentShoot.attr('class').split(' ')[1];

			var currentPosX = parseInt($currentShoot.css('left'));
			var currentPosY = parseInt($currentShoot.css('top'));

			if(currentPosX < 0 || currentPosX > jQuery('#GameNode #shoots').width()){
				$currentShoot.remove();
			}

			if(currentPosY < 0 || currentPosY > jQuery('#GameNode #shoots').height()){
				$currentShoot.remove();
			}

			switch(direction) {
				case 'top':
					$currentShoot.animate({'top': '-='+speed});
					break

				case 'bottom':
					$currentShoot.animate({'top': '+='+speed});
					break

				case 'left':
					$currentShoot.animate({'left': '-='+speed});
					break

				case 'right':
					$currentShoot.animate({'left': '+='+speed});
					break
			}
		});

		setTimeout(ThisApp.animateShoots, 100);
	}

	App.prototype.watchLife = function() {
		var currentPlayerPosX = parseInt(jQuery('#GameNode #players #'+ThisApp.playerID).css('left'));
		var currentPlayerPosY = parseInt(jQuery('#GameNode #players #'+ThisApp.playerID).css('top'));
		var playerLife = jQuery('#GameNode #players #'+ThisApp.playerID).attr('data-life')

		var shoots = jQuery('#GameNode #shoots .shoot');
		for(var i = 0; i < shoots.length; i++){
			var $currentShoot = jQuery(shoots[i]);
			var currentShootPosX = parseInt($currentShoot.css('left'));
			var currentShootPosY = parseInt($currentShoot.css('top'));

			/*if(currentShootPosX >= currentPlayerPosX && currentShootPosX <= (currentPlayerPosX+32)){
				if(currentShootPosY >= currentPlayerPosY && currentShootPosY <= (currentPlayerPosY+32)){
					//$currentShoot.remove()
					jQuery('#GameNode #players #'+ThisApp.playerID).attr('data-life', playerLife-10);
				}
			}*/
		};

		setTimeout(ThisApp.watchLife, 100);
	};

} // /App

(function($){$(document).ready(function(){
	var address = 'http://195.83.128.55';
	var port = '1337';

	MyApp = new App();
	MyApp.init(address, port, 1992);

	$('#play').click(function(evt){
		evt.preventDefault();

		if($('#playerName').val() != ""){
			MyApp.setPlayer($('#playerName').val(),$('#carChoice').val());
		}
		else{
			alert('Vous devez entrer un Pseudo !');
		}
	})

})})(jQuery);