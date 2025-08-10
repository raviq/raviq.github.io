////////////////////////////////////////////////////////////////
// Title: JS routines
// Version: 0.9
// Last change: Nov 2018
// Author: Rafik Hadfi (rafik.hadfi@gmail.com)
// Repository: https://github.com/raviq
////////////////////////////////////////////////////////////////
 
// Loading menu and pages
$(document).ready(function ()
{	
	// Loading side menu
    $('.sidemenu ul li:first').addClass('active');
    $('.tab-content:not(:first)').hide();
    $('.sidemenu ul li a').click(function (event) 
    {
        event.preventDefault();
        var content = $(this).attr('href');
        $(this).parent().addClass('active');
        $(this).parent().siblings().removeClass('active');
        $(content).show();
        $(content).siblings('.tab-content').hide();
    });

    // Loading pages and inclusion in index page
	var pages = [	"welcome",
					"publications", 
					"awards", 
					"education", 
					"experience", 
					"social", 
					"teaching",
					"activities",
		     			"projects"
				];
			
	for (var i in pages) 
		$('#section-' + pages[i]).load("include/" + pages[i] + ".html");

});

// Email obfuscation through random encryption.
// source: http://www.jottings.com/obfuscator/
function obfuscate()
{
	// TODO Change with your email-key:
	coded = "EV2ba.PVl2b@jvVbz.oNv";
	key   = "5xW4wamD1g6FCycfOdYhiJGALXVv09juQrto2IlRPbeps7kq3Z8nHUESNMKzTB";
	for (link = "", i = 0 ; i < coded.length ; i++) 
	 	link += key.indexOf(coded.charAt(i)) == -1 ? 
	 			  coded.charAt(i) :
	 			     key.charAt((key.indexOf(coded.charAt(i)) - coded.length + key.length) % key.length);
	return link;
}

// Toggle between hiding and showing kth Details.
function seeDetails(k) 
{
    var x = document.getElementById("Details" + k);
    x.style.display = (x.style.display === "none") ? "block" : "none";
   
	var e = document.getElementById("button" + k);

	//var space = String.fromCharCode('0xa0');

	var upArrow = String.fromCharCode('0x25b6');
	var downArrow = String.fromCharCode('0x25bc');

	if ( e.innerHTML == upArrow )
	{
	  e.innerHTML = downArrow;
	}
	else if ( e.innerHTML == downArrow )
	{
	  e.innerHTML = upArrow;
	}

}








