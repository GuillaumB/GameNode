function App(){
	var ID = null;
	var Socket = null;
	var ThisApp = this;	

	/* ----------------------- */
	/* Player Params */
	var playerID = null;
	var playerName = "";
	var playerCar = "";

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

		/* ----------------------- */
		jQuery(window).bind('beforeunload', function(){
			ThisApp.playerQuit();
		});
	};

	App.prototype.setMap = function(container) {
		var h = jQuery(container).height();
		var w = jQuery(container).width();

		jQuery(container).find('#players').height(h).width(w);
		jQuery(container).find('#map').height(h).width(w);
	};

	App.prototype.setPlayer = function(name, car) {
		if(ThisApp.playerName == undefined){
			var d = new Date();
			var id = String(parseInt(d.getTime()/(Math.random()*ThisApp.maxPlayer)));

			ThisApp.playerID = id.substr(0,ThisApp.idLength);
			ThisApp.playerName = name;
			ThisApp.playerCar = car;
			console.log(ThisApp.playerID);

			//disable Pseudo Input
			jQuery('#playerName').attr('disabled', 'disabled');
			jQuery('#play').text('Change Car');

			//show message on the chat
			ThisApp.Socket.emit('clientversserveur', {serviceid: ThisApp.ID, type: "log", content: ThisApp.playerName+' vient de se connecter !'});
			
			//add the player to the game
			jQuery('#GameNode #players').append('<div id="'+ThisApp.playerID+'" class="player"><h6>'+ThisApp.playerName+'</h6><img src="img/vehicules/'+ThisApp.playerCar+'" alt="'+ThisApp.playerCar+'"></div>');
		}
		else{
			//Change the vehicle
			ThisApp.playerCar = car;

			jQuery('#GameNode #players #'+ThisApp.playerID).find('img').attr('src', 'img/vehicules/'+car);
		}
		jQuery('#GameNode').focus();
	};

	App.prototype.playerQuit = function() {
		if(ThisApp.playerName != undefined){
			//show message on the chat
			ThisApp.Socket.emit('clientversserveur', {serviceid: ThisApp.ID, type: "log", content: ThisApp.playerName+' a quitté le jeu.'});
			
			//delete the car of the player
			jQuery('#playders #'+ThisApp.playerID).empty();
		}
	};


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
	};


}

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