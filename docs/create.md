@description Specifies how to create a new resource on the server. `create(serialized)` is called
by [can-model.prototype.save save] if the model instance [can-model.prototype.isNew is new].
@function can-model.create create
@parent can-model.static


@signature `Model.create: function(serialized) -> Promise`

Specify a function to create persistent instances. The function will
typically perform an AJAX request to a service that results in
creating a record in a database.

@param {Object} serialized The [Map::serialize serialized] properties of
the model to create.
@return {Promise} A Promise that resolves to an object of attributes
that will be added to the created model instance.  The object __MUST__ contain
an [can-model.id id] property so that future calls to [can-model.prototype.save save]
will call [can-model.update].


@signature `Model.create: "[METHOD] /path/to/resource"`

Specify a HTTP method and url to create persistent instances.

If you provide a URL, the Model will send a request to that URL using
the method specified (or POST if none is specified) when saving a
new instance on the server. (See below for more details.)

@param {HttpMethod} METHOD An HTTP method. Defaults to `"POST"`.
@param {STRING} url The URL of the service to retrieve JSON data.


@signature `Model.create: {Object}`

Specify an options object that is used to make a HTTP request to create
persistent instances.

@param {Object} ajaxSettings A [http://api.jquery.com/jQuery.ajax/#jQuery-ajax-settings settings] object that
specifies the options available to pass to [can-ajax].

@body

`create(attributes) -> Promise` is used by [can-model::save save] to create a
model instance on the server.

## Implement with a URL

The easiest way to implement create is to give it the url
to post data to:

```
var Recipe = Model.extend({
 create: "/recipes"
},{})
```

This lets you create a recipe like:

```
new Recipe({name: "hot dog"}).save();
```


## Implement with a Function

You can also implement create by yourself. Create gets called
with `attrs`, which are the [can-map::serialize serialized] model
attributes.  Create returns a `Promise`
that contains the id of the new instance and any other
properties that should be set on the instance.

For example, the following code makes a request
to `POST /recipes.json {'name': 'hot+dog'}` and gets back
something that looks like:

```
{
 "id": 5,
 "createdAt": 2234234329
}
```

The code looks like:

```
Model.extend("Recipe", {
 create : function( attrs ){
   return $.post("/recipes.json",attrs, undefined ,"json");
 }
},{})
```
