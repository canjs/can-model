@description Destroy a resource on the server.
@function can-model.destroy destroy
@parent can-model.static

@signature `Model.destroy: function(id) -> Promise`

If you provide a function, the Model will expect you to do your own AJAX requests.
@param { } id The ID of the resource to destroy.
@return {Promise} A Promise that resolves to the destroyed model.

@signature `Model.destroy: "[METHOD] /path/to/resource"`

If you provide a URL, the Model will send a request to that URL using
the method specified (or DELETE if none is specified) when deleting an
instance on the server. (See below for more details.)

@return {Promise} A Promise that resolves to the destroyed model.

@body
`destroy(id) -> Promise` is used by [can-model::destroy Model] remove a model
instance from the server.

## Implement with a URL

You can implement destroy with a string like:

```
Recipe = Model.extend({
 destroy : "/recipe/{id}"
},{})
```

And use [can-model::destroy destroy] to destroy it like:

```
Recipe.findOne({id: 1}, function(recipe){
    recipe.destroy();
});
```

This sends a `DELETE` request to `/thing/destroy/1`.

If your server does not support `DELETE` you can override it like:

```
Recipe = Model.extend({
 destroy : "POST /recipe/destroy/{id}"
},{})
```

## Implement with a function

Implement destroy with a function like:

```
Recipe = Model.extend({
 destroy : function(id){
   return $.post("/recipe/destroy/"+id,{});
 }
},{})
```

Destroy just needs to return a Promise that resolves.