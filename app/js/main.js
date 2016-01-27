//jQuery is required to run this code
$( document ).ready(function() {

    scaleVideoContainer();

    initBannerVideoSize('.video-container .poster img');
    initBannerVideoSize('.video-container .filter');
    initBannerVideoSize('.video-container video');

    $(window).on('resize', function() {
        scaleVideoContainer();
        scaleBannerVideoSize('.video-container .poster img');
        scaleBannerVideoSize('.video-container .filter');
        scaleBannerVideoSize('.video-container video');
    });


    $("#smile").css("transform", "scale(1, 0)");
    $("#u-letter").css("transform", "scale(1, -1)");
    $("#eye-right").show();
    setTimeout(function() {
        $("#eye-left").transition({ x: -10}).transition({ x: 0});
        $("#eye-right").transition({ x: -10}).transition({ x: 0});

    },1000);
    setTimeout(function() {
        $("#eye-left").transition({ x: 5, y:5}).transition({ x: 0, y:0, delay:1000});
        $("#eye-right").transition({ x: 5, y:5}).transition({ x: 0, y:0, delay:1000});
        $("#smile").transition({
            scale: [1, 1], delay:2500
        });
    },1500);
     setTimeout(function() {
        $("#eye-right").hide();
        $("#u-letter").transition({
            scale: [1, 1], duration: 100
        });
    },5000);
});

function scaleVideoContainer() {

    var height = $(window).height() + 5;
    var unitHeight = parseInt(height) + 'px';
    $('.header').css('height',unitHeight);

}

function initBannerVideoSize(element){

    $(element).each(function(){
        $(this).data('height', $(this).height());
        $(this).data('width', $(this).width());
    });

    scaleBannerVideoSize(element);

}

function scaleBannerVideoSize(element){

    var windowWidth = $(window).width(),
    windowHeight = $(window).height() + 5,
    videoWidth,
    videoHeight;

    console.log(windowHeight);

    $(element).each(function(){
        var videoAspectRatio = $(this).data('height')/$(this).data('width');

        $(this).width(windowWidth);

        if(windowWidth < 1000){
            videoHeight = windowHeight;
            videoWidth = videoHeight / videoAspectRatio;
            $(this).css({'margin-top' : 0, 'margin-left' : -(videoWidth - windowWidth) / 2 + 'px'});

            $(this).width(videoWidth).height(videoHeight);
        }

        $('.header .video-container video').addClass('fadeIn animated');

    });
}