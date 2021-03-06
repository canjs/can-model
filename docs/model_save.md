@function can-model.prototype.save save
@parent can-model.prototype
@description Save a model back to the server.
@signature `model.save([success[, error]])`
@param {function} [success] A callback to call on successful save. The callback receives
the Model after saving.
@param {function} [error] A callback to call when an error occurs. The callback receives the
XmlHttpRequest object.
@return {Promise} A Promise that resolves to the Model after it has been saved.

@body
`model.save([success(model)],[error(xhr)])` creates or updates
the model instance using [can-model.create] or
[can-model.update] depending if the instance
[can-model::isNew has an id or not].

## Using `save` to create an instance.

If `save` is called on an instance that does not have
an [can-model.id id] property, it calls [can-model.create]
with the instance's properties.  It also [can-trigger triggers]
a "created" event on the instance and the model.

```
// create a model instance
var todo = new Todo({name: "dishes"});

// listen when the instance is created
todo.bind("created", function(ev){
 this //-> todo
});

// save it on the server
todo.save(function(todo){
 console.log("todo", todo, "created");
});
```

## Using `save` to update an instance.

If save is called on an instance that has
an [can-model.id id] property, it calls [can-model.update]
with the instance's properties.  When the save is complete,
it triggers an "updated" event on the instance and the instance's model.

Instances with an
__id__ are typically retrieved with [can-model.findAll] or
[can-model.findOne].

```
// get a created model instance
Todo.findOne({id: 5},function(todo){

 // listen when the instance is updated
 todo.bind("updated", function(ev){
   this //-> todo
 })

 // update the instance's property
 todo.attr("complete", true)

 // save it on the server
 todo.save(function(todo){
   console.log("todo", todo, "updated")
 });

});
```
