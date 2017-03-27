
var bucketsVisible = false;

$(document).ready(function(){
    var bucketsSection = $('.data-storage');
	var clickSection = bucketsSection.find('.section-header');
	var toggleSection = bucketsSection.find('.content');
	clickSection.on('click', function(){
		if(bucketsVisible){
			bucketsVisible = false;
			toggleSection.slideToggle();
		}
		else{
			bucketsVisible = true;
			toggleSection.slideToggle();
			getBuckets();
		}
	});

	$('#new-bucket-add').on('click', function(){
		addBucket();
	});

    $('#new-bucket-item-add').on('click', function(){
		uploadFile();
	});
});


/////////////////////////////////////////////////////////////////////////////////////////////
// utilities
//////////////////////////////////////////////////////////////////////////////////////////////
var buildServerRequest = function(callType, endPoint, params, fcSucceed, fcFail, bContentType){
	var xhr = new XMLHttpRequest();
	if ("withCredentials" in xhr){
    // Check if the XMLHttpRequest object has a "withCredentials" property.
    // "withCredentials" only exists on XMLHTTPRequest2 objects.

		var url = 'http://buc4vfhzy1:3000/' + endPoint;

		if('get' == callType){
			if(null != params){
				url = url + '?' + params;
			}
		}

        xhr.open(callType, url, true);
        if((bContentType == null) || (bContentType == true)) // by default set content type
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

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
