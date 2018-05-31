
var bucketsVisible = false;
var hubsVisible = false;

var serviceUrl = 'http://bucs4bu0930.ads.autodesk.com:3000';

$(document).ready(function(){
    var bucketsSection = $('.data-storage');
	var buckClickSection = bucketsSection.find('.section-header');
	var buckToggleSection = bucketsSection.find('.content');
	buckClickSection.on('click', function(){
		if(bucketsVisible){
			bucketsVisible = false;
			buckToggleSection.slideToggle();
		}
		else{
			bucketsVisible = true;
			buckToggleSection.slideToggle();
			getBuckets();
		}
	});
	
	var hubsSection = $('.hubs');
	var hubsClickSection = hubsSection.find('.section-header');
	var hubsToggleSection = hubsSection.find('.content');
	hubsClickSection.on('click', function(){
		if(hubsVisible){
			hubsVisible = false;
			hubsToggleSection.slideToggle();
		}
		else{
			hubsVisible = true;
			hubsToggleSection.slideToggle();
			getHubs();
		}
	});
	
	initTree();
	
	$('#new-bucket-add').on('click', function(){
		addBucket();
	});

    $('#new-bucket-item-add').on('click', function(){
		uploadFile();
	});
	
	buildServerRequest('get', 'getAuthUserName', null,
		function (response, resObj){
			$('.login-name').text('Authenticated as: ' + resObj.name);
			
			buildServerRequest('get', 'getViewerToken', null,
				function (response, resObj){
					initViewer(resObj.token);
				},
				function (error){
					reportError('getViewerToken - errorCode:' + error);
				}
			);
		},
		function (error){
			$('.login-name').text('Authenticated as: anonymous');
		}
	);
	
	/* Mihai: this does not work because of CORS
	$('#login').on('click', function(){
		login();
	});*/
	
});

/* Mihai: this does not work because of CORS
var login = function(){
	buildServerRequest(
				'get',
				'login',
				'',
				function(response, resObj){
					if(null != resObj){
						if('body' in resObj){
							var urn = 'urn:' + resObj.body.urn;
							//var urn = resObj.body.derivatives[0].children[0].urn;
							
							Autodesk.Viewing.Document.load(urn, onDocumentLoadSuccess, onDocumentLoadFailure);
						}
					}
				},
				function(error){
					reportError('failed to login: ' + error.statusMessage);
				},
				false);
}*/

var initTree = function(){
	var tree = $('#jstree');
	tree.jstree({
							'core' : {
								'check_callback': true,
								'data' : {
									'url' : function (node) {
									return 'ajax_roots.json';
									},
									'data' : function (node) {}
								}},
							'search' : {
								'fuzzy' : false,
								'show_only_matches': true,
								'close_opened_onclear' : true
							},
							//'plugins' : ["types"],
							//'types' : {
							//	"folder":{
							//		"icon" : "jstree-folder"
							//	},
							//	"file":{
							//		"icon" : "jstree-file"
							//	}
							//}
						});
	
	//
	// trigger recursive building of tree 
	tree.on("create_node.jstree", function (e, data){
		
		if(null != data.node)
		{
			var nodeType = '';
			var nodeText = data.node.text;
			var extId = '';
			var extParentId = '';
			if(null != data.node.original){
				extId = data.node.original.ext_id;
				extParentId = data.node.original.ext_parent_id;
				nodeType = data.node.original.type;
			}
			
			if(nodeType.startsWith('project')){
				// this is a project node, get folders
				getProjectContents(data.node, extId);
			}
			else if(nodeType.startsWith('folder')){
				// this is a folder node, get items
				
				//
				// I need the project Id, and folder Id
				getFolderContents(data.node, extParentId, extId);
			}
		}
	});	
	
	//
	// trigger LMV display when file selected
	tree.on("select_node.jstree", function(e, data){
		
		//
		// get viewable doc id from server
		if(null != data.node.original){
			extParentId = data.node.original.ext_parent_id;
			extId = data.node.original.ext_id;
			
			buildServerRequest(
				'get',
				'getViewableTipVersion',
				"projId="+extParentId + "&" + "itemId="+extId,
				function(response, resObj){
					if(null != resObj){
						if('body' in resObj){
							var urn = 'urn:' + resObj.body.urn;
							//var urn = resObj.body.derivatives[0].children[0].urn;
							
							Autodesk.Viewing.Document.load(urn, onDocumentLoadSuccess, onDocumentLoadFailure);
						}
					}
				},
				function(error){
					reportError('failed to get viewable: ' + error.statusMessage);
				});
		};
	});
}


var emptyTree = function(){
	
	var myTree = $("#jstree");
	myTree.jstree("destroy");
	initTree();
	
	//$("#jstree .jstree-leaf, .jstree-anchor").each(function(){
    //        myTree.delete_node($(this).attr('id'));
    //    });
}
/////////////////////////////////////////////////////////////////////////////////////////////
// utilities
//////////////////////////////////////////////////////////////////////////////////////////////
var buildServerRequest = function(callType, endPoint, params, fcSucceed, fcFail, bContentType){
	var xhr = new XMLHttpRequest();
	if ("withCredentials" in xhr){
    // Check if the XMLHttpRequest object has a "withCredentials" property.
    // "withCredentials" only exists on XMLHTTPRequest2 objects.

		var url = serviceUrl + '/' + endPoint;

		if('get' == callType){
			if(null != params){
				url = url + '?' + params;
			}
		}

        xhr.open(callType, url, true);
        if((bContentType == null) || (bContentType == true)) // by default set content type
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

		xhr.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8");
		//xhr.setRequestHeader("Upgrade-Insecure-Requests", "1");
		//xhr.setRequestHeader("ORIGIN", "*");
		//xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
			
		xhr.onload = function(){
			var response = xhr.responseText;

			if(xhr.status == 200){
				var resObj = null;
				if(null != response && response.length > 0){
					var resObj = JSON.parse(response);
				}
				fcSucceed(response, resObj);
			}
			else
				fcFail(xhr.responseText);
		};
		xhr.onerror = function(){
			fcFail(xhr.responseText);
		};

		if('post' == callType)
			xhr.send(params);
		else
			xhr.send();
	}
	else {
		reportError('cannot use XMLHttpRequest');
	}
}
var reportError = function(error){
	$(".error-info").find("h4").text(error);
	$(".error-info").css('display', 'block');
}
var clearError = function(error){
	$(".error-info").css('display', 'none');
}


/////////////////////////////////////////////////////////////////////////////////////////////
// buckets
//////////////////////////////////////////////////////////////////////////////////////////////
var addBucketsRows = function(table, buckets){

	if(null != buckets)
	{
		var nLength = buckets.length;
		for(var i=0; i<nLength; i++)
		{
			var bucket = buckets[i];
			var newRow = document.createElement('tr');
			var cell0 = newRow.insertCell(0);
			cell0.innerHTML = 'del';
			$(cell0).addClass('delete');
			$(cell0).addClass('button');

			var cell1 = newRow.insertCell(1);
			cell1.innerHTML = bucket.bucketKey;
			$(cell1).addClass('name');

			var date = bucket.createdDate;
			var cell2 = newRow.insertCell(2);
			cell2.innerHTML = (new Date(date)).toString();

			table.append(newRow);
		}

		//
		// add delete row reactor
		table.find('.delete').on('click', eraseBucket);

		//
		// add bucket click reactor
		table.find('.name').on('click', function(){
			var bucketName = currBucketName = $(this).text();

			displayBucketContent(bucketName);

			//
			// also update the text of the contents section:
			var header = $(this).closest(".content").find(".section-header");
			var text = header.text();
			header.text('bucket contents (' + bucketName + '): ');
		});
	}
};

var getBuckets = function(){
	var table = $('#table-buckets');
	table.find('tbody').find('tr').remove();

	buildServerRequest(
		'get',
		'getBuckets',
		null,
		function(response, resObj){
			if(null != resObj)
			{
				if(('body' in resObj) && ('items' in resObj.body))
				{
					var buckets = resObj.body.items;
					addBucketsRows(table, buckets);
				}
			}
		},
		function(error){
			reportError('failed to get buckets: '+ error.statusMessage);
		});
};
var addBucket = function(){

	var newBucketName = $('#new-bucket-name').val();
	if((null != newBucketName) && (newBucketName.length > 0)){

		buildServerRequest('post', 'addBucket', "name="+newBucketName, getBuckets, function (error) { reportError('failed to add bucket: ' + error.statusMessage);});
	}
}
var eraseBucket = function(){
	var bucketName = $(this).closest('tr').find('.name').text();

	buildServerRequest(
		'post',
		'delBucket',
		"name="+bucketName,
		getBuckets,
		function (error) { reportError('failed to erase bucket: ' + error.statusMessage);}
	);
};

/////////////////////////////////////////////////////////////////////////////////////////////
// bucket content
//////////////////////////////////////////////////////////////////////////////////////////////
var currBucketName;
var addBucketsItemsRows = function(table, items){

	if(null != items){
		var nLength = items.length;
		for(var i=0; i<nLength; i++){
			var item = items[i];
			var newRow = document.createElement('tr');
			var cell0 = newRow.insertCell(0);
			cell0.innerHTML = 'del';
			$(cell0).addClass('delete');
			$(cell0).addClass('button');

			var cell1 = newRow.insertCell(1);
			cell1.innerHTML = item.objectKey;
			$(cell1).addClass('name');

			var cell2 = newRow.insertCell(2);
			cell2.innerHTML = item.size;

			table.append(newRow);
		}

        //
		// add delete row reactor
		table.find('.delete').on('click', eraseBucketItem);
	}
};

var displayBucketContent = function(bucketName) {

	var table = $('#table-bucket-contents');
	table.find('tbody').find('tr').remove();

	buildServerRequest(
		'get',
		'getBucketContent',
		"name="+bucketName,
		function(response, resObj){
			if(null != resObj){
				if(('body' in resObj) && ('items' in resObj.body)){
					var items = resObj.body.items;
					addBucketsItemsRows(table, items);
				}
			}
		},
		function(error){
			reportError('failed to get bucket details: ' + error.statusMessage);
		});
}

var uploadFile = function() {
	var fileInput = $('#file-input');
	var files = fileInput[0].files;

	if(files.length > 0){
		var file = files[0];

        var formData = new FormData();
		formData.append("bucketName", currBucketName);
		formData.append("fileName", file.name);
		formData.append("fileData", file);

        buildServerRequest('post', 'uploadFile', formData,
            function(response, resObj){ 
                displayBucketContent(currBucketName);
            },
            function(error){
                reportError('failed to get buckets: '+ error.statusMessage);
            },
            false // do not set content type
        );
	}
}

var eraseBucketItem = function(){
	var bucketItemName = $(this).closest('tr').find('.name').text();

	buildServerRequest(
		'post',
		'delBucketItem',
        "bucketname=" + window.encodeURIComponent(currBucketName) + "&" + "name=" + bucketItemName,
        function(response, resObj) {displayBucketContent(currBucketName);},
		function (error) { reportError('failed to erase bucket item: ' + error.statusMessage);}
	);
};


/////////////////////////////////////////////////////////////////////////////////////////////
// hubs
//////////////////////////////////////////////////////////////////////////////////////////////
var getHubs = function(){
	var table = $('#table-hubs');
	table.find('tbody').find('tr').remove();

	buildServerRequest(
		'get',
		'getHubs',
		null,
		function(response, resObj){
			if(null != resObj)
			{
				if(('body' in resObj) && ('data' in resObj.body))
				{
					var hubs = resObj.body.data;
					addHubsRows(table, hubs);
				}
			}
		},
		function(error){
			reportError('failed to get hubs: '+ error.statusMessage);
		});
}
var currHubName;
var addHubsRows = function(table, hubs){

	if(null != hubs)
	{
		var nLength = hubs.length;
		for(var i=0; i<nLength; i++)
		{
			var hub = hubs[i];
			var newRow = document.createElement('tr');
			
			var cell1 = newRow.insertCell(0);
			cell1.innerHTML = hub.id;
			$(cell1).addClass('hub_id');

			table.append(newRow);
		}
		
		//
		// add bucket click reactor
		table.find('.hub_id').on('click', function(){
			var hubName = currHubName = $(this).text();

			displayHubProjects(hubName);

			//
			// also update the text of the contents section:
			var header = $(this).closest(".content").find(".section-header");
			var text = header.text();
			header.text('hub projects (' + hubName + '): ');
		});
	}
}

//
// add projects (hubs contents) to tree
var displayHubProjects = function(hubId) {

	emptyTree();

	buildServerRequest(
		'get',
		'getHubProjects',
		"id="+hubId,
		function(response, resObj){
			if(null != resObj){
				if(('body' in resObj) && ('data' in resObj.body)){
					var items = resObj.body.data;
					addHubsProjectsInTree(items);
				}
			}
		},
		function(error){
			reportError('failed to get bucket details: ' + error.statusMessage);
		});
}
var addHubsProjectsInTree = function(items){

	if(null != items){
		var nLength = items.length;
		var parentNode = null;
		
		for(var i=0; i<nLength; i++){
			var item = items[i];
			
			createHubsTreeNode(parentNode, i, item.attributes.name, "project", "hub-project", item.id, null, 'last');
		}
	}
};

//
// method that creates a tree node 
// 'parent_node' is jstree parent node
// 'new_node_id' is the id of this node (unique inside it's parent)
// 'new_node_text' is display name of this node
// 'new_node_type' is this node type (project, folder, file, ...)
// 'class_name' is a custom "class" to be added to nodes in order to search them by type or something else (maybe add specific icon)
// 'ext_id' is the Forge_Id, needed for other workflows
// 'ext_parent_id' external parent id - apparently it is difficult to navigate the tree upwards, plus, Forge does not require as parent the immediate parent, but rather the "project"
// 'position' can be 'first' or 'last' or integer
function createHubsTreeNode(parent_node, new_node_id, new_node_text, new_node_type, class_name, ext_id, ext_parent_id, position) {
	var tree = $('#jstree');
	var parent = tree;
	var parentId = '';
	
	if(null != parent_node)
	{
		parent = parent_node;
		parentId = parent.id;
	}
	
	
	tree.jstree('create_node', 
				parent, { 
						"text":new_node_text, 
						"id":parentId + '_' + new_node_id, 
						"type":new_node_type,
						"ext_id":ext_id, 
						"ext_parent_id":ext_parent_id, 
						"li_attr" : { "class":class_name }}, 
				position, 
				false, 
				false);	
}


//
// add folders (projects contents) to tree
var getProjectContents = function(parentTreeNode, projId) {

	buildServerRequest(
		'get',
		'getProjectContents',
		"hubId="+currHubName + "&" + "projId="+projId,
		function(response, resObj){
			if(null != resObj){
				if(('body' in resObj) && ('data' in resObj.body)){
					var items = resObj.body.data;
					addProjectContent(parentTreeNode, projId, items);
				}
			}
		},
		function(error){
			reportError('failed to get bucket details: ' + error.statusMessage);
		});
}
var addProjectContent = function(parentTreeNode, projId, items){

	if(null != items){
		var nLength = items.length;
		
		for(var i=0; i<nLength; i++){
			var item = items[i];
			
			createHubsTreeNode(parentTreeNode, i, item.attributes.name, "folder", "hub-folder", item.id, projId, 'last');
		}
	}
	
	//$('#jstree').jstree('refresh');
};

//
// add items (folders contents) to tree
var getFolderContents = function(parentTreeNode, projId, folderId) {

	buildServerRequest(
		'get',
		'getFolderContents',
		"projId="+projId + "&" + "foldId="+folderId,
		function(response, resObj){
			if(null != resObj){
				if(('body' in resObj) && ('data' in resObj.body)){
					var items = resObj.body.data;
					addFolderContent(parentTreeNode, projId, items);
				}
			}
		},
		function(error){
			reportError('failed to get bucket details: ' + error.statusMessage);
		});
}
var addFolderContent = function(parentTreeNode, projId, items){

	if(null != items){
		var nLength = items.length;
		
		for(var i=0; i<nLength; i++){
			var item = items[i];
			
			if(item.type == 'folders')
				createHubsTreeNode(parentTreeNode, i, item.attributes.displayName, "folder", "hub-folder", item.id, projId, 'last');
			else
				createHubsTreeNode(parentTreeNode, i, item.attributes.displayName, "item", "hub-item", item.id, projId, 'last');
		}
	}
	
	//$('#jstree').jstree('refresh');
};


/////////////////////////////////////////////////////////////////////////////////////////////////////
// viewer
/////////////////////////////////////////////////////////////////////////////////////////////////////
var viewer;
var lmvDoc;
var viewables;
var indexViewable;

var initViewer = function(accToken){
	
	var options = {
		env: 'AutodeskProduction',
		accessToken: accToken
	};
	
	//var viewerElement = document.getElementById('MyViewerDiv');
	
	/*
	Autodesk.Viewing.Initializer(options,function() {
		loadDocument(viewer, null, options.document);
	});*/

	Autodesk.Viewing.Initializer(options, function onInitialized(){
		
		//var viewerElement = $('#MyViewerDiv');
		var viewerElement = document.getElementById('MyViewerDiv');
		
		viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerElement, {});
		
		//viewer.initialize(); 
		
		//Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
	});
}

var loadModel = function() {
	
	var initialViewable = viewables[indexViewable];
    var svfUrl = lmvDoc.getViewablePath(initialViewable);
    var modelOptions = {
        sharedPropertyDbPath: lmvDoc.getPropertyDbPath()
    };
    viewer.loadModel(svfUrl, modelOptions, onLoadModelSuccess, onLoadModelError);
}

/**
* Autodesk.Viewing.Document.load() success callback.
* Proceeds with model initialization.
*/
var onDocumentLoadSuccess = function(doc) {
	// A document contains references to 3D and 2D viewables.
	viewables = Autodesk.Viewing.Document.getSubItemsWithProperties(doc.getRootItem(), {'type':'geometry'}, true);
	if (viewables.length === 0) {
		console.error('Document contains no viewables.');
		return;
	}
	
	var errorCode = viewer.start();
	
	/*
	// Create Viewer instance and load model.
    var viewerDiv = document.getElementById('MyViewerDiv');
    viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerDiv);
    var errorCode = viewer.start();

    // Check for initialization errors.
    if (errorCode) {
        console.error('viewer.start() error - errorCode:' + errorCode);
        return;
    }*/

	// Choose any of the available viewables.
    indexViewable = 0;
    lmvDoc = doc;

    // Everything is set up, load the model.
    loadModel();
}

/**
 * Autodesk.Viewing.Document.load() failuire callback.
 */
var onDocumentLoadFailure = function(viewerErrorCode, errorMessage) {
	reportError('onDocumentLoadFailure() - errorCode:' + viewerErrorCode + ' ' + errorMessage);
}

/**
 * viewer.loadModel() success callback.
 * Invoked after the model's SVF has been initially loaded.
 * It may trigger before any geometry has been downloaded and displayed on-screen.
 */
var onLoadModelSuccess = function(model) {
	//console.log('onLoadModelSuccess()!');
	//console.log('Validate model loaded: ' + (viewer.model === model));
	//console.log(model);
}

/**
 * viewer.loadModel() failure callback.
 * Invoked when there's an error fetching the SVF file.
 */
var onLoadModelError = function(viewerErrorCode) {
	reportError('onLoadModelError() - errorCode:' + viewerErrorCode);
}