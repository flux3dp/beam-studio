/*globals svgEditor, svgedit, $ */
/*jslint es5: true, vars: true*/
/*
 * ext-overview_window.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2013 James Sacksteder
 *
 */

var overviewWindowGlobals = {};
svgEditor.addExtension("overview_window", function(S) {
	'use strict';

	// Define and insert the base html element.
	var propsWindowHtml= "\
		<div id=\"overview_window_content_pane\" style=\" width:100%; word-wrap:break-word;  display:inline-block; margin-top:20px;\">\
			<div id=\"overview_window_content\" style=\"position:relative; top:0px;\">\
				<div style=\"background-color:#A0A0A0; display:inline-block; overflow:visible; pointer-events:auto;\">\
					<svg id=\"overviewMiniView\" width=\"100\" height=\"100\" x=\"0\" y=\"0\" viewBox=\"0 0 4800 3600\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\
						<use x=\"0\" y=\"0\" xlink:href=\"#svgroot\"> </use>\
					 </svg>\
					 <div id=\"overview_window_view_box\" style=\"min-width:50px; min-height:50px; position:absolute; top:30px; left:30px; z-index:0; background-color:rgb(0,74,189); opacity: 0.3;\">\
					 </div>\
				 </div>\
			</div>\
		</div>";
	$(".left-panel").append(propsWindowHtml);

	// Define dynamic animation of the view box.
	const elWorkarea = document.getElementById('workarea');
	const elCanvas = document.getElementById('svgcanvas');
	// const elMiniview = document.getElementById('overviewMiniView');
	const elOverviewBox = document.getElementById('overview_window_view_box')
	var updateViewBox = function(){
		var portHeight=elWorkarea.clientHeight;
		var portWidth=elWorkarea.clientWidth;
		var portX=elWorkarea.scrollLeft;
		var portY=elWorkarea.scrollTop;
		var windowWidth= elCanvas.clientWidth
		var windowHeight= elCanvas.clientHeight;
	//	var overviewWidth=elMiniview.clientWidth;
	//	var overviewHeight=elMiniview.clientHeight;
		
		var viewBoxX=portX/windowWidth*overviewWidth;
		var viewBoxY=portY/windowHeight*overviewHeight;
		var viewBoxWidth=portWidth/windowWidth*overviewWidth;
		var viewBoxHeight=portHeight/windowHeight*overviewHeight;

		elOverviewBox.style.minWidth = viewBoxWidth + "px";
		elOverviewBox.style.minHeight = viewBoxHeight + "px";
		elOverviewBox.style.top = viewBoxY + "px";
		elOverviewBox.style.left = viewBoxX + "px";
	};
	$("#workarea").scroll(function(){
		if(!(overviewWindowGlobals.viewBoxDragging)){
			updateViewBox();
		}
	});
	$("#workarea").resize(updateViewBox);
	updateViewBox();
	
	// Compensate for changes in zoom and canvas size.
	var updateViewDimensions= function(){
		var viewWidth=$("#svgroot").attr("width");
		var viewHeight=$("#svgroot").attr("height");
		var viewX=svgEditor.curConfig.dimensions[0];
		var viewY=svgEditor.curConfig.dimensions[1];
		
		var svgWidth_old=$("#overviewMiniView").attr("width");
		var svgHeight_new=viewHeight/viewWidth*svgWidth_old;
		$("#overviewMiniView").attr("viewBox",viewX+" "+viewY+" "+viewWidth+" "+viewHeight);
		$("#overviewMiniView").attr("height",svgHeight_new);
		updateViewBox();
	};
	updateViewDimensions();
	
	// Set up the overview window as a controller for the view port.
	overviewWindowGlobals.viewBoxDragging=false;
	var updateViewPortFromViewBox = function(){
	
		var windowWidth =parseFloat($("#svgcanvas").css("width" ));
		var windowHeight=parseFloat($("#svgcanvas").css("height"));
		var overviewWidth =$("#overviewMiniView").attr("width" );
		var overviewHeight=$("#overviewMiniView").attr("height");
		var viewBoxX=parseFloat($("#overview_window_view_box").css("left"));
		var viewBoxY=parseFloat($("#overview_window_view_box").css("top" ));
		
		var portX=viewBoxX/overviewWidth *windowWidth;
		var portY=viewBoxY/overviewHeight*windowHeight;

		$("#workarea").scrollLeft(portX);
		$("#workarea").scrollTop(portY);

	};
	$( "#overview_window_view_box" ).draggable({  containment: "parent"
		,drag: updateViewPortFromViewBox
		,start:function(){overviewWindowGlobals.viewBoxDragging=true; }
		,stop :function(){overviewWindowGlobals.viewBoxDragging=false;}
	});  
	$("#overviewMiniView").click(function(evt){
		// Firefox doesn't support evt.offsetX and evt.offsetY.
		var mouseX=(evt.offsetX || evt.originalEvent.layerX);
		var mouseY=(evt.offsetY || evt.originalEvent.layerY);
		var overviewWidth =$("#overviewMiniView").attr("width" );
		var overviewHeight=$("#overviewMiniView").attr("height");
		var viewBoxWidth =parseFloat($("#overview_window_view_box").css("min-width" ));
		var viewBoxHeight=parseFloat($("#overview_window_view_box").css("min-height"));
 
		var viewBoxX=mouseX - 0.5 * viewBoxWidth;
		var viewBoxY=mouseY- 0.5 * viewBoxHeight;
		//deal with constraints
		if(viewBoxX<0){
			viewBoxX=0;
		}
		if(viewBoxY<0){
			viewBoxY=0;
		}
		if(viewBoxX+viewBoxWidth>overviewWidth){
			viewBoxX=overviewWidth-viewBoxWidth;
		}
		if(viewBoxY+viewBoxHeight>overviewHeight){
			viewBoxY=overviewHeight-viewBoxHeight;
		}
		
		$("#overview_window_view_box")[0].style.top = viewBoxY + "px";
		$("#overview_window_view_box")[0].style.left = viewBoxX + "px";
		updateViewPortFromViewBox();
	});
	
	return {
		name: "overview window",
		canvasUpdated: updateViewDimensions,
		workareaResized: updateViewBox
	};
});
