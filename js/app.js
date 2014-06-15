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

	/**
	 * Init function - connect the socket and start the App
	 */
	App.prototype.init = function(address, port, appID) {
		/* ----------------------- */
		/* Game Params */
		ThisApp.maxPlayer = 100;
		ThisApp.idLength = 6;

		/* ----------------------- */
		ThisApp.ID = appID;
		console.info('App launched with ID: '+ThisApp.ID);

		//Connect Socket
		ThisApp.Socket = io.connect(address+':'+port);

		//start the Chat/log
		ThisApp.chat('#Information');

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
			jQuery('#GameNode #players').append('<div id="'+ThisApp.playerID+'" class="player" data-x="35" data-y="35"><h6>'+ThisApp.playerName+'</h6><img src="img/vehicules/'+ThisApp.playerCar+'" alt="'+ThisApp.playerCar+'"></div>');
		
			//update the server
			ThisApp.updateServer();
		}
		else{
			//Change the vehicle
			ThisApp.playerCar = car;

			jQuery('#GameNode #players #'+ThisApp.playerID).find('img').attr('src', 'img/vehicules/'+car);
		}
		jQuery('#GameNode').focus();
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


	App.prototype.chat = function(container) {
		console.info('Chat is running !')

		//Get a msg from server
		ThisApp.Socket.on('serveurversclient', function(data){
			if(data.serviceid == ThisApp.ID){
				if(data.type == 'log'){
					jQuery(container).find('#msg').append('<p class="log">'+data.content+'</p>');
				}
				else if(data.type == 'msg'){
					jQuery(container).find('#msg').append('<p class="msg">'+data.content+'</p>');
				}
			}
		});

		//Send a msg
		jQuery(container).find('input[type="submit"]').click(function(evt){
			if(ThisApp.playerName != undefined){
				var inputContent = jQuery(container).find('input[name="msg"]').val();
				if(inputContent != ""){
					var msg = '<span class="player">'+ThisApp.playerName+':</span><br>'+inputContent;
					ThisApp.Socket.emit('clientversserveur', {serviceid: ThisApp.ID, type: "msg", content: msg});
					jQuery(container).find('input[name="msg"]').val('');
				}
			}
			else{
				alert('Vous devez être dans le jeu pour pouvoir utiliser le chat.')
			}
		});
	}; // /chat

	/* ----------------------- */
	/* Update functions */
	App.prototype.updateServer = function() {
		var listPlayers = [];
		var players = jQuery('#GameNode #players .player');

		players.each(function(i){
			var $current = jQuery(players[i]);
			var tmp = {
				id: $current.attr('id'),
				name: $current.find('h6').text(),
				car: $current.find('img').attr('src'),
				posX: $current.attr('data-x'),
				posY: $current.attr('data-y'),
				class: $current.attr('class'),
				life: 100
			};

			listPlayers.push(tmp);
		});

		ThisApp.Socket.emit('clientversserveur', {serviceid: ThisApp.ID, type: "game", players: listPlayers});
	};

	App.prototype.updateClient = function() {
		ThisApp.Socket.on('serveurversclient', function(data){
			if(data.serviceid == ThisApp.ID && data.type == "game"){
				var players = data.players;

				for (var i = 0; i < players.length; i++) {
					var player = players[i];
					
					var existPlayer = jQuery('#GameNode #players #'+player.id);
					if(existPlayer.length != 0){
						//player already exist
						jQuery('#GameNode #players #'+player.id).remove();
					}


					jQuery('#GameNode #players').append('<div id="'+player.id+'" class="player" data-x="'+player.posX+'" data-y="'+player.posY+'"><h6>'+player.name+'</h6><img src="'+player.car+'" alt="'+player.car.split('/')[-1]+'"></div>')

				};
			}
		});
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