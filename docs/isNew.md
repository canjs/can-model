@function can-model.prototype.isNew isNew
@parent can-model.prototype
@description Check if a Model has yet to be saved on the server.
@signature `model.isNew()`
@return {Boolean} Whether an instance has been saved on the server.
(This is determined by whether `id` has a value set yet.)

@body
`isNew()` returns if the instance is has been created
on the server. This is essentially if the [can-model.id]
property is null or undefined.

```
new Recipe({id: 1}).isNew() //-> false
```