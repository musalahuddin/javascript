/**
 * av.productContainer
 *
 * Builds a product container
 * Author: 	Muhammad Salahuddin
 */

av.productContainer = function(in_mode, in_parent, in_products){
	
	this._mode= in_mode,

	this._id="productContainer";

	this._products=in_products;
	
	this._parent = in_parent;

	// jquery element
	this._element = null;

	// dom element
	this._dom = null;

	this.init();
	
};

av.productContainer.prototype = {

	constructor : av.productContainer,

	/**
	 * _destroy - destroys instance and it's dom 
	 * @return void
	 */
	_destroy : function(){
		console.log("destroying product container");
		this._element.remove();
		delete this;
	},

	/**
	 * init - initializes the product container
	 * @return void
	 */
	init: function(){
	
		this.render();
		
		//this._element = $('<div class="'+this._id+'"></div>');

		this._parent.append(this._element);

		this.addProducts();

	},

	/**
	 * render - renders product container
	 * @return void
	 */
	render: function(){
		this._dom =  document.createElement("div");

		this._element = $(this._dom);
		
		this._element.addClass(this._id);

	},

	/**
	 * addProducts - add products into product container
	 * @return void
	 */
	addProducts:function(){
		var _this = this;
		var products = this._products;
		//console.log("adding products");
		//console.log("product.length: " + products.length);
		for(var i=0, len=products.length; i<len; i++){

			var productData = products[i];

			//here is where we fix and validate empty objects and unescape strings
			productData.AccBelow =  unescape(av.utils.emptyObjectToString(productData.AccBelow));
			productData.AccAbove =  unescape(av.utils.emptyObjectToString(productData.AccAbove));
			

			var el = $(
					'<div class="product">'
						+'<div class="product-info" style="pointer-events: none;">'
							+'<div class="product-info-content" style="pointer-events: none;">'+unescape(av.utils.emptyObjectToString(productData.SkuName))+'</div>'
							+'<div class="product-info-content" style="pointer-events: none;">'+unescape(av.utils.emptyObjectToString(productData.SkuAV))+'</div>'
						+'</div>'
						+"<div class='product-image' style=\"pointer-events: none;\">"
						+'</div>'
					+'</div>');

			
			this._element.append(el);

			// bind product data to $(.product) element
			el.data("collection", productData);

			// popover
			this.addPopOver(el);

			// load product image 
			var url = unescape(productData.PartstrayImage); 
			if(url.indexOf(".svg") !== -1){
				
				this.loadSVGImage(el);
			}
			else{
				el.children(".product-image").css("background-image","url(\""+url+"\")");
			}

		
			// preload draggable svg element
			this.preloadDraggableSVG(el);
			
		
			// for clicking and dragging object from the library
			this.addClickListner(el);

		}
	},

	/**
	 * addClickListner - add listener to product element allowing drag and drop
	 * @param {jQuery} in_element
	 */
	addClickListner: function(in_element){
		in_element.on("mousedown", function(evt){
			//console.log(evt.target);
			
			var mouse_x = evt.clientX;
			var mouse_y = evt.clientY;

			var product = $(evt.target);
			var base64Svg = $(evt.target).data("base64Svg");
			var width = $(evt.target).data("widthInPixels") * av._svgScale * av._scale;
			var height = $(evt.target).data("heightInPixels") * av._svgScale * av._scale;

			var w = $(evt.target).data("widthInPixels");
			var h = $(evt.target).data("heightInPixels");
			var bb = $(evt.target).data("bBox");
			console.log(base64Svg);
			
			if(base64Svg){

				$('body').css("cursor","pointer");
				//$('body').css("cursor","url('res/rotate.png')");

				var left = mouse_x -(width/2);
				var top = mouse_y - (height/2);

				image = $("<div style=\"cursor:pointer; pointer-events: none; position:absolute; left:"+left+"px; top:"+top+"px; z-index:100; -moz-user-select: none; -webkit-user-select: none; user-select: none;\"><img src=\""+base64Svg+"\" style=\" width:"+width+"px; height:"+height+"px; pointer-events: none; user-drag: none; user-select: none;-moz-user-select: none;-webkit-user-drag: none;-webkit-user-select: none;-ms-user-select: none;\" ></div>");
				$('body').append(image);
				

				$(document).on("mouseup", function(evt){
					//console.log("**MOUSE UP DETECTED");
					evt.preventDefault();
					evt.stopPropagation();
					//console.log("mouse up document");
					image.remove();
					$('body').css("cursor","auto");

					
					if($(evt.target).closest("#floorPlan").attr("id") == "floorPlan"){
						av._planner.addFloorObject(product.data("collection"), evt, bb);
					}
					

					$(document).off("mousemove");
					$(document).off("mouseup");
				});

				$(document).on("mousemove",function(evt){
					//console.log("**MOUSE MOVE DETECTED");
					evt.preventDefault();
					evt.stopPropagation();

					var mouse_x = evt.clientX;
    				var mouse_y = evt.clientY;

    			
    				image.css({"left":(mouse_x - (width/2)) + "px", "top":(mouse_y - (height/2)) + "px"});

				});
			}
		});
	},

	/**
	 * addPopOver - adds popover that is displayed when hover over product element
	 * @param {jQuery} in_element
	 */
	addPopOver: function(in_element){

		var productData = in_element.data("collection");

		var priceInfo = this.getPriceInfo(in_element);

		var dimensionStr = "<div class=\"popoverContent\"><b>Width:</b>&nbsp;"+av.utils.emptyObjectToString(productData.Width)+"<b>&nbsp;&nbsp;Depth:</b>&nbsp;"+av.utils.emptyObjectToString(productData.Depth)+"<b>&nbsp;&nbsp;Height:</b>&nbsp;"+av.utils.emptyObjectToString(productData.Height)+"</div>";
		var priceStr = (priceInfo.listPrice != null) ? "<div class=\"popoverContent\"><b>"+priceInfo.listLabel+":&nbsp;</b>$"+priceInfo.listPrice+"</div>" : ""; 

		in_element.popover({
				trigger: 'hover',
				html: 'true',
				title: dimensionStr,
				content: priceStr
			});

	}, 

	/**
	 * getPriceInfo - returns price information of the product element
	 * @param  {jQuery} in_element 
	 * @return {Oject} {listLable, listPrice}
	 */
	getPriceInfo: function(in_element){

		var productData = in_element.data("collection");

		var priceInfo = {listLabel:av.utils.emptyObjectToString(productData.ListPriceLabel,"Price"), listPrice:null};

		if(productData.IsTypicalFlag == "0"){ //regular product
			if(productData.ListPrice != "0.01"){ // generic planner
				priceInfo.listPrice = av.utils.formatCurrency(productData.ListPrice);
			}
		}
		else{ //typical
			var totalListPrice=0;
			var totalYourPrice=0;

			for(var t=1; t<productData.TypicalXml.product.length; t++){
				var typicalData = productData.TypicalXml.product[t];
				if(!typicalData.SkuAV) continue;
				//console.log("Typ: " + typicalData.SkuAV);

				var listPrice = av.utils.emptyObjectToNumber(typicalData.ListPrice);

				if(listPrice != '0.01'){// Generic Planner
                    totalListPrice += Number(listPrice);
                }

                if(typicalData.Config){
	                if (typicalData.Config.product.length>0) {
	                    for (s=0; s<typicalData.Config.product.length; s++) {
	                        
	                        if(!typicalData.Config.product[s].SkuAV) continue;

	                        var config_listPrice = av.utils.emptyObjectToNumber(typicalData.Config.product[s].ListPrice);

	                        if(config_listPrice != '0.01'){// Generic Planner
	                            totalListPrice += Number(config_listPrice);
	                        }
	                    
	                    }
	                }
           		}
                
			}

			if(totalListPrice > 0){
				priceInfo.listPrice = av.utils.formatCurrency(totalListPrice);
			}
		}

		return priceInfo;
	},

	/**
	 * loadSVGImage - loads and displays svg as image on product element
	 * @param  {jQuery} in_element
	 * @return void
	 */
	loadSVGImage: function(in_element){

		var urls=[], positions=[], rotations=[], labels=[];

		var productData = in_element.data("collection");

		if(productData.PartstrayImage.indexOf(".svg") !== -1){
			urls.push(unescape(productData.PartstrayImage));
			positions.push({x:0, y:0});
			rotations.push(0);
			labels.push("");
		}

		if(urls.length>0){
			
			this.loadAndGroupSVGs({urls:urls, positions:positions, rotations:rotations, labels:labels}, function(base64Svg, width, height){
				in_element.children(".product-image").append("<img src=\""+base64Svg+"\" style=\" width:46px; height:46px; user-drag: none; user-select: none;-moz-user-select: none;-webkit-user-drag: none;-webkit-user-select: none;-ms-user-select: none;\" >");
			});
		}

	},

	/**
	 * preloadDraggableSVG - preloads draggable svg onto product element
	 * @param  {jQuery} in_element
	 * @return void
	 */
	preloadDraggableSVG: function(in_element){

		var urls=[], positions=[], rotations=[], labels=[];
	

		var productData = in_element.data("collection");
		productData.SymbolTextName = av.utils.emptyObjectToString(productData.SymbolTextName);
		productData.FilePathPlan = av.utils.emptyObjectToString(productData.FilePathPlan);

		if(productData.FilePathPlan.indexOf(".svg") !== -1){
			urls.push(unescape(productData.FilePathPlan));
			positions.push({x:0, y:0});
			rotations.push(productData.Rotation);
			labels.push(productData.SymbolTextName);
			console.log("_typ: not, FilePathPlan: " + productData.FilePathPlan);
		}

		if(productData.IsTypicalFlag == "1"){ //typical
			
			for(var t=0; t<productData.TypicalXml.product.length; t++){
				var typicalData = productData.TypicalXml.product[t];

				typicalData.SymbolTextName = av.utils.emptyObjectToString(typicalData.SymbolTextName);
				typicalData.FilePathPlan = av.utils.emptyObjectToString(typicalData.FilePathPlan);

				if(!typicalData.SkuAV) continue;
				//console.log("Typ: " + typicalData.SkuAV);
				if(typicalData.FilePathPlan.indexOf(".svg") !== -1){

					urls.push(unescape(typicalData.FilePathPlan));
					positions.push({x: av.utils.feetToPixels(Number(typicalData.x))/av._svgScale, y: av.utils.feetToPixels(Number(typicalData.y))/av._svgScale});
					rotations.push(typicalData.Rotation);
					labels.push(typicalData.SymbolTextName);
				}
			}
		}

		if(urls.length>0){
			
			this.loadAndGroupSVGs({urls:urls, positions:positions, rotations:rotations, labels:labels}, function(base64Svg, width, height, bBox){
				in_element.data("base64Svg", base64Svg);
				in_element.data("widthInPixels", width);
				in_element.data("heightInPixels", height);
				in_element.data("bBox", bBox);
			});
			
		}

	},

	/**
	 * loadAndGroupSVGs - loads single/multiple svg(s), strips out svg tags and groups them into a single svg element.
	 * we only need single svg tag instead of multiple svg tags per url.
	 * @param  {Array} in_params.urls - array of svg strings representing the svg url of the product. Multiple urls if it's a typical and single for regular product
	 * @param  {Array} in_params.positions - array of objects representing the {x:0, y:0} position of the product.
	 * @param  {array} in_params.rotations - array of numbers representing the rotation of the product.
	 * @param  {Array} in_params.labels - array of strings representing the Symbol text that goes on top of the product. 
	 * @param  {Function} in_cb - optional callback
	 * @return void
	 */
	loadAndGroupSVGs: function(in_params, in_cb){

		var _this = this;

		var s = Snap();
		
		$('body').prepend(s.node);

		var root = s.g()
		.attr({
	   		"gType" : "root"
	  	});

	  	var total = in_params.urls.length;
		var count = 0;

		var refObj = {
						snap:s, 
						root:root, 
						count:count, 
						total:total, 
						group_arr:[], 
						transform_arr:[], 
						label_arr:[], 
						callback: in_cb
					};


		for(var i=0; i<in_params.urls.length; i++){

			var prodObj = {
				url:in_params.urls[i], 
				position:in_params.positions[i], 
				rotation:in_params.rotations[i], 
				label:in_params.labels[i]
			};

			async.waterfall([
			  function (cb) { cb(null, prodObj, refObj);}
			  , _this.checkUrl
			  , _this.loadSVG
			  , _this.onSVGLoaded
			] , _this.onDone
			);
		}

	},

	/**
	 * checkUrl - checks the url and passes the result to the callback function
	 * @param  {String} in_prodObj.url - string representing svg url of the product.
	 * @param  {Object} in_prodObj.position - object representing {x:0, y:0} position of the product.
	 * @param  {Number} in_prodObj.rotation - number representing rotation of the product.
	 * @param  {String} in_prodObj.label - string representing symbol text that goes on top of the product.
	 * @param  {Snap} in_refObj.snap - reference to a Snap Object where svg(s) are loaded into.
	 * @param  {Element} in_refObj.root - reference to a group element which serves as root group.
	 * @param  {Number} in_refObj.count - number representing total number of urls that have been loaded.
	 * @param  {Number} in_refObj.total - number representing total number of urls to load.
	 * @param  {Array} in_refObj.group_arr - array of strings representing svg group as string. 
	 * @param  {Array} in_refObj.tranform_arr - array of strings representing svg tranformation as string. 
	 * @param  {Array} in_refObj.label_arr - array of strings representing svg text as string. 
	 * @param  {Function} in_refObj.callback - optional callback
	 * @param  {Function} in_cb - optional callback
	 * @return void
	 */
	checkUrl: function(in_prodObj, in_refObj, in_cb){
	
		$.ajax({
			url: in_prodObj.url, 
			success: function(result){
				
				in_cb(null, true, in_prodObj, in_refObj);
				
		    }, 
		    error: function(){
		    	
				in_cb(null, false, in_prodObj, in_refObj);
				
		    }
		});
	},

	/**
	 * loadSVG - loads svg and passes the result to the callback function
	 * @param  {Boolean} in_found
	 * @param  {String} in_prodObj.url - string representing svg url of the product.
	 * @param  {Object} in_prodObj.position - object representing {x:0, y:0} position of the product.
	 * @param  {Number} in_prodObj.rotation - number representing rotation of the product.
	 * @param  {String} in_prodObj.label - string representing symbol text that goes on top of the product.
	 * @param  {Snap} in_refObj.snap - reference to a Snap Object where svg(s) are loaded into.
	 * @param  {Element} in_refObj.root - reference to a group element which serves as root group.
	 * @param  {Number} in_refObj.count - number representing total number of urls that have been loaded.
	 * @param  {Number} in_refObj.total - number representing total number of urls to load.
	 * @param  {Array} in_refObj.group_arr - array of strings representing svg group as string. 
	 * @param  {Array} in_refObj.tranform_arr - array of strings representing svg tranformation as string. 
	 * @param  {Array} in_refObj.label_arr - array of strings representing svg text as string. 
	 * @param  {Function} in_refObj.callback - optional callback
	 * @param  {Function} in_cb - optional callback
	 * @return void
	 */
	loadSVG: function(in_found, in_prodObj, in_refObj, in_cb){
		
		if(in_found){
			Snap.load(in_prodObj.url+"?v="+parseInt(Math.random()*1000000000), function(data){
				in_cb(null, data, in_prodObj, in_refObj);
			});
		}
		else{

			in_refObj.count++;

			if(in_refObj.count == in_refObj.total){

				in_cb(in_refObj);// calls onDone
			}
		}

	},

	/**
	 * onSVGLoaded - handles svg data once it's loaded
	 * @param  {Object} in_data
	 * @param  {String} in_prodObj.url - string representing svg url of the product.
	 * @param  {Object} in_prodObj.position - object representing {x:0, y:0} position of the product.
	 * @param  {Number} in_prodObj.rotation - number representing rotation of the product.
	 * @param  {String} in_prodObj.label - string representing symbol text that goes on top of the product.
	 * @param  {Snap} in_refObj.snap - reference to a Snap Object where svg(s) are loaded into.
	 * @param  {Element} in_refObj.root - reference to a group element which serves as root group.
	 * @param  {Number} in_refObj.count - number representing total number of urls that have been loaded.
	 * @param  {Number} in_refObj.total - number representing total number of urls to load.
	 * @param  {Array} in_refObj.group_arr - array of strings representing svg group as string. 
	 * @param  {Array} in_refObj.tranform_arr - array of strings representing svg tranformation as string. 
	 * @param  {Array} in_refObj.label_arr - array of strings representing svg text as string. 
	 * @param  {Function} in_refObj.callback - optional callback
	 * @param  {Function} in_cb - optional callback
	 * @return void
	 */
	onSVGLoaded: function(in_data, in_prodObj, in_refObj, in_cb){
		
		in_refObj.count++;
		//console.log("count: " + in_refObj.count);

		var rotation = in_prodObj.rotation || 0;
		rotation = parseInt(Number(rotation)*90);

		var g= in_data.selectAll('g');

		var group = in_refObj.root.g();

		group.append(g);

		var bBox = g.getBBox();

		var transform = "translate("+in_prodObj.position.x+","+in_prodObj.position.y+") rotate("+rotation+","+(bBox.x +(bBox.width/2))+","+(bBox.y +(bBox.height/2))+")";
		
		group.attr({
			"gType" : "product_"+in_refObj.count,
			"transform" : transform
		});

		//add label on top
		if(in_prodObj.label){
			var text = in_refObj.snap.text((bBox.x +(bBox.width/2)), (bBox.y +(bBox.height-(bBox.height/4))), in_prodObj.label)
				.attr({
					"text-anchor" : "middle", 
					"text-rendering":"geometricPrecision",
					"font-family" : "verdana",
					"font-size":"21px"
				});

			group.append(text);
		}
		else{
			var text = "";
		}

		var tempArr = [];
		var items = g.items;

		$.each(items, function(index, element){
			tempArr.push(element.toString().replace(/xmlns="http:\/\/www.w3.org\/2000\/svg"/g, ''));
		});

		in_refObj.group_arr.push(tempArr);
		in_refObj.transform_arr.push(transform);
		in_refObj.label_arr.push(text.toString());

		if(in_refObj.count == in_refObj.total){
	
			in_cb(in_refObj); // calls onDone
		}
		
	},

	/**
	 * onDone - handles the final step once all svgs have been loaded. 
	 * In this step a single SVG node is created and converted into base64 format.
	 * At this point there aren't any nested svg nodes inside the main Svg node.
	 * @param  {Snap} in_refObj.snap - reference to a Snap Object where svg(s) are loaded into.
	 * @param  {Element} in_refObj.root - reference to a group element which serves as root group.
	 * @param  {Number} in_refObj.count - number representing total number of urls that have been loaded.
	 * @param  {Number} in_refObj.total - number representing total number of urls to load.
	 * @param  {Array} in_refObj.group_arr - array of strings representing svg group as string. 
	 * @param  {Array} in_refObj.tranform_arr - array of strings representing svg tranformation as string. 
	 * @param  {Array} in_refObj.label_arr - array of strings representing svg text as string. 
	 * @param  {Function} in_refObj.callback - optional callback
	 * @return void
	 */
	onDone: function(in_refObj){

	    if(in_refObj.group_arr.length == 0){
	    	$(in_refObj.snap.node).remove();
	    	return;
	    }

	    var bBox = in_refObj.root.getBBox();

	    console.log('**********************************************');
	    console.log(bBox);

		var groupStr = ''; 
		
		for(var g=0; g<in_refObj.group_arr.length; g++){
		
	
			groupStr += "<g gType=\"prod"+g+"\" transform=\""+in_refObj.transform_arr[g]+"\">";
			//groupStr += "<g gType=\"prod"+g+"\" >";

			// group data
			for(var gg=0; gg<in_refObj.group_arr[g].length; gg++){
				groupStr += in_refObj.group_arr[g][gg].toString().replace(/xmlns="http:\/\/www.w3.org\/2000\/svg"/g, '');
			}

			//text
			if(in_refObj.label_arr[g]){
				groupStr += in_refObj.label_arr[g];
			}

			groupStr += "</g>"
		}

		var stroke = 20;//3;
		var width = bBox.width+stroke;
		var height = bBox.height+stroke;


		/*
		var svgStr = 
		'<svg width="'+width+'" height="'+height+'" viewBox="'+bBox.x+' '+bBox.y+' '+bBox.width+' '+bBox.height+'"  xmlns="http://www.w3.org/2000/svg">'
			+groupStr
		+'</svg>';
		*/
		
		/*
		var svgStr = 
		'<svg  viewBox="'+bBox.vb+'"  xmlns="http://www.w3.org/2000/svg">'
			+groupStr
		+'</svg>';
		*/

		var svgStr = 
		'<svg viewBox="'+(bBox.x-(stroke/2))+' '+(bBox.y-(stroke/2))+' '+(width)+' '+(height)+'"  xmlns="http://www.w3.org/2000/svg">'
			+groupStr
		+'</svg>';

		
		var base64Svg = "data:image/svg+xml;base64," + window.btoa(svgStr);

		if(in_refObj.callback){
			in_refObj.callback(base64Svg, width, height, bBox);
		}
		
		// removes dom node
		$(in_refObj.snap.node).remove();
	},

};

(function ($, window, document, undefined) {
	
	'use strict';
	
	var pluginName = 'appendProductContainer';
	
	$.fn[pluginName] = function (in_mode, products) {
		
		var instanceName = (in_mode == av.MODE.CONFIG) ? "config_productContainer" : "productContainer";

		//$.data(this, instanceName, new av.productContainer(in_mode, this, products));

		this.data(instanceName, new av.productContainer(in_mode, this, products));

		console.log('(PRODUCT CONTAINER)');
		console.log(this);
		console.log(this.data());
		
		return this;
	};
	
	
})(jQuery, window, document);