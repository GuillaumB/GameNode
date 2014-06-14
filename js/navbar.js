(function($){$(document).ready(function(){

	$('#carChoice').change(function(){
		console.info('youhou')
		var imgPath = 'img/vehicules/';
		var value = $(this).val();

		$('#car').attr('src', imgPath+'vehicule'+value+'.png');
	});
	
})})(jQuery);