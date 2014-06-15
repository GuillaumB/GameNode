(function($){$(document).ready(function(){

	$('#carChoice').change(function(){
		var imgPath = 'img/vehicules/';
		var value = $(this).val();

		$('#car').attr('src', imgPath+value);
	});
	
})})(jQuery);