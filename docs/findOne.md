
@description Retrieve a resource from a server.
@function can-model.findOne findOne
@parent can-model.static

@signature `Model.findOne( params[, success[, error]] )`

Retrieve a single instance from the server.

@param {Object} params Values to filter the request or results with.
@param {function(Model)} [success(model)] A callback to call on successful retrieval. The callback receives
the retrieved resource as a Model.
@param {function(Object)} [error(xhr)] A callback to call when an error occurs. The callback receives the
XmlHttpRequest object.
@return {Promise} A Promise that resolves to a [Model] instance of the retrieved model

@signature `Model.findOne: findOneData( params ) -> Promise`

Implements `findOne` with a [can-model.findOneData function]. This function
is passed to [can-model.makeFindOne makeFindOne] to create the external
`findOne` method.

```
findOne: function(params){
 return $.get("/task/"+params.id)
}
```

@param {Model.findOneData} findOneData A function that accepts parameters
specifying an instance to retreive and returns a [Promise]
that resolves to that instance.

@signature `Model.findOne: "[METHOD] /path/to/resource"`

Implements `findOne` with a HTTP method and url to retrieve an instance's data.

```
findOne: "GET /tasks/{id}"
```

If `findOne` is implemented with a string, this gets converted to
a [can-model.makeFindOne makeFindOne function]
which is passed to [can-model.makeFindOne makeFindOne] to create the external
`findOne` method.

@param {HttpMethod} METHOD An HTTP method. Defaults to `"GET"`.

@param {STRING} url The URL of the service to retrieve JSON data.

@signature `Model.findOne: {Object}`

Implements `findOne` with a [http://api.jquery.com/jQuery.ajax/#jQuery-ajax-settings ajax settings object].

   findOne: {url: "/tasks/{id}", dataType: "json"}

If `findOne` is implemented with an object, it gets converted to
a [can-model.makeFindOne makeFindOne function]
which is passed to [can-model.makeFindOne makeFindOne] to create the external
`findOne` method.

@param {Object} ajaxSettings A [http://api.jquery.com/jQuery.ajax/#jQuery-ajax-settings settings] object that
specifies the options available to pass to [ajax].

@body

## Use

`findOne( params, success(instance), error(xhr) ) -> Promise` is used to retrieve a model
instance from the server.

Use `findOne` like:

```
Recipe.findOne({id: 57}, function(recipe){
recipe.attr('name') //-> "Ice Water"
}, function( xhr ){
// called if an error
}) //-> Promise
```

Before you can use `findOne`, you must implement it.

## Implement with a URL

Implement findAll with a url like:

```
Recipe = Model.extend({
 findOne : "/recipes/{id}.json"
},{});
```


If `findOne` is called like:

```
Recipe.findOne({id: 57});
```

The server should return data that looks like:

```
{"id" : 57, "name": "Ice Water"}
```

## Implement with an Object

Implement `findOne` with an object that specifies the parameters to
`can-util/dom/ajax/ajax` (jQuery.ajax) like:

```
Recipe = Model.extend({
 findOne : {
   url: "/recipes/{id}.xml",
   dataType: "xml"
 }
},{})
```

## Implement with a Function

To implement with a function, `findOne` is passed __params__ to specify
the instance retrieved from the server and it should return a
Promise that resolves to the model data.  Also notice that you now need to
build the URL manually. For example:

```
Recipe = Model.extend({
 findOne : function(params){
   return $.ajax({
     url: '/recipes/' + params.id,
     type: 'get',
     dataType: 'json'})
 }
},{})
```
