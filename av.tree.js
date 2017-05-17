/**
 * av.tree
 *
 * Builds a tree view
 * Author: 	Muhammad Salahuddin
 */

av.tree = function(in_mode, in_parentElement){
	
	this._mode = in_mode,
	//id 
	this._id = "treeview";

	//json collection of catalog objects
	this._catalogs=[];

	this._ptcIds = '';
	

	this._parent = in_parentElement;

	// jquery element
	this._element = null;

	// dom element
	this._dom = null;

	//to enable cache or keep getting data from db every time tree node is clicked. 
	this._useCache = true;

	//to enable full tree view.
	this._fullTree = false;

	this._expandIcon  = 'glyphicon-minus';
	//this._expandIcon  = '';

	this._collapseIcon = 'glyphicon-plus';

	this._requests = [];
	
	this.init();
};

av.tree.prototype = {

	constructor : av.tree,
	
	/**
	 * init 
	 * @return void
	 */
	init: function(){

		if(!this._fullTree){
			this._expandIcon = '';
			this._collapseIcon = '';
		}

		this.render();

		this._parent.append(this._element);

		this.addChildNodes(this._element, [{label:"Catalogs", type:"root", hasChildNodes:true, isFilterable:false}]);

		//register click event
		this._element.on('click', $.proxy(this.clickHandler, this));

		this.fetchCatalogs();
		
	},

	/**
	 * render
	 * @return void
	 */
	render: function(){
		this._dom =  document.createElement("div");

		this._element = $(this._dom);
		
		this._element.addClass(this._id);

	},


	/**
	 * fetchCatalogs - fetches catalogs from db into _catalogs[] array
	 * @return void 
	 */
	fetchCatalogs: function(){

		var _this = this; 

		_this._requests = [];

		console.log("fetchCatalogs - displayPreloader");
		_this.displayPreloader();

		var tableColumns = [];
		tableColumns[0] = "SystemId";
		tableColumns[1] = "SystemName";
		tableColumns[2] = "MfgIn";
		tableColumns[3] = "MfgInLabel";
		tableColumns[4] = "ProdIn";
		tableColumns[5] = "ProdInLabel";
		tableColumns[6] = "CatalogIn";
		tableColumns[7] = "CatalogInLabel";
		tableColumns[8] = "ConfigIn";
		tableColumns[9] = "ConfigInLabel";
		tableColumns[10] = "InfoText";
		tableColumns[11] = "InfoTextLabel";
		tableColumns[12] = "MenuOrder";
		tableColumns[13] = "PTCId";
		tableColumns[14] = "PartsTraySortBy";

		var ShownInSectionID = 1;

		var postVariablesStr = '&ClientId='+av._ClientId+'&DealerId='+av._DealerId;
		if(_this._mode == av.MODE.CONFIG){
			//var floorObj = av._planner.getObjectByGuid(av._planner._selectedObject);
			var floorObj = av._planner.getObjectByGuid(av.config.selectedObject);
			postVariablesStr += "&SystemId="+floorObj._data.SystemId;

			var ShownInSectionID = 2;
		}

		for(var c = 0; c<tableColumns.length; c++){
			postVariablesStr += "&"+"tableColumn_"+c+"="+tableColumns[c];
		}

		var url = "url.php?generate=systems_json&ShownInSectionID="+ShownInSectionID+postVariablesStr;
		var cb = function(result){
			//console.log("RESULT");
			//console.log(result);

			if(result){
				//_this._catalogs = JSON.parse(result);//_this.jsonCatalogs(result);
				_this._catalogs = result;

				console.log(_this._catalogs);

				_this._ptcIds = _this.ptcIds().join();

				console.log("ptcIds:");
				console.log(_this._ptcIds);

				//force treeview to expand itself by default once the data is loaded.
				var el = _this._element.find(".tree-toggler");
				el.first().trigger("click");
			}

			console.log("fetchCatalogs - removePreloader");
			_this.removePreloader();
		};

		_this._requests.push(
			$.ajax({
		    	url: url,
		    	dataType: 'json',
			    success: cb
			})
		);
	},

	/**
	 * removeSiblingNodes - removes sibling nodes of the given tree node.
	 * @param  {jQuery} in_treeNode
	 * @return void
	 */
	removeSiblingNodes: function(in_treeNode){
		
		var parentNode = in_treeNode.parent('.tree').parent('.tree-node');
		if(parentNode.hasClass("tree-node")){
			//console.log("removing siblings...");
			var childNodes = parentNode.find(".tree-node");
			childNodes.each(function(index, element){
				//comparing dom elements
				if($(element)[0] !== in_treeNode[0]){
					//$(element).toggle(200);
					$(element).remove();
				}

			});
		}
	},

	/**
	 * removeChildNode - removes child node of the given tree node.
	 * @param  {jQuery} in_treeNode 
	 * @return void
	 */
	removeChildNode: function(in_treeNode){
		in_treeNode.children('ul.tree').remove();
	},

	/**
	 * expandNode - expands the given tree node.
	 * @param  {jQuery} in_treeNode [description]
	 * @return void
	 */
	expandNode: function(in_treeNode, in_searchObj){
		var searchObj = in_searchObj;
		console.log("expanding node");

		console.log(in_treeNode.data('collection'));
		
		var _this = this;

		if(_this._fullTree == false){
			// remove siblings
			_this.removeSiblingNodes(in_treeNode);
			
			// remove child
			_this.removeChildNode(in_treeNode);

			// update icons
			_this.updateIcons(in_treeNode);
			
		}
		
		// if cache is enabled
		/////////////////////////////////// 
		var ul_el = in_treeNode.children("ul");

		if(ul_el.hasClass("tree")){
			this.toggleExpand(in_treeNode);
			return;
		}
		///////////////////////////////////

		switch(in_treeNode.data('collection')['type']){
			// root click
			case 'root':
				var catalogs = this.catalogDataSource(searchObj);
				//console.log("clicking on root for the first time.");
				if(catalogs.length>0){
					this.addChildNodes(in_treeNode, catalogs);
					this.toggleExpand(in_treeNode);

					if(searchObj){
						var childNode = in_treeNode.find("li.tree-node").first();
						this.expandNode(childNode, searchObj);	
					}
				}

				break;

			// catalog click
			case 'catalog':
				var searchTypes = this.searchTypeDataSource(in_treeNode.data("collection")['value'], searchObj);
				//console.log("clicking on catalog for the first time..");
				//console.log("searchTypes length: "+ searchTypes.length);
				if(searchTypes.length>0){
					this.addChildNodes(in_treeNode, searchTypes);
					this.toggleExpand(in_treeNode);

					if(searchObj){
						var childNode = in_treeNode.find("li.tree-node").first();
						this.expandNode(childNode, searchObj);	
					}
				}

				break;

			// search type click
			case 'search':
				//console.log("clicking on searchtype for the first time..");
				this.fetchSubCategories(in_treeNode, function(subCats){
					var subcategories = _this.subCatDataSource(in_treeNode, subCats, searchObj);

					if(subcategories.length>0){
						_this.addChildNodes(in_treeNode, subcategories);
						_this.toggleExpand(in_treeNode);

						if(searchObj){
							var childNode = in_treeNode.find("li.tree-node").first();
							_this.expandNode(childNode, searchObj);	
						}
					}
				});
				break;
			
			// sub category click
			case 'subCategory':
				//console.log("clicking on subcategory for the first time..");
				this.fetchSubCategories(in_treeNode, function(subCats){
					var subcategories = _this.subCatDataSource(in_treeNode, subCats, searchObj);

					if(subcategories.length>0){
						_this.addChildNodes(in_treeNode, subcategories);
						_this.toggleExpand(in_treeNode);


						if(searchObj){
							var childNode = in_treeNode.find("li.tree-node").first();
							_this.expandNode(childNode, searchObj);	
						}
					}
						
				});
				break;

			// last category click
			case 'lastCategory':
				//console.log("clicking on last category for the first time..");
				this.fetchSkus(in_treeNode, searchObj);
				break;
			
		}
	},


	/**
	 * updateIcons - update icons of the given tree node.
	 * @param  {jQuery} in_treeNode
	 * @return void
	 */
	updateIcons: function(in_treeNode){
		var parentNodes = in_treeNode.parents("li.tree-node");
		//console.log("parent icons length: " + parentNodes.length);
		//console.log(parentNodes);

		$(in_treeNode).children("a.tree-toggler").removeClass("nav-header").addClass("nav-header");
		$(in_treeNode).children("a.tree-toggler").children(".pre-icon").removeClass("icon glyphicon glyphicon-chevron-left");//.addClass("icon glyphicon");

		parentNodes.each(function(index, element){
			$(element).children("a.tree-toggler").children(".pre-icon").removeClass("icon glyphicon glyphicon-chevron-left").addClass("icon glyphicon glyphicon-chevron-left");
		});

	},

	/**
	 * collapseNode - collapses the given tree node.
	 * @param  {jQuery} in_treeNode
	 * @return void
	 */
	collapseNode: function(in_treeNode){
		//console.log("collapsing node");
		if(this._useCache == false){
			this.removeChildNode(in_treeNode);
		}

		this.toggleExpand(in_treeNode);
	},

	/**
	 * toggleExpand
	 * @param  {jQuery} in_treeNode
	 * @return void
	 */
	toggleExpand: function(in_treeNode){
		
		if(this._fullTree){
			var a_el = in_treeNode.children('a.tree-toggler');
			var span_el = a_el.children('span.glyphicon');
			//if(toggle !== false){
			span_el.toggleClass(this._collapseIcon+' '+this._expandIcon);
			//}
		}
		in_treeNode.toggleClass('collapsed expanded');
		in_treeNode.children('ul.tree').toggle(200);
	},
	
	/**
	 * clickHandler
	 * @param  event 
	 * @return void
	 */
	clickHandler: function(event){
		console.log("clickHandler");
		//console.log(searchObj);
		event.preventDefault();
		var target = $(event.target);
		//console.log("target");
		//console.log(target);
		
		if(target.hasClass("tree-toggler") || target.hasClass("icon") || target.hasClass("node-label")){
			//var a_el = target.hasClass("expand-icon")? target.parent() : target;
			var a_el = target.hasClass("tree-toggler")? target : target.parent();
			var treeNode = $(a_el).parent();
			var span_el = $(a_el).children('span.glyphicon');
			//console.log(treeNode.data('collection'));

			//remove container when a node is clicked
			this.removeProductContainer();
			//var container = this._parent.children(".productContainer");
			//container.remove();
			
			if(treeNode.hasClass("collapsed")){//expand
				
				this.expandNode(treeNode);
				
			}
			else{ //collapse
				
				if(this._fullTree == false){
					this.expandNode(treeNode);
				}
				else{
					this.collapseNode(treeNode);
				}
			}
			
		}
	},

	/**
	 * getFilters - get filter of the given tree node and it's parent nodes to build a query string.
	 * @param  {jQuery} in_treeNode
	 * @return {array} filters
	 */
	getFilters: function(in_treeNode){
		//console.log("getting filters...");
		
		var filters=[];
		
		if(in_treeNode.data('collection')){
			if(in_treeNode.data('collection')['isFilterable']){
				//console.log('&'+element.data('collection')['key']+"="+element.data('collection')['value']);
				for(var i=0, keys=in_treeNode.data('collection')['filterables'].keys, values=in_treeNode.data('collection')['filterables'].values, len=keys.length; i<len; i++){

					filters.push({key:keys[i], value:values[i]});

				}
			}
		}
		
		var parentNodes = in_treeNode.parents("li.tree-node");
		
		for(var i=0, len=parentNodes.length; i<len; i++){
			
			var treeNode = $(parentNodes[i]);
			if(treeNode.data('collection')){	
				if(treeNode.data('collection')['isFilterable']){
					for(var j=0, keys=treeNode.data('collection')['filterables'].keys, values=treeNode.data('collection')['filterables'].values, len2=keys.length; j<len2; j++){
						filters.push({key:keys[j], value:values[j]});
					}	
				}
			}	
		}
		
		//console.log('filters: ');
		//console.log(filters);
		return filters;
	},
	
	/**
	 * addChildNodes - add child nodes(generated using in_data) to the given tree node/element
	 * @param {jQuery} in_element 
	 * @param {array} in_data    
	 */
	addChildNodes: function(in_element, in_data){
		var element=in_element, data=in_data;

		if(element.hasClass("treeview")){
			element.append('<ul class="nav nav-list tree" ></ul>');
			element = element.children('ul.tree');
		}
		else{
			element.append('<ul class="nav nav-list tree" style="display: none;"></ul>');
			element = element.children('ul.tree');
		}
		
		for(var i=0, len=data.length; i<len; i++){
			
			if(data[i].hasChildNodes){
				var treeNode = document.createElement("li");
				$(treeNode).addClass("tree-node collapsed");
				$(treeNode).data("collection", data[i]);
				
				if(!this._fullTree){
					$(treeNode).append(
						'<a href="" class="tree-toggler"><span class="pre-icon"></span><span class="node-label">'+data[i].label+'</span></a>'
					);
				}
				else{
					$(treeNode).append(
						'<a href="" class="tree-toggler nav-header"><span class="icon expand-icon glyphicon '+this._collapseIcon+'"></span><span class="node-label">'+data[i].label+'</span></a>'
					);
				}
				
				element.append(treeNode);
			}
			else{
				var treeNode = document.createElement("li");
				$(treeNode).addClass("tree-node collapsed");
				$(treeNode).data("collection", data[i]);
				$(treeNode).append(
					/*'<a href="#">'+data[i].label+'</a>'*/
					'<a href="" class="tree-toggler"><span class="pre-icon"></span><span class="node-label">'+data[i].label+'</span></a>'
				);
				
				element.append(treeNode);
			}
		}
	},

	/**
	 * fetchSubCategories - fetches sub categories of the given tree node.
	 * @param  {jQuery}   in_treeNode 
	 * @param  {Function} callback    
	 * @return void
	 */
	fetchSubCategories: function(in_treeNode, callback){

		var _this = this, node=in_treeNode;

		_this._requests = [];

		console.log("fetchSubCategories - displayPreloader");
		_this.displayPreloader();

		if(node.data('collection')['type'] === "search"){
			var index = 0;
		}
		else{
			var index = parseInt(node.data('collection')['index']+1);
		}

		var filters = this.getFilters(node),
		searchType = node.data('collection')['value'], 
		systemId = node.data('collection')['systemId']; 

		var catalogObj = this.getCatalogObjectById(systemId);
		var tableColumns = [];

		if(searchType === 'manufacture'){
			tableColumns = catalogObj.MfgIn[index].split("~");
			
		}
		else if(searchType === 'catalog'){
			tableColumns = catalogObj.CatalogIn[index].split("~");
			
		}
		else if(searchType === 'product'){
			tableColumns = catalogObj.ProdIn[index].split("~");
			
		}

		if(tableColumns.length>0){

			var postVariablesStr = '&ClientId='+av._ClientId+'&DealerId='+av._DealerId;
			for(var i = 0; i<tableColumns.length; i++){
				postVariablesStr += "&"+"tableColumn_"+i+"="+tableColumns[i];
			}
			for(var i = 0; i<filters.length; i++){
				postVariablesStr += "&"+filters[i].key+"="+filters[i].value;
			}

			var ShownInSectionID = 1;
			if(_this._mode == av.MODE.CONFIG){
				//var floorObj = av._planner.getObjectByGuid(av._planner._selectedObject);
				var floorObj = av._planner.getObjectByGuid(av.config.selectedObject);
				postVariablesStr += "&SkuAV="+floorObj._data.AccBelow.replace(/~/g,",");

				ShownInSectionID = 2;
			}

			//console.log(postVariablesStr);

			var url = "url.php?generate=options_json&ShownInSectionID="+ShownInSectionID+postVariablesStr;
			var cb = function(result){
				
				//var subcategories = result;

				//console.log("****subcats****");
				//console.log(result);
				//
				console.log("fetchSubCategories - removePreloader");
				_this.removePreloader();

				if (typeof callback == 'function') { 

					callback(result);
				}

				
			};

			_this._requests.push(
				$.ajax({
			    	url: url,
			    	dataType: 'json',
				    success: cb
				})
			);
		}

	},

	/**
	 * fetchSkus - fetches skus for the given tree node.
	 * @param  {jQuery} in_treeNode 
	 * @return void
	 */
	fetchSkus: function(in_treeNode, in_searchObj){
		console.log("fetching skus");
		var _this = this, node=in_treeNode, searchObj=in_searchObj;

		_this._requests = [];

		console.log("fetchSkus - displayPreloader");
		_this.displayPreloader();

		var filters = this.getFilters(node);

		var tableColumns = ["SkuId"];

		if(tableColumns.length>0){

			var columns = ''; 
			var queryStr = '&ClientId='+av._ClientId+'&DealerId='+av._DealerId;
			

			var postVariablesStr = '&ClientId='+av._ClientId+'&DealerId='+av._DealerId;
			for(var i = 0; i<tableColumns.length; i++){
				columns += "&"+"tableColumn_"+i+"="+tableColumns[i];
				//postVariablesStr += "&"+"tableColumn_"+i+"="+tableColumns[i];
			}
			for(var i = 0; i<filters.length; i++){
				queryStr += "&"+filters[i].key+"="+filters[i].value;
				//postVariablesStr += "&"+filters[i].key+"="+filters[i].value;
			}

			if(searchObj){
				queryStr += "&SkuAV="+searchObj.SkuAV;
			}
			else{
				if(_this._mode == av.MODE.CONFIG){
					//var floorObj = av._planner.getObjectByGuid(av._planner._selectedObject);
					var floorObj = av._planner.getObjectByGuid(av.config.selectedObject);
				    queryStr += "&SkuAV="+floorObj._data.AccBelow.replace(/~/g,",");
				}
			}

			//console.log(postVariablesStr);
			var ShownInSectionID = 1;
			if(_this._mode == av.MODE.CONFIG){
				//var floorObj = av._planner.getObjectByGuid(av._planner._selectedObject);
				//postVariablesStr += "&SkuAV="+floorObj._data.AccBelow.replace(/~/g,",");

				ShownInSectionID = 2;
			}

			var url = "url.php?generate=skus_json&ShownInSectionID="+ShownInSectionID+columns+queryStr;
			var cb = function(result){
				
				var skus = result;

				//console.log("****skus****");
				//console.log(skus);

				_this.loadPartsTray(skus, queryStr);

			};

			_this._requests.push(
				$.ajax({
			    	url: url,
			    	dataType: 'json',
				    success: cb
				})
			);
		}

	},

	/**
	 * loadPartsTray - loads part-tray/product-container
	 * @param  {Array} in_skus 
	 * @param  {String} in_queryStr
	 * @return void
	 */
	loadPartsTray: function(in_skus, in_queryStr){

		var _this = this, skus=in_skus, queryStr=in_queryStr;
		var ShownInSectionID = 1;

		var skusCounter = 0;
		var skusTotal = skus.length;

		_this._requests = [];

		if (skusTotal == 0){
			_this.removePreloader();
			return;
		}

		
		if(_this._mode == av.MODE.CONFIG){
			ShownInSectionID = 2;
		}

		var products=[];

		for(var i=0; i<skusTotal; i++){
			var sku = skus[i];

			var url = "url.php?generate=partsTray_json&SkuId="+sku+"&ShownInSectionID="+ShownInSectionID+queryStr;

			var cb = function(result){
				//console.log("***product***");
				//console.log(result);
				
				for(var i=1, len=result.product.length; i< len; i++){
					products.push(result.product[i]);
				}

				skusCounter++;

				//console.log("log_skuCounter:" + skusCounter);
				//console.log("log_skusTotal:" + skusTotal);

				if(skusCounter === skusTotal){

					console.log("loadPartsTray - removePreloader");
					_this.removePreloader();

					console.log('array of products:');
					console.log(products);

					//sort products by sku
					products.sort(function (a, b) {
						var val1 = a.SkuAV.toLowerCase()
						var val2 = b.SkuAV.toLowerCase();
						if (val1 > val2) {
							return 1;
						}
						if (val1 < val2) {
							return -1;
						}
						// a must be equal to b
						return 0;
					});

					var cat = _this.getCatalogObjectById(products[0].SystemId);
					if(cat.PartsTraySortBy === 'name'){
						//sort products by skuName
						products.sort(function (a, b) {
							var val1 = a.SkuName.toLowerCase()
							var val2 = b.SkuName.toLowerCase();
							if (val1 > val2) {
								return 1;
							}
							if (val1 < val2) {
								return -1;
							}
							// a must be equal to b
							return 0;
						});
					}


					_this._parent.appendProductContainer(_this._mode, products);
				}
			}

			_this._requests.push(
				$.ajax({
			    	url: url,
			    	dataType: 'json',
				    success: cb
				})
			);
		}

	},

	/**
	 * subCatDataSource - return data source array for the given tree node.
	 * @param  {jQuery} in_treeNode 
	 * @param  {array}  in_subCats  - json array obtained in fetchSubCategories();
	 * @return array
	 */
	subCatDataSource: function(in_treeNode, in_subCats, in_searchObj){
		var searchObj = in_searchObj;
		console.log("getting sub categories..");
		console.log(in_searchObj);

		var _this = this, node=in_treeNode, subCats=in_subCats;

		if(node.data('collection')['type'] === "search"){
			var index = 0;
		}
		else{
			var index = parseInt(node.data('collection')['index']+1);
		}

		searchType = node.data('collection')['value'], 
		systemId = node.data('collection')['systemId'];

		var catalogObj = this.getCatalogObjectById(systemId);
		var tableColumns = [], subCatCount = 0;

		if(searchType === 'manufacture'){
			tableColumns = catalogObj.MfgIn[index].split("~");
			subCatCount = catalogObj.MfgIn.length;
		}
		else if(searchType === 'catalog'){
			tableColumns = catalogObj.CatalogIn[index].split("~");
			subCatCount = catalogObj.CatalogIn.length;
		}
		else if(searchType === 'product'){
			tableColumns = catalogObj.ProdIn[index].split("~");
			subCatCount = catalogObj.ProdIn.length;
		}


		var subcategories=[];

		for(var i=0, len=subCats.length; i<len; i++){
			var filterables = {keys:[], values:[]};
			var label = '';
			var searchLabel = '';

			for(var j=0, len2=tableColumns.length; j<len2; j++){
				//console.log("whole");
				if(j%2 == 0){
					//console.log("even");
					filterables.keys.push(tableColumns[j]);
					filterables.values.push(subCats[i][tableColumns[j]]);
				}
				else{
					//console.log("odd");
					label += "/"+subCats[i][tableColumns[j]];
					if(searchObj){
						searchLabel += 	"/"+searchObj[tableColumns[j]];
					}
					 
				}
			}

			//console.log("label: " + label);
			//console.log("searchLabel" + searchLabel);

			if(searchObj){
				if(label != searchLabel) continue;
			}

			//console.log(filterables);
			//console.log("label:" + label.substring(1));

			if(index == (subCatCount-1))
				subcategories.push({
					label:label.substring(1), 
					type:"lastCategory", 
					hasChildNodes:false, 
					isFilterable:true, 
					index:index, 
					value:searchType, 
					filterables:filterables, 
					systemId:systemId
				});
			else
				subcategories.push({
					label:label.substring(1), 
					type:"subCategory", 
					hasChildNodes:true, 
					isFilterable:true, 
					index:index, 
					value:searchType, 
					filterables:filterables, 
					systemId:systemId
				});

		}

		subcategories.sort(function (a, b) {
			var val1 = a.label.toLowerCase()
			var val2 = b.label.toLowerCase();
			if (val1 > val2) {
				return 1;
			}
			if (val1 < val2) {
				return -1;
			}
			// a must be equal to b
			return 0;
		});


		//console.log("****subcats2****");
		//console.log(subcategories);


		return subcategories;
	},

	
	/**
	 * catalogDataSource - returns data catalog source array
	 * @return {array}
	 */
	catalogDataSource: function(in_searchObj){
		//console.log("catalogDataSource");
		//console.log(in_searchObj);
		var catalogs=[], searchObj=in_searchObj;
		
		for(var i=0, len=this._catalogs.length; i<len; i++){
			
			// ignore other systems if search is done
			
			if(searchObj){
				//console.log('I am ');
				if(searchObj.SystemId != this._catalogs[i].SystemId) continue;
			}
			

			catalogs.push({
				label:this._catalogs[i].SystemName, 
				type:"catalog", 
				hasChildNodes:true, 
				isFilterable:true,
				value:this._catalogs[i].SystemId, 
				filterables:{
					keys:["SystemId"], 
					values:[this._catalogs[i].SystemId]
				},
				systemId:this._catalogs[i].SystemId
			});
		}
		
		return catalogs;
	}, 
	
	/**
	 * searchTypeDataSource - returns search-type data source array for the given SystemId
	 * @param  {int} in_systemId 
	 * @return {array}
	 */
	searchTypeDataSource: function(in_systemId, in_searchObj){
		var searchTypes=[], id=in_systemId, searchObj=in_searchObj;
		
		var catalogObj = this.getCatalogObjectById(id);

		if(catalogObj.MfgInLabel.length>0){
			searchTypes.push({
				label:"Manufacturer Index-Collection Search", 
				type:"search", 
				hasChildNodes:true, 
				isFilterable:false,
				value:"manufacture",
				filterables:{}, 
				systemId:id
			});
		}

		//searching skus uses only manufacture search Type
		if(searchObj){
			return searchTypes;
		}


		if(catalogObj.CatalogInLabel.length>0){
			searchTypes.push({
				label:"Product Index-Table of Contents", 
				type:"search", 
				hasChildNodes:true, 
				isFilterable:false, key:"", 
				value:"catalog",
				filterables:{}, 
				systemId:id
			});
		}
		if(catalogObj.ProdInLabel.length>0){
			searchTypes.push({
				label:"Product Category Search", 
				type:"search", 
				hasChildNodes:true, 
				isFilterable:false, 
				value:"product", 
				filterables:{},
				systemId:id
			});
		}
			
	
		return searchTypes;
	},
	
	/**
	 * getCatalogObjectById - returns catalog object via it's id
	 * @param  {int} in_systemId 
	 * @return {object}
	 */
	getCatalogObjectById: function(in_systemId){
		for(var i=0, len=this._catalogs.length; i<len; i++){
			//console.log(this._catalogs[i].SystemId);
			
			if(in_systemId == this._catalogs[i].SystemId){
				
				return this._catalogs[i];
			}
		
		}
		
		return {};
	},

	/**
	 * displayPreloader - displays preloader
	 * @return void
	 */
	displayPreloader: function(){
		console.log("displaying preloader.");
		//return;
		//var d =  document.createElement('div');
		
		$(document.body).append("<div id='treePreloader' class='fa fa-spinner fa-5x fa-spin'></div>");
		
		$('#treePreloader').css({
			position:  'absolute',
			top:       $('#leftPanel').position().top,
			left:      $('#leftPanel').position().left,
			width:     $('#leftPanel').width(),
			height:     $('#leftPanel').height(),
			'z-index':  100,
			background: '#E8E8E8',
			opacity: .4

			
		});
		
		var spinner = new Spinner().spin()
		$('#treePreloader').append(spinner.el);
	},

	/**
	 * removePreloader - removes preloader
	 * @return void
	 */
	removePreloader: function(){
		console.log("removing preloader..");
		$('#treePreloader').remove();
	},

	/**
	 * removeProductContainer - removes product container
	 * @return void
	 */
	removeProductContainer: function(){
		//var container = $.data(this._parent,"productContainer");
		var container = (this._mode == av.MODE.CONFIG) ? this._parent.data("config_productContainer") : this._parent.data("productContainer");
		console.log("container is: ");
		console.log(container);

		try{
			//console.log("cont_before destroy");
			//console.log(container);
			container._destroy();
			container = null;
			delete container;
			//console.log("cont_after destroy");
			//console.log(container);
		}
		catch(e){
			// error 
		}
	},

	search: function(in_sku){

		// sample object
		//var searchObj = {"SkuId":1883,"SkuAV":"ALE VALENCIA LS001LH_2","SystemId":15,"SystemName":"Essendant Furniture Solutions","MfgIn":"MfgId~MfgName,SeriesName~SeriesName","MfgInLabel":"Select Manufacturer,Select Product Series","MainCatID":13,"MainCatName":"Typicals","SubCatColumnId":null,"SubCatColumnName":null,"SubCatId":47,"SubCatName":"L-Shape","ParentGroupId":116,"PGName":"Typicals","GroupId":580,"GroupName":"L Shaped","SeriesId":1234,"SeriesName":"Valencia Series Typicals","MfgId":1259,"MfgCode":"ALE","MfgName":"Alera","ShownInSectionID":1,"ShownInSectionName":"planner"};
	
		var _this = this;

		_this._requests = [];

		//remove product container
		_this.removeProductContainer();
		//var container = _this._parent.children(".productContainer");
		//container.remove();

		// expand rood node
		var rootNode = _this._element.find("li.tree-node").first();
		_this.expandNode(rootNode); 

		_this.displayPreloader();

		var tableColumns = [];
		tableColumns.push("SkuId");
		tableColumns.push("SkuAV");
		tableColumns.push("SystemId");
		tableColumns.push("SystemName");
		tableColumns.push("MfgIn");
		tableColumns.push("MfgInLabel");
		tableColumns.push("MainCatID");
		tableColumns.push("MainCatName");
		tableColumns.push("SubCatColumnId");
		tableColumns.push("SubCatColumnName");
		tableColumns.push("SubCatId");
		tableColumns.push("SubCatName");
		tableColumns.push("ParentGroupId");
		tableColumns.push("PGName");
		tableColumns.push("GroupId");
		tableColumns.push("GroupName");
		tableColumns.push("SeriesId");
		tableColumns.push("SeriesName");
		tableColumns.push("MfgId");
		tableColumns.push("MfgCode");
		tableColumns.push("MfgName");
		tableColumns.push("ShownInSectionID");
		tableColumns.push("ShownInSectionName");

		// processing sku
		/////////////////////////////////////
		sku = escape(in_sku);

		var skuStr = sku.split("_");
		var skuSearchStr = sku;
		
		if(skuStr.length > 1){
			if(skuStr.length == 2){
				str1 = skuStr[0] + "^" + skuStr[1];
				
				if(str1.indexOf("-") != -1){
					str1 += "," + str1.replace("-","");
				}
				
				str2 = skuStr[0] + "_" + skuStr[1];
				
				if(str2.indexOf("-") != -1){
					str2 += "," + str2.replace("-","");
				}
				
				skuSearchStr = str1 + "," + str2;
			}
		}
		else{
			if(sku.indexOf("-") != -1){
				skuSearchStr = sku + "," + sku.replace("-","");
			}
		}
		/////////////////////////////////////

		var columns = ''; 
		var queryStr = '&SkuAV='+skuSearchStr+'&DealerId='+av._DealerId;

		for(var i = 0; i<tableColumns.length; i++){
			columns += "&"+"tableColumn_"+i+"="+tableColumns[i];
		}

		var url = "url.php?generate=options_json&ShownInSectionID=1,2,3"+columns+queryStr;

		console.log(url);

		var cb = function(result){
			
			_this.removePreloader();
				
			var data = result;

			console.log(data);

			if(data.length> 0){
				//console.log(data[0]);

				var searchObj = data[0];
				
				//remove product container
				_this.removeProductContainer();
				//var container = _this._parent.children(".productContainer");
				//container.remove();

				// expand rood node
				var rootNode = _this._element.find("li.tree-node").first();
				_this.expandNode(rootNode, searchObj);
			}

		};

		_this._requests.push(
			$.ajax({
		    	url: url,
		    	dataType: 'json',
			    success: cb
			})
		);

		
	},

	ptcIds: function(){
		var ptcIds = [];

		$(this._catalogs).each(function(index, element){
			if(element.PTCId) ptcIds.push(element.PTCId);
		});

		return ptcIds;
	},

	abortRequests: function(){
		this.removePreloader();
		for(var i=0; i<this._requests.length; i++){
			try{
				this._requests[i].abort();
			}
			catch(e){

			}
		}
	},
};

/**
 * plugin registration
 * to use and access treeview
 * eg. var el = $(element).appendTreeview();
 * el.data('treeview') 
 */
(function ($, window, document, undefined) {
	
	'use strict';
	
	var pluginName = 'appendTreeview';
	
	$.fn[pluginName] = function (in_mode) {
		
		var instanceName = (in_mode == av.MODE.CONFIG) ? "config_treeview" : "treeview";

		this.data(instanceName, new av.tree(in_mode, this));

		return this;

	};
	
	
})(jQuery, window, document);