/*! viewportSize | Author: Tyson Matanich, 2013 | License: MIT */
(function(n){n.viewportSize={},n.viewportSize.getHeight=function(){return t("Height")},n.viewportSize.getWidth=function(){return t("Width")};var t=function(t){var f,o=t.toLowerCase(),e=n.document,i=e.documentElement,r,u;return n["inner"+t]===undefined?f=i["client"+t]:n["inner"+t]!=i["client"+t]?(r=e.createElement("body"),r.id="vpw-test-b",r.style.cssText="overflow:scroll",u=e.createElement("div"),u.id="vpw-test-d",u.style.cssText="position:absolute;top:-1000px",u.innerHTML="<style>@media("+o+":"+i["client"+t]+"px){body#vpw-test-b div#vpw-test-d{"+o+":7px!important}}<\/style>",r.appendChild(u),i.insertBefore(r,e.head),f=u["offset"+t]==7?i["client"+t]:n["inner"+t],i.removeChild(r)):f=n["inner"+t],f}})(this);

( function( $ ) {
    
    // Setup variables
    $window = $(window);
    $slide = $('.section');
    $slideTall = $('.section--import');
    $slideTall2 = $('.section--analytics');
    $body = $('body');
    
    //FadeIn all sections   
    $body.imagesLoaded( function() {
        setTimeout(function() {
              
              // Resize sections
              adjustWindow();
              
              // Fade in sections
              $body.removeClass('loading').addClass('loaded');
              
        }, 800);
    });
    
    function adjustWindow(){
        
        // Init Skrollr
        var s = skrollr.init({
            render: function(data) {
            
                //Debugging - Log the current scroll position.
                //console.log(data.curTop);
            }
        });
        
        // Get window size
        winH = $window.height();
        
        // Keep minimum height 550
        if(winH <= 550) {
            winH = 550;
        } 
        
        // // Resize our slides
        // $slide.height(winH);
        // $slideTall.height(winH*2);
        // $slideTall2.height(winH*3);
        
        // Refresh Skrollr after resizing our sections
        s.refresh($('.section'));
        
    }

    // var vid = document.getElementById("myVideo");
    // vid.currentTime = 5;

    var video = document.getElementById("video");

    
    setTimeout(function(){
        $(".header__shadow").addClass('is-animated');
        $(".header__text--1").addClass('is-animated');
    }, 1000);

    video.addEventListener("timeupdate", function() {
        if (video.currentTime >= 8) {
            $(".header__text--1").removeClass('is-animated');
            $(".header__text--2").addClass('is-animated');
        }
        if (video.currentTime >= 19) {
            $(".header__text--2").removeClass('is-animated');
            $(".header__text--3").addClass('is-animated');
        }
        if (video.currentTime >= 19) {
            $(".header__text--3").removeClass('is-animated');
            $(".header__text--3").addClass('is-animated');
        }
        if (video.currentTime >= 24) {
            $(".header__text--3").removeClass('is-animated');
            $(".header__text--4").addClass('is-animated');
        }


        if (video.currentTime == 42) {
            $(".header__text--1").removeClass('is-animated');
            $(".header__text--2").removeClass('is-animated');
            $(".header__text--3").removeClass('is-animated');
            $(".header__text--4").removeClass('is-animated');
            $(".header__shadow").removeClass('is-animated');
        }
    }, false);



        
} )( jQuery );
