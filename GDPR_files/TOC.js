//This .js file holds all functionality implemented in the context of EURLEXNEW-3597
//Function comments notation:
//Both: Logic applies both for Notice page and Standalone HTML page.
//Notice page: Logic applies for Notice page only.
//Notice page - desktop: Logic for Notice page - only in desktop resolution (TOC affixed on sidebar).

//Both: This function intitializes the generation of Table Of Contents(TOC). For Notice page, it also decides whether we should compute or show already computed TOC.
function generateTOC(isStandalone, screenWarn, topLabel, isConsolidated) {
	var shouldCompute = true;
	var tocContainer;
	//Initializations for both [ages
	if (isStandalone) {		//Standalone HTML view
		var docHtml = $("body").html();		
		//Wrap the doc. HTML with bootstrap container classes		
		$("body").wrapInner("<div class='Wrapper clearfix'></div>");
		$(".Wrapper").wrapInner("<div class='container-fluid'></div>");
		$(".container-fluid").wrapInner("<div class='row row-offcanvas'></div>");
		$(".row-offcanvas").wrapInner("<div id='docHtml' class='col-md-9'></div>");
		$(".row-offcanvas").prepend("<div class='col-md-3' id='TOC'></div>");
		$("#TOC").wrapInner("<div id='TOCSidebarWrapper'></div>");
		$("#TOCSidebarWrapper").wrapInner("<div class=' affix-top' id='TOCSidebarSA'></div>");
		$("#TOCSidebarSA").wrapInner("<div class='tocWrapper'></div>");
		$(".tocWrapper").html("<i id='loadingImg' class='fa fa-spinner fa-spin'></i>");
		$(".tocWrapper").addClass("text-center");
		//ensures that scrollspy always works.
		$("html").css("height", "100%");
		$(".Wrapper").css("max-width", "none");
		//We bind this logic on load but also on resize to be responsive. It handles display issues.
		$(window).on("resize load", function () {
			$("#TOCSidebarSA").affix({	//sidebar gets affixed as soon as we scroll.
				offset: {
					top: 0
				}
			});
			$("body").attr("style", "");
			$("#docHtml").attr("style", "");
			if (window.innerWidth > 991) {	//Desktop resolution
				$("body").css("background", "#bbb");
				$("#TOCSidebarSA").width($("#TOC").width() - 10);
				//remove any left gradient classes
				$("#TOCSidebarSA").removeClass("bottomTopGradient").removeClass("bottomGradient").removeClass("topGradient");
			} else {	//Mobile resolution
				$("body").css("margin", "0");
				$("#TOCSidebarSA").width($("#docHtml").width());
				//Add appropriate padding under doc. HTML because TOC is positioned as fixed bottom.
				$("#docHtml").css("padding-bottom", parseInt($("#TOCSidebarSA").css("height")) + 20);
				//The following css rule overrides the bootstrap equivalent, so document HTML from CELLAR is rendered the best.
				if (window.innerWidth < 768) {	//xs resolution
					$("html").css("text-size-adjust", "170%");
				} else {	//sm resolution
					$("html").css("text-size-adjust", "auto");
				}
			}
		});
	} else {	//Notice Page
		//container of TOC differs according to resolution.
		if (window.innerWidth > 991) {	//Desktop resolution
			tocContainer = $("#tocSidebar");
		} else {	//Mobile resolution
			tocContainer = $("#TOC-off-canvas");
		}
		
		//Check if TOC has already been computed.
		if (tocContainer.find(".tocWrapper .toc-sidebar").length > 0) {
			shouldCompute = false;
		} else {	//No TOC in DOM, we should compute it.
			//Hide the 'display TOC' button
			if (window.innerWidth > 991) {	//Desktop resolution
				$("#hideConsLegVersions").click();
				$("#tocBtn").addClass("hidden");
			} else {	//Mobile resolution
				$("#tocBtnMbl").addClass("hidden");
			}
			//Append a spinner in container
			tocContainer.find(".tocWrapper").append("<i id='loadingImg' class='fa fa-spinner fa-spin'></i>");
			tocContainer.find(".tocWrapper").addClass("text-center");
		}
	}

	if (shouldCompute) {	//Proceed with computation of TOC. Then adjust scroll level of TOC based on page scroll. For standalone view, we should always compute on page load. 
		adjustScroll(isStandalone, tocContainer, function() {
			getTOC(isStandalone, tocContainer, screenWarn, topLabel, isConsolidated);
		});
	} else {	//Notice page: just show the TOC - case where we have already computed it before.
		adjustScroll(isStandalone, tocContainer, function() {
			tocContainer.find(".toc-sidebar").removeClass("hidden");
			tocContainer.find(".topBar").removeClass("hidden");
		});
		
		//Hide the 'display TOC' button, show the 'hide' button, according to screen width.	
		if (window.innerWidth > 991) {		//Desktop resolution
			$("#hideConsLegVersions").click();
			$("#tocBtn").addClass("hidden");
			$("#tocHideBtn").removeClass("hidden");
			
			//computed TOC should be shown, but space is so small that its height is 0. So, also display a warning msg.
			if ( $("#tocSidebar .toc-sidebar").css("max-height") == "0px" || $("#tocSidebar .toc-sidebar").css("height") == "2px" ) {
				$("#tocSidebar .tocWrapper .alert-info").removeClass("hidden");
			}
			//EURLEXNEW-4040. Adjust Versions top margin.
			if (!isStandalone) {
				var cssMarginTop = parseInt($("#consLegVersions").css("margin-top"));
				$("#consLegVersions").attr("style", "");	//clear any inline styles previously appended
				$("#consLegVersions").css("margin-top", cssMarginTop + $(".toc-sidebar").height());
			}
		} else {	//Mobile resolution
			$("#tocBtnMbl").addClass("hidden");
			$("#tocHideBtnMbl").removeClass("hidden");
		}
	}
	//Handle collapsed Text
	if (!isStandalone && window.innerWidth > 991 && !$("#PP4Contents").hasClass("in")) {	//Notice page - desktop resolution: if text is collapsed and we ask for TOC
		$("#documentView").css("margin-bottom", $("#tocSidebar .toc-sidebar").height() + 73);		//add a margin to documentView so TOC can't collide with footer
	}
}

//Both: This function retrieves & appends the table of contents(TOC) based on which view we are in. It also resolves display issues.
function getTOC(isStandalone, tocContainer, screenWarn, topLabel, isConsolidated) {	
	var docCount;
	//Defines which is the container for the TOC and its topBar
    var topBarWrapper;
	//TOC calculation and append	
	if (isStandalone) {	//Standalone HTML page: Calculate TOC, remove spinner & append TOC.
	    topBarWrapper = "TOCSidebarSA";
		$(".tocWrapper").append("<nav class='toc-sidebar'></nav>");
		var docHtml = $("#docHtml").html();
		var dataToc = generateTocWithEliWhenEnabled(isConsolidated, docHtml, 'docHtml', topLabel);
        $(".tocWrapper #loadingImg").remove();
		$(".tocWrapper").removeClass("text-center");
		$(".tocWrapper .toc-sidebar").append(dataToc.html);
		$("<div class='topBar'> </div>").insertBefore(".tocWrapper .toc-sidebar");
		//Create an X button when viewing standalone from a mobile resolution
        		$("<button type='button' id='tocHideBtnStandalone' class='fa fa-times' onclick='hideTOC($(\".tocWrapper\"));'/> ")
        				.insertBefore(".tocWrapper .toc-sidebar");

        		if (window.innerWidth > 991) { //Hide the Button for Desktop resolutions
        			document.getElementById("tocHideBtnStandalone").style.visibility = "hidden";

        		}

       if(dataToc.isEliToc){
            tocListenerOnActiveLink();
            toggleTocEliMenu('docHtml');
       }

	} else { //Notice page: Calculate TOC, remove spinner, append TOC, handle button display.
	    topBarWrapper = "tocSidebar";
		docCount = $("#textTabContent > .tabContent").not(".documentSeparator").length;
		//Check if we have any streams
		if (docCount > 0) {
			//Append the nav parent element to both desktop and mobile containers.
			$(".tocWrapper").append("<nav class='toc-sidebar'></nav>");
			$("<div class='topBar'> </div>").insertBefore(".tocWrapper .toc-sidebar");

			$("#textTabContent > .tabContent").not(".documentSeparator").each(function(index, doc) {	//iterate for each document stream of page			
				var idDoc = String($(this).attr("id"));				
				if (idDoc.indexOf("document") != -1) {	//backup check: Id must contain 'document'
					var docHtml = $(this).html();
					var dataToc = generateTocWithEliWhenEnabled(isConsolidated, docHtml, idDoc, topLabel);
					//remove spinner
                    tocContainer.find(".tocWrapper #loadingImg").remove();
                    tocContainer.find(".tocWrapper").removeClass("text-center");
                    //Append the TOC to both desktop and mobile containers.
                    $(".tocWrapper .toc-sidebar").append(dataToc.html);

                    if(dataToc.isEliToc){
                    	tocListenerOnActiveLink();
                        toggleTocEliMenu(idDoc);
                    }
				}	
			});
			
			//Show the corresponding 'Hide' btn, and hide the TOC of the resolution we are not in.
			if (window.innerWidth > 991) {	//Desktop resolution
				$("#tocHideBtn").removeClass("hidden");
				$("#TOC-off-canvas .toc-sidebar").addClass("hidden");
			} else {	//Mobile resolution
				$("#tocHideBtnMbl").removeClass("hidden");
				$("#tocSidebar .toc-sidebar").addClass("hidden");
				$("#tocSidebar .topBar").addClass("hidden");
			}
		}
	}
	
	//We bind this on click of TOC links
	$(".tocWrapper a").on("click", function(evt) {
		evt.preventDefault();
		if (!$("#PP4Contents").hasClass("in")){	 //Notice page: Text could be collapsed
			//Expand Text tab before navigating.
			$("#PP4Contents").collapse("show");				
			$("html, body").animate({
				scrollTop: $($.attr(this, "href")).offset().top
			}, 500);
			window.location.href = $(this).attr("href");
		} else {	//Text already expanded, or we are in Standalone view.
			window.location.href = $(this).attr("href");
		}
		$(".row-offcanvas").removeClass("active");
	});
		
	//Scrollspy: syncs scroll of body to 'active' links in the newly appended nav(s). For notice page, we have 2 scrollspy navs(one per resolution), so it is handled differently.
	if (isStandalone) {		//Standalone view
		$("body").scrollspy({target: ".toc-sidebar"});
	} else {	//Notice page - 2 scrollspy navs
		doubleScrollSpyInit();
	}
	
	//Both: This adjusts TOC scroll to the 'active' link, which corresponds to the scroll level of the HTML document.
	//Selects all TOC links in all outter ul's
	var links = $("nav.toc-sidebar > ul > li");
	links.each(function(index, item) {	//For each TOC link
		var $this = $(this);
		//create a mutation observer to observe class changes
		var linkObserver = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (mutation.attributeName === "class") {	//only class mutations
					var attributeValue = $(mutation.target).prop(mutation.attributeName);					
					if (attributeValue.trim() == "active" || attributeValue.trim() == "topLink active") {	//whenever some class changes to 'active'
						var linkInCurrentNav;	//Notice page: Indicates if current link is in the nav we are showing due to responsiveness.
						var scrollElement;	//The TOC element to scroll.
						if (isStandalone) {		//Standalone View: It only has a single nav. All observed links are in it.					
							linkInCurrentNav = true;
							if (window.innerWidth > 991) {	//desktop resolution
								scrollElement = $(".toc-sidebar");
							} else {	//mobile resolution
								scrollElement = $("#TOCSidebarSA");
							}
							var scollNav = scrollElement;
						} else {	//Notice page: It has 2 navs. Only scroll to observed links in the displayed nav. 
							//Find if the active link is in our displayed TOC container.
							if (window.innerWidth > 991) { //desktop resolution
								scrollElement = $("#tocSidebar");
								linkInCurrentNav = $this.closest(".tocWrapper").parent().attr("id") == "tocSidebar";
							} else {	//mobile resolution
								scrollElement = $("#TOC-off-canvas");
								linkInCurrentNav = $this.closest(".tocWrapper").parent().attr("id") == "TOC-off-canvas";								
							}
							var scollNav = scrollElement.find(".toc-sidebar");
						}
						if (linkInCurrentNav) {	//active link is in our displayed TOC container: do the actual scroll.
							customScroll(scrollElement.find("li.active").first());

							d1 = scollNav.find("li.active").first().offset().top - scollNav.offset().top;	//distance of 'top' link to outter 'active' link
							d2 = scollNav.find("li.active").last().offset().top - scollNav.find("li.active").first().offset().top; //distance of inner and outter 'active' links
							d3 = scollNav.height();	//height of nav

 							if (d3 - d2 < d1) { // if some 'active' nested entry is not in TOC, scroll to it
								customScroll(scrollElement.find("li.active").last());
							}
						}
					}
				}
			});
		});
		linkObserver.observe($this[0], {
			attributes: true
		});
	});

	//All Code below handles display issues:
	$(document).ready(function () {
     	window.dispatchEvent(new Event('resize'));
    });
	//Both: We call this to handle nav height display issues, based on resolution, but also bind it on resize to be responsive.
	calculateTOCHeight(isStandalone, screenWarn);
	$(window).on("resize", function () {
		calculateTOCHeight(isStandalone, screenWarn);
		//re-calculate TOC bar width
		calculateTocBarWidth(topBarWrapper, true);
	});

	appendLinkToTopBar(topBarWrapper);
	calculateTocBarWidth(topBarWrapper, false);

	//Handle gradients for mobile display
	bindGradientHandler(isStandalone);
	
	if (!isStandalone) {	//Notice page
		//Notice page: bind adjustTOCHeight on scroll, it deals with scroll-related height modifications.
		$(window).on("scroll", function () {
			adjustTOCHeight(screenWarn);
 			if (window.innerWidth < 991) {	//mobile resolution	
				$("aside#TOC-off-canvas .tocWrapper .toc-sidebar").attr("style", "");
				$("aside#TOC-off-canvas .tocWrapper .toc-sidebar").height($("aside#TOC-off-canvas").height() - 29);	//Makes sure that 'Top' links are on top when scrolling
				$("#TOC-off-canvas nav.toc-sidebar > ul > li.active").removeClass("active").addClass("active"); //height has been changed, trigger mutation observer that computes scroll.
			}
		});
		
		//Notice page - mobile resolution: bind the following logic on focus event of first the link of TOC(this focus is the default behavior when opening offcanvas)
		$("#TOC-off-canvas .tocWrapper .toc-sidebar .toc-sidenav li>a").first().on("focusin", function(evt) {
			//scroll to active link
			var activeLinkMbl = $("#TOC-off-canvas .tocWrapper .toc-sidebar .toc-sidenav li.active");
			if (activeLinkMbl.length > 0 ) {
				customScroll(activeLinkMbl);
			}
		});
		
		//Notice page - mobile resolution: observe class changes of off-canvas element(mobile display TOC container), so as to display buttons properly according its expand status.
		//It is needed because TOC can also be hidden by clicking on page.
		var offCanvas = $("#TOC-off-canvas");
		var offCanvasObserver = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (mutation.attributeName === "class") {
					var attributeValue = $(mutation.target).prop(mutation.attributeName);				
					if (attributeValue.indexOf("is-open") != -1) {	//off-canvas open
						$("#tocBtnMbl").addClass("hidden");
						$("#tocHideBtnMbl").removeClass("hidden");
						$("aside#TOC-off-canvas .tocWrapper .toc-sidebar").height($("aside#TOC-off-canvas").height() - 29);	//Makes sure that 'Top' links are on top when scrolling
						$("aside#TOC-off-canvas .tocWrapper .toc-sidebar > ul > li.active").removeClass("active").addClass("active"); //trigger mutation observer that computes scroll.
					} else if (attributeValue.indexOf("is-closed") != -1) {	//off-canvas closed
						$("#tocHideBtnMbl").addClass("hidden");
						$("#tocBtnMbl").removeClass("hidden");
					}
				}
			});
		});
		offCanvasObserver.observe(offCanvas[0], {
			attributes: true
		});
	}
}

function appendLinkToTopBar(topBarWrapper){
    $(".topBar").html("");
	$("#" + topBarWrapper + " .toc-sidebar .topLink").each(function(index, doc) {
		//Append the link HTML to the TOC bar
		$(".topBar").append($(this).html());
	});
}

function generateTocWithEliWhenEnabled(isConsolidated, docHtml, selector, topLabel){

        function generateTOCWithoutEli(){
            if(isConsolidated == "true"){
                console.log('CONSLEG TOC GENERATED WITH OLD ALGO');
                return getConsolidatedTOCFromHtml(docHtml, selector, topLabel);
            }else{
                console.log('OJ TOC GENERATED WITH OLD ALGO');
                //return getTOCFromHtml(docHtml, selector, topLabel);
                return getTOCFromHtml(docHtml, selector, topLabel);
            }
        }

		//EURLEXNEW-4552
        if(tocEliSubdivisionsEnable){

            //generate TOC against ELI subdivisions if applied
            var newToc = generateTOCForEliSubdivision(selector, isConsolidated == "true" ? 'CONSLEG' : 'OJ', topLabel);

            if(newToc){
                console.log('ELI ENABLED : TOC GENERATED WITH ELI ALGO');
                return {isEliToc: true, html: newToc};
            }
        }
        return {isEliToc: false, html: generateTOCWithoutEli()};
}

// EURLEXNEW-3725: This function is responsible for the gradient classes on mobile resolution TOC
function bindGradientHandler(isStandalone) {
	if (isStandalone) {		//For Standalone view the DOM responsible for desktop and mobile TOCs does not change, so we distinguish via window size
		if (window.innerWidth < 991) {	//mobile resolution
			$("#TOCSidebarSA").addClass("bottomGradient");
		}
		$("#TOCSidebarSA").on("scroll", function() {		
			$(this).removeClass("bottomTopGradient").removeClass("bottomGradient").removeClass("topGradient");
			if (window.innerWidth < 991) {	//mobile resolution
				if ($(this).innerHeight() < $(this)[0].scrollHeight) {
					if ($(this).scrollTop() == 0) {
						$(this).addClass("bottomGradient");
					}	
					else if ($(this).scrollTop() + $(this).innerHeight() == $(this)[0].scrollHeight) {
						$(this).addClass("topGradient");
					}
					else {
						$(this).addClass("bottomTopGradient");
					}
				}
			}
		});
	} else {	//For notice page, the mobile TOC has its own dedicated HTML. We use that.
		$("#TOC-off-canvas .tocWrapper .toc-sidebar").addClass("bottomGradient");
		$("#TOC-off-canvas .tocWrapper .toc-sidebar").on("scroll", function() {		
			$(this).removeClass("bottomTopGradient").removeClass("bottomGradient").removeClass("topGradient");
			if ($(this).innerHeight() < $(this)[0].scrollHeight) {
				if ($(this).scrollTop() == 0) {
					$(this).addClass("bottomGradient");
				}	
				else if ($(this).scrollTop() + $(this).innerHeight() == $(this)[0].scrollHeight) {
					$(this).addClass("topGradient");
				}
				else {
					$(this).addClass("bottomTopGradient");
				}
			}
		});
	}
}
// EURLEXNEW-3725: This function calculates TOC bar width
function calculateTocBarWidth(topBarWrapper, resize) {
	if (window.innerWidth > 991) {	//Desktop resolution
		$("#" + topBarWrapper + " .toc-sidebar ul").first().attr("style", "height: 0;")
		topBarW = $("#" + topBarWrapper + " .toc-sidebar ul").first().width();
		$("#" + topBarWrapper + " .toc-sidebar ul").first().attr("style", "")

		if (!resize && topBarWrapper == "TOCSidebarSA") {	//Standalone view, on initial calculation calculateTocBarWidth
			topBarW = topBarW - 8;
			document.getElementById("tocHideBtnStandalone").style.visibility = "hidden";
		}
		$(".topBar").attr("style", "width: " + topBarW + "px;");



	} else {	//Mobile resolution
		$(".topBar").attr("style", "");	//Notice page mobile, handled by css, so clear style
		
		if (topBarWrapper == "TOCSidebarSA") {	//Standalone view only
			topBarW = $("#" + topBarWrapper + " .toc-sidebar").first().width();
			if (!resize) {	//initial calculation
				topBarW = $("html").width() - 20;
			}

			$(".topBar").attr("style", "width: " + topBarW + "px;");

			document.getElementById("tocHideBtnStandalone").style.visibility = "visible";
		}
	}
}

// EURLEXNEW-3725: This function handles the custom scrolling for the TOC, i.e. scroll the nav 2 links above active link. In addition it highlights top links in the top bar.
function customScroll(active) {
	var containerNav = active.closest(".toc-sidebar");
	//TOC entries with class 'topLink' are not visible. But they are treated like all links when scrolling. Here we do not scroll to these elements but top, then highlight their corresponding entries in the top bar.
	if (active.hasClass("topLink")) {
		var attrHref = active.find("a").attr("href");
		containerNav.siblings(".topBar").find("a").removeClass("active");
		containerNav.siblings(".topBar").find("a[href='" + attrHref + "']").addClass("active");
		containerNav.scrollTop(0);
	} else {	// The actual scrolling for all other cases is done here.
		containerNav.siblings(".topBar").find("a").removeClass("active");
		var prev = active.prev();
		var prevPrev = prev.prev();
		if (prevPrev.length > 0) {
			prevPrev[0].scrollIntoView();
		} else if (prev.length > 0){
			prev[0].scrollIntoView();		
		} else {
			active[0].scrollIntoView();		
		}
		if (window.innerWidth > 991) {	//This scroll offset is specific to the DOM for each case
			offset = ($(".topBar").height() + 10);
		} else {
			offset = ($(".topBar").height() - 20);
		}
		containerNav.scrollTop(containerNav.scrollTop() - offset);
	}
}

//Both: This function calculates the TOC's height, based on available space, using the 'max-height' attribute. It is called on compute and on resize.
function calculateTOCHeight(isStandalone, screenWarn) {
	var availableNavHeight;
	if (isStandalone) {	//Standalone HTML view
		if (window.innerWidth > 991) {	//Desktop resolution
			availableNavHeight = window.innerHeight - 50;
		} else {	//Mobile resolution
			availableNavHeight = $("#TOCSidebarSA").height();
		}
		//Clear style attribute for TOC. It is only needed/recomputed for desktop resolution. Mobile has its own fixed max-height for the TOC's container.
		$(".tocWrapper .toc-sidebar").attr("style", "");
		if (window.innerWidth > 991) {	//Desktop resolution
			$(".tocWrapper .toc-sidebar").css("overflow-y", "auto");
			$(".tocWrapper .toc-sidebar").css("max-height", availableNavHeight);
		}		
	} else {	//Notice page
		if (window.innerWidth > 991) {	//desktop resolution
			$("#tocSidebar .toc-sidebar").css("height", "");	//clear height property so max-height applies
			//Calculate available max height for appended nav, based on available space.
			availableNavHeight = ($(window).height() - $("#AffixSidebar").height() - 80);
			//EURLEXNEW-3749 - for consolidated text we can have versions box
			if ($("#consLegVersions").length > 0) {
				availableNavHeight = availableNavHeight - 50;
			}	
			availableNavHeight = checkSpace(availableNavHeight, screenWarn);
			$("#tocSidebar .toc-sidebar").css("max-height", availableNavHeight);
			//makes height modifications based on scroll level of window.
			adjustTOCHeight(screenWarn);			
			//When resizing to desktop and mobile TOC is open, close mobile offcanvas and show desktop one.
			if ($("#TOC-off-canvas").hasClass("is-open")) {
				$(".is-open").removeClass("is-open").addClass("is-closed");
				$("html").removeClass("has-offcanvas--visible").removeClass("has-offcanvas--bottom").removeClass("has-offcanvas--overlay");
				$("body").removeClass("has-offcanvas--visible").removeClass("has-offcanvas--bottom").removeClass("has-offcanvas--overlay");
				$("#tocHideBtnMbl").removeClass("is-active").addClass("hidden");
				$("#tocBtnMbl").removeClass("hidden");
				$("#tocBtnMbl").click();
			}
		}
	}
}

var isOverFlown;	//Global variable, stores whether the TOC nav is an overflown element or not.

//Notice page - desktop resolution: This function further modifies the overflown TOC's height, based on scroll level of window, using the 'height' attribute. It is called on compute, on resize and on scroll.
function adjustTOCHeight(screenWarn) {
	if (window.innerWidth > 991) {	//Desktop resolution
		var maxHeight = parseInt($("#tocSidebar .toc-sidebar").css("max-height"));
		var previousHeight = parseInt($("#tocSidebar .toc-sidebar").css("height"));
		var availableNavHeight;
		
		var footerTop = $("footer").offset().top;
		var footerBottom = footerTop + $("footer").outerHeight();
		var viewportTop = $(window).scrollTop();
		var viewportBottom = viewportTop + $(window).height();
		var footerInViewPort = (footerBottom > viewportTop && footerTop < viewportBottom);
		var isOpen = !$("#tocSidebar .toc-sidebar").hasClass("hidden");
		
		if (footerInViewPort) {		//When footer is in view: reduce TOC height.

			availableNavHeight = ($("footer").offset().top - $("#tocSidebar .tocWrapper").offset().top) - 103;
		} else if ($("#AffixSidebar").hasClass("affix-top")) {	//When sidebar is affixed on top of page: reduce TOC height.
			availableNavHeight = maxHeight - $("#AffixSidebar").offset().top + $(window).scrollTop() + 19;
		} else {	//footer not in view and sidebar is not affixed on top of page.
			availableNavHeight = "";
		}
		
		if (availableNavHeight == "") {	 //Middle of page
			$("#tocSidebar .toc-sidebar").css("height", "");	//clear height property so max-height applies
			if ( !($("#tocSidebar .toc-sidebar").css("max-height")  == "0px") ) {	//if space is enough remove any previously appended warning.
				$("#tocSidebar .tocWrapper .alert-info").addClass("hidden");
			}
		} else {	//Top or bottom of page
			//If TOC is not collapsed, re-compute whether it is overflown, else retain previous value.
			isOverFlown = isOpen ? $("#tocSidebar .toc-sidebar").prop("scrollHeight") > availableNavHeight : isOverFlown;

			if (availableNavHeight < maxHeight && isOverFlown) {
				availableNavHeight = checkSpace(availableNavHeight, screenWarn);
				$("#tocSidebar .toc-sidebar").css("height", availableNavHeight);
				adjustScroll(false, $("#tocSidebar"), "");
			}				
		}
		
		if (isOverFlown == undefined) {	//This can occur if we first compute TOC in the middle of the page.
			isOverFlown = $("#tocSidebar .toc-sidebar").prop("scrollHeight") > $("#tocSidebar .toc-sidebar").height(); //Use this as initial value.
		}
		
		adjustConslegMargin(isOpen);
	}
}

//Notice page - desktop resolution: This function checks whether computed height is so small, that we should show a 'not enough space' warning. It is called on compute, on resize and on scroll.
function checkSpace(availableNavHeight, screenWarn) {
	if (availableNavHeight < 100) {	//Limited space
		availableNavHeight = 0;				
	}			
	//true on first compute, false on resizing
	var justCalculated = !$("#tocSidebar .toc-sidebar").hasClass("hidden");
	//Logic to add warning msg
	if (justCalculated && availableNavHeight == 0) {  //TOC was just computed but we have Limited space
		if ($("#tocSidebar .tocWrapper .alert-info").length == 0) {	//if warning not yet in DOM add it
			$("#tocSidebar .tocWrapper").prepend("<span class='alert alert-info'><i class='fa fa-exclamation'> " + screenWarn + "</i>");
		} else {	//just show it
			$("#tocSidebar .tocWrapper .alert-info").removeClass("hidden");		
		}
	} else {	//TOC already calculated(so we are resizing/scrolling), or space is enough
		$("#tocSidebar .tocWrapper .alert-info").addClass("hidden");	//hide  any previously appended warning
	}
	return availableNavHeight;
}

//Both: This function generates the actual table of contents(TOC) HTML, based on parsing of some document HTML.
function getTOCFromHtml(docHtml, idDoc, topLabel) {
	
	// Helper function for removing links from a node and converting it to text.
	function cloneCleanTextualize(element) {
		return element.clone().find("a").empty().end().text();
	}
	
	var TOCHTML = "";
	TOCHTML += "<ul id='TOC_" + idDoc + "' class='nav toc-sidenav outterNav'>";
	
	//Indicates that the tag is applicable for the TOC.
	var applicableTOC = false;
	//Indicates that the first 'doc-ti' class element has been found.
	var topFound = false;
	//Indicates whether tag has class 'ti-section-1' -> container
	var isContainer = false;
	//Indicates whether we should append a container ul element at current level.
	var startContainer = true;
	//Indicates whether tag has class 'ti-art' -> article
	var isArticle = false;
	//the anchor of link: #id
	var anchorId = "";
	
	// Define selectors for TOC-applicable classes.
	var tocApplicableClassesSelector =
		"#" + idDoc + " .doc-ti, #" + idDoc + " .ti-section-1, #" + idDoc + " .ti-section-2, #" + idDoc + " .ti-art, #" + idDoc + " .sti-art";
	var prefixedTocApplicableClassesSelector =
		"#" + idDoc + " .oj-doc-ti, #" + idDoc + " .oj-ti-section-1, #" + idDoc + " .oj-ti-section-2, #" + idDoc + " .oj-ti-art, #" + idDoc + " .oj-sti-art";
	
	var tocElements = $(tocApplicableClassesSelector + ", " + prefixedTocApplicableClassesSelector);
	//Iterate over all TOC-applicable elements
	for (var i = 0; i < tocElements.length; i++) {
		var tocElement = tocElements[i];		
		var hasId = false;
		
		var tocElementId = tocElement.id;
		//If id is not present, we will not use it.
		if ( tocElementId.length > 0 ){
			hasId = true;
			anchorId = "#" + tocElementId;
		}

		if (hasId){			
			var tocElementClass = tocElement.className;
			if ( tocElementClass.length > 0 ){
				//Classify according to class value
				if (tocElementClass == ("ti-art") || tocElementClass == ("oj-ti-art")) {
					isArticle = true;
					applicableTOC = true;
				}
				if (tocElementClass == ("ti-section-1") || tocElementClass == ("oj-ti-section-1")) {
					isContainer = true;
					applicableTOC = true;					
					if (startContainer == false) {
						//close previous container, next one can start
						startContainer = true;
						TOCHTML += "</ul>";
					}					
					if (startContainer == true) {	//We should open new ul container
						startContainer = false;
					}
				}
				if (tocElementClass == ("doc-ti") || tocElementClass == ("oj-doc-ti")) {
					if (!topFound) {	//Top link, should not contain tag's text
						topFound = true;
						TOCHTML += "<li class='topLink'><a href='" + anchorId + "'>" + topLabel + "</a></li>";
						$(".linkToTop").attr("href", anchorId);// replace href of Top links below each document.
					} else {
						applicableTOC = true;
						if (startContainer == false) {
							//close previous container, next one can start
							startContainer = true; 
							TOCHTML += "</ul>";
						}
					}
				}

				if (applicableTOC && topFound){
					if (tocElement.innerHTML.length > 0){
						TOCHTML += "<li>";
						TOCHTML += "<a href='"  + anchorId + "'>";
						//append text of the element in link
						TOCHTML += cloneCleanTextualize($(tocElement));
						if (isContainer) {	//Container suffix logic: use value of next element ('ti-section-2') as suffix.
							var suffix = $(anchorId).next(".ti-section-2");
							if (suffix.length < 1) {
								suffix = $(anchorId).next(".oj-ti-section-2");
							}
							if (suffix.length > 0) {
								TOCHTML += " - " + cloneCleanTextualize($(suffix));
							}
						}
						if (isArticle) {	//Article suffix logic: use value of next element ('sti-art') as suffix.
							suffix = $(anchorId).next(".sti-art");
							if (suffix.length < 1) {
								suffix = $(anchorId).next(".oj-sti-art");
							}
							if (suffix.length > 0) {
								TOCHTML += "<span class='artSuffix'> - " + cloneCleanTextualize($(suffix)) + "</span>";
							}
						}
						TOCHTML += "</a>";							
						if (isContainer && startContainer == false) {	//This indicates that a new container should open here.
							TOCHTML += "<ul class='nav innerNav'>";
						} else {
							TOCHTML += "</li>";
						}
					}
				}
			}
		}
		//reset all flags
		applicableTOC = false;
		isContainer = false;
		isArticle = false;
		anchorId = "";
	}	
	//close ul and return the HTML
	TOCHTML += "</ul>";
	return TOCHTML;
}

//EURLEXNEW-3749
//Both: This function generates the actual table of contents(TOC) HTML, for consolidated texts, based on parsing of the consolidated text HTML.
function getConsolidatedTOCFromHtml(docHtml, idDoc, topLabel) {
	var TOCHTML = "";
	TOCHTML += "<ul id='TOC_" + idDoc + "' class='nav toc-sidenav'>";

	var idIndex = 1;
	var topLinkElement = $("#" + idDoc + " p.title-doc-last:first, #" + idDoc + " p.clg-title-doc-last:first").first();
	if (topLinkElement.length == 1) { //top found
		//for 'title-doc-last' we need the first occurence of 'title-doc-first' right before it to form the link
		titleElement = topLinkElement.prevAll("p").not(".title-doc-first, .clg-title-doc-first").first().next();
		titleElement = titleElement.length > 0 ? titleElement : topLinkElement.siblings(".title-doc-first, .clg-title-doc-first").first();
		titleElement.attr("id", "tocId" + idIndex); //create Id
		idIndex ++;
		
		var topId = titleElement.attr("id");
		TOCHTML += "<li class='topLink'><a href='#" + topId + "'>" + topLabel + "</a></li>";
		$(".linkToTop").attr("href", "#" + topId);// replace href of Top links below each document.
		
		var containers = $("#" + idDoc + " p[class=title-doc-last], #" + idDoc + " p[class=clg-title-doc-last], "
							+ "#"+ idDoc + " p[class=title-annex-1], #"+ idDoc + " p[class=clg-title-annex-1]");
		containers.each(function(index, item) {	//For each container element
			if (item != topLinkElement[0]) { //if element is not the Top link	
 				if ($(item).hasClass("title-doc-last") || $(item).hasClass("clg-title-doc-last")) {
					//for 'title-doc-last' we need the first occurence of 'title-doc-first' right before it to form the link
					titleElement = $(item).prevAll("p").not(".title-doc-first, .clg-title-doc-first").first().next();
					if(titleElement.length === 0){
					    titleElement = $(item).parent().children().first();
					}
					titleElement.attr("id", "tocId" + idIndex);	//create Id
					idIndex ++;
					
					pAnchor = titleElement.attr("id");
					pText = titleElement.html() + " " + titleElement.next(".title-doc-first, .clg-title-doc-first").html();
				} else {
					$(item).attr("id", "tocId" + idIndex); //create Id
					idIndex ++;
					
					var pText = item.innerHTML;
					var pAnchor = $(item).attr("id");
				}
				if (pText.length > 0) {
					TOCHTML += "<li>";
					TOCHTML += "<a href='#"  + pAnchor + "'>";
					//remove possible embedded links in text with regex.
					var linkRegex = /<a(.|\s)*?\>(.|\n)*?(?=<\/a>)<\/a>/gm;
					pText = pText.replace(linkRegex, "");
					//append text of the element in link
					TOCHTML += pText;
					TOCHTML += "</a>";
				}
				
				nextContainer = $(containers[index+1]);
				if ($(item).hasClass("title-doc-last") || $(item).hasClass("clg-title-doc-last")) { //container of class 'title-doc-last' should contain 'title-division-1'
					var containerEntries = $(item).nextUntil(nextContainer).filter(".title-division-1, .clg-title-division-1");
					if (containerEntries.length == 0) { //if there are no other applicable entries, use 'title-article-norm'
						containerEntries = containerEntries.add($(item).nextUntil(nextContainer).filter(".title-article-norm, .clg-title-article-norm"));
					}
					if(containerEntries.length === 0){
                        containerEntries = containerEntries.add($(item).parent().next().children().find('[id^=art_]').children());
                    }

					containerEntries.each(function(index, item) {
						$(item).attr("id", "tocId" + idIndex); //create Id
						idIndex ++;
						var pText = item.innerHTML;
						if ($(item).hasClass("title-division-1") || $(item).hasClass("clg-title-division-1")) {	//title-division-1 entries should have suffix
							var suffix = $(item).next(".title-division-2, .clg-title-division-2").html();
							if (suffix != undefined) {
								pText = pText + " - " + suffix;
							}
						}
						if ($(item).hasClass("title-article-norm") || $(item).hasClass("clg-title-article-norm")) { //title-article-norm entries should have suffix
							var suffix = $(item).next(".stitle-article-norm, .clg-stitle-article-norm").html();
							if (suffix != undefined) {
								pText = pText + " - " + suffix;
							}
						}

						if (pText.length > 0) {
							TOCHTML += "<li>";
							TOCHTML += "<a href='#"  + $(item).attr("id") + "'>";
							//remove possible embedded links in text with regex.
							var linkRegex = /<a(.|\s)*?\>(.|\n)*?(?=<\/a>)<\/a>/gm;
							pText = pText.replace(linkRegex, "");
							pText = pText.replace("◄", "");
							//append text of the element in link
							TOCHTML += pText;
							TOCHTML += "</a>";
							
							var subEntries = $("");
							var nextEntry = $(containerEntries[index+1]);
							// Corner case 1: There is no next entry at this level (out-of-bounds). Use next container
							// from one level up instead.
							if (nextEntry.length < 1) {
								nextEntry = nextContainer;
							}
							// Corner case 2: There is no next container either (out-of-bounds). Use "link to top"
							// to mark the ending element instead (we always add it in jsp).
							if (nextEntry.length < 1) {
								nextEntry = $("a.linkToTop");
							}
							if ($(item).hasClass("title-division-1") || $(item).hasClass("clg-title-division-1")) { //Second level nesting: The entries of class 'title-division-1' should contain all 'title-article-norm' until next entry.
								subEntries = $(item).nextUntil(nextEntry).filter(".title-article-norm, .clg-title-article-norm");
							}
							
							if (subEntries.length > 0) {
								TOCHTML += "<ul class='nav'>";
								subEntries.each(function(index, item) {
									$(item).attr("id", "tocId" + idIndex); //create Id
									idIndex ++;
									
									var pText = item.innerHTML;
									if (pText.length > 0) {
										TOCHTML += "<li>";
										TOCHTML += "<a href='#"  + $(item).attr("id") + "'>";
										//remove possible embedded links in text with regex.
										var linkRegex = /<a(.|\s)*?\>(.|\n)*?(?=<\/a>)<\/a>/gm;
										pText = pText.replace(linkRegex, "");
										pText = pText.replace("◄", "");
										//append text of the element in link
										TOCHTML += pText;
										TOCHTML += "</a>";
										TOCHTML += "</li>";
									}
								});
								TOCHTML += "</ul>";
							}
							TOCHTML += "</li>";
						}
					});
				}
				if ($(item).hasClass("title-annex-1") || $(item).hasClass("clg-title-annex-1")) { //container of class 'title-annex-1' should contain 'title-division-1' and 'title-gr-seq-level-1'
					TOCHTML += "<ul class='nav'>";	// a container includes a nested ul
					var containerEntries = $(item).nextUntil(nextContainer).filter(".title-division-1, .clg-title-division-1");
					containerEntries = containerEntries.add($(item).nextUntil(nextContainer).filter(".title-gr-seq-level-1, .clg-title-gr-seq-level-1"));
					if (containerEntries.length == 0) { //if there are no other applicable entries, use 'title-gr-seq-level-2'
						var containerEntries = $(item).nextUntil(nextContainer).filter(".title-gr-seq-level-2, .clg-title-gr-seq-level-2");
					}
					containerEntries.each(function(index, item) {
						$(item).attr("id", "tocId" + idIndex); //create Id
						idIndex ++;
						
						var pText = item.innerHTML;
						if ($(item).hasClass("title-division-1") || $(item).hasClass("clg-title-division-1")) {	//title-division-1 entries should have suffix
							var suffix = $(item).next(".title-division-2, .clg-title-division-2").html();
							if (suffix != undefined) {
								pText = pText + " - " + suffix;
							}
						}

						if (pText.length > 0) {
							TOCHTML += "<li>";
							TOCHTML += "<a href='#"  + $(item).attr("id") + "'>";
							//remove possible embedded links in text with regex.
							var linkRegex = /<a(.|\s)*?\>(.|\n)*?(?=<\/a>)<\/a>/gm;
							pText = pText.replace(linkRegex, "");
							pText = pText.replace("◄", "");
							//append text of the element in link
							TOCHTML += pText;
							TOCHTML += "</a>";
							
							var subEntries = $("");
							var nextEntry = $(containerEntries[index+1]);
							// Corner case 1: There is no next entry at this level (out-of-bounds). Use next container
							// from one level up instead.
							if (nextEntry.length < 1) {
								nextEntry = nextContainer;
							}
							// Corner case 2: There is no next container either (out-of-bounds). Use "link to top"
							// to mark the ending element instead (we always add it in jsp).
							if (nextEntry.length < 1) {
								nextEntry = $("a.linkToTop");
							}
							if ($(item).hasClass("title-division-1") || $(item).hasClass("clg-title-division-1")) { //Second level nesting: The entries of class 'title-division-1' should contain all 'title-article-norm' until next entry.
								subEntries = $(item).nextUntil(nextEntry).filter(".title-article-norm, .clg-title-article-norm");
							} else if ($(item).hasClass("title-gr-seq-level-1") || $(item).hasClass("clg-title-gr-seq-level-1")) { //Second level nesting: The entries of class 'title-gr-seq-level-1' should contain all 'title-gr-seq-level-2' until next entry.
								subEntries = $(item).nextUntil(nextEntry).filter(".title-gr-seq-level-2, .clg-title-gr-seq-level-2");
							}
							
							if (subEntries.length > 0) {
								TOCHTML += "<ul class='nav nest-2'>";
								subEntries.each(function(index, item) {
									$(item).attr("id", "tocId" + idIndex); //create Id
									idIndex ++;
									
									if ($(item).hasClass("title-article-norm") || $(item).hasClass("clg-title-article-norm")) { //title-article-norm entries should have suffix
										var suffix = $(item).next(".stitle-article-norm, .clg-stitle-article-norm").html();
										if (suffix != undefined) {
											pText = pText + " - " + suffix;
										}
									}
									var pText = item.innerHTML;
									if (pText.length > 0) {
										TOCHTML += "<li>";
										TOCHTML += "<a href='#"  + $(item).attr("id") + "'>";
										//remove possible embedded links in text with regex.
										var linkRegex = /<a(.|\s)*?\>(.|\n)*?(?=<\/a>)<\/a>/gm;
										pText = pText.replace(linkRegex, "");
										pText = pText.replace("◄", "");
										//append text of the element in link
										TOCHTML += pText;
										TOCHTML += "</a>";
										TOCHTML += "</li>";
									}
								});
								TOCHTML += "</ul>";
							}
							
							TOCHTML += "</li>";
						}
					});
					TOCHTML += "</ul>";
				}
				TOCHTML += "</li>";
			}
		});
	}	

	//close ul and return the HTML
	TOCHTML += "</ul>";
	return TOCHTML;
}

//Notice page: This function hides the table of contents(TOC) and adjusts button display.
function hideTOC(btn) {
	if (btn.attr("id") == "tocHideBtn") {	//Desktop resolution button
		$(btn).addClass("hidden");
		$(btn).siblings(".toc-sidebar").addClass("hidden");
		$(btn).siblings(".topBar").addClass("hidden");
		$(btn).siblings("#tocBtn").removeClass("hidden");
		//TOC will be hidden - remove margin from docView. 
		$("#documentView").css("margin-bottom", "");
		
		//TOC was shown, but space was so small that its height was 0. Hide also the warning that was displayed.
		if ( $("#tocSidebar .toc-sidebar").css("max-height") == "0px" || $("#tocSidebar .toc-sidebar").css("height") == "0px" ) {
			$("#tocSidebar .tocWrapper .alert-info").addClass("hidden");
		}
		
		//Reset consolodated versions top margin.
		$("#consLegVersions").attr("style", "");
	} else {	//mobile resolution
		$(btn).addClass("hidden");
		$(btn).siblings("#tocBtnMbl").removeClass("hidden");	
	}
}

//Both: This function adjusts the scroll level for the TOC, to always be at the currently active link level. It is called on compute, on resize and on scroll for Notice page, and on load & resize for Standalone view.
function adjustScroll(isStandalone, tocContainer, callbackTOC) {
	if (typeof callbackTOC == "function") {
		callbackTOC();
	}

	if (isStandalone) {		//Standalone View
		if ($(".toc-sidebar > ul > li.active").length > 0) {
			var scrollTo = $(".toc-sidebar > ul > li.active").first();	//first active link
			customScroll(scrollTo);
			//EURLEXNEW-3839 - URI with link to HTML id not working in Firefox
			var idx = window.location.href.indexOf("#");
			var hash = idx != -1 ? window.location.href.substring(idx + 1) : "";
			$('html,body').animate({scrollTop: $("#"+ hash).offset().top}, 1);
		}
	} else {	//Notice page
		tocContainer.find(".toc-sidebar > ul > li.active").removeClass("active").addClass("active"); //trigger mutation observer that computes scroll.
	}
}

//Notice page: This function enables us to have 2 navs spying on the body. One follows the other.
function doubleScrollSpyInit() {
	$("body").scrollspy({target: ".toc-sidebar"});

    var scollSpy2ActiveLI = "";

    $("body").on("activate.bs.toc-sidebar", function (evt) {
        if (scollSpy2ActiveLI != "") {
            scollSpy2ActiveLI.removeClass("active");            
        }        
        var activeTab = $("#tocSidebar li.active a").attr("href");
        scollSpy2ActiveLI = $("#TOC-off-canvas li a[href='" + activeTab + "']").parent();
        scollSpy2ActiveLI.addClass("active");
    })

    $("body").trigger("activate.bs.scrollspy");
}

//Notice page - desktop view: This function initializes buttons and also observes & handles the collapsing of Text panel, when TOC is applicable. It is called on doc. load, before any actual computation.
function initToc(isConsolidatedText) {
	if (isConsolidatedText == "true") {	//For consolidated TOC we have to check for different classes
		var noTocClasses = $("*[class^=title-]").length == 0; //Check for classes beginning with *title-
	} else {
		var noOjTocClasses = $(".oj-ti-art").length == 0 && $(".oj-ti-section-1").length == 0 && $(".oj-doc-ti").length == 0; //true when no TOC-applicable classes were found
		var noTocClasses = noOjTocClasses && $(".ti-art").length == 0 && $(".ti-section-1").length == 0 && $(".doc-ti").length == 0; //true when no TOC-applicable classes were found
	}
	
	if (!noTocClasses) {	//If TOC-applicable classes were found, show generate TOC buttons.
		if ($("#textLoadBtn").length == 0) { //Show mobile button when not in actual mobile view, but responsive mobile-resolution view
		    $("#tocBtn").removeClass("hidden");
			$("#tocBtnMbl").removeClass("hidden");
		}
		
		var textPanel = $("#PP4Contents");
		if (textPanel.length > 0) {
			//observes class change on text panel
			var textCollapseObserver = new MutationObserver(function(mutations) {
				mutations.forEach(function(mutation) {
					if (mutation.attributeName === "class") {
						var attributeValue = $(mutation.target).prop(mutation.attributeName);
						if (window.innerWidth > 991 && attributeValue.indexOf("in") == -1 && $("#tocSidebar .toc-sidebar").length > 0 && !$("#tocSidebar .toc-sidebar").hasClass("hidden")) {	//Desktop view: Text collapsed && TOC open
							$("#documentView").css("margin-bottom", $("#tocSidebar .toc-sidebar").height() + 73);	//add a margin to documentView so TOC can't collide with footer
						}
						else if (window.innerWidth > 991 && !$("#PP4Contents").hasClass("in") && $("#consLegVersions").length > 0) {
						    if (isConsolidatedText == 'true') {
						        $("#documentView").css("margin-bottom", $("#consLegVersions .consLegNav").height() + 73); }
						    else {
						        $("#documentView").css("margin-bottom", $("#consLegVersions .consLegNav").height() + 273); //Basic Acts need more space
						    }
						}
						else {	//Desktop view with Text expanded or TOC closed, or mobile view
							$("#documentView").css("margin-bottom", "");	//remove margin
						}
					}
				});
			});
			textCollapseObserver.observe(textPanel[0], {
				attributes: true
			});
		}
	}
}

//EURLEXNEW-4040. Adjust Versions top margin.
function adjustConslegMargin(isTocOpen) {
	var affixedTop = $("#AffixSidebar").hasClass("affix-top");
	if (isTocOpen) {
		var baseMargin = affixedTop ? 50 : 70;
		var TOCHeight = $(".toc-sidebar").height();
		$("#consLegVersions").attr("style", ""); //clear any inline styles previously appended
		$("#consLegVersions").css("margin-top", baseMargin + TOCHeight);
	}
}