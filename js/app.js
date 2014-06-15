function App(){
	var ID = null;
	var Socket = null;
	var ThisApp = this;

	/* ----------------------- */
	/* Player Params */

	var playerName = "";
	var playerCar = "";

	/**
	 * Init function - connect the socket and start the App
	 */
	App.prototype.init = function(address, port, appID) {
		ThisApp.ID = appID;
		console.info('App launched with ID: '+ThisApp.ID);

		//Connect Socket
		ThisApp.Socket = io.connect(address+':'+port);

		//start the Chat/log
		ThisApp.chat('#Information');
	};

	App.prototype.setPlayer = function(name, car) {
		ThisApp.playerName = name;
		ThisApp.playerCar = car;

		ThisApp.Socket.emit('clientversserveur', {serviceid: ThisApp.ID, type: "log", content: ThisApp.playerName+' vient de se connecter !'});
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

		MyApp.setPlayer($('#playerName').val(),$('#carChoice').val());
	})

})})(jQuery);