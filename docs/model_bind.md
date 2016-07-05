@description Listen to events on this Model.
@function can-model.prototype.bind bind
@parent can-model.prototype
@signature `model.bind(eventName, handler)`
@param {String} eventName The event to bind to.
@param {function} handler The function to call when the
event occurs. __handler__ is passed the event and the
Model instance.
@return {Model} The Model, for chaining.

@body
`bind(eventName, handler(ev, args...) )` is used to listen
to events on this model instance.  Example:

```
Task = Model.extend()
var task = new Task({name : "dishes"})
task.bind("name", function(ev, newVal, oldVal){})
```

Use `bind` the
same as [can-map::bind] which should be used as
a reference for listening to property changes.

Bind on model can be used to listen to when
an instance is:

- created
- updated
- destroyed

like:

```
Task = Model.extend()
var task = new Task({name : "dishes"})

task.bind("created", function(ev, newTask){
 console.log("created", newTask)
})
.bind("updated", function(ev, updatedTask){
 console.log("updated", updatedTask)
})
.bind("destroyed", function(ev, destroyedTask){
 console.log("destroyed", destroyedTask)
})

// create, update, and destroy
task.save(function(){
 task.attr('name', "do dishes")
     .save(function(){
       task.destroy()
     })
});
```

`bind` also extends the inherited
behavior of [can-map::bind] to track the number
of event bindings on this object which is used to store
the model instance.  When there are no bindings, the
model instance is removed from the store, freeing memory.