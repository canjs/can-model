@function can-model.unbind unbind
@parent can-model.static
@description Stop listening for events on a Model class.

@signature `Model.unbind(eventType, handler)`
@param {String} eventType The type of event. It must be
`"created"`, `"updated"`, `"destroyed"`.
@param {function} handler A callback function
that was passed to `bind`.
@return {Model} The model constructor function.

@body
`unbind(eventType, handler)` removes a listener
attached with [can-model.bind].

```
var handler = function(ev, createdTask){

}
Task.bind("created", handler)
Task.unbind("created", handler)
```

You have to pass the same function to `unbind` that you
passed to `bind`.