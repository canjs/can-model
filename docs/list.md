@property {Model.List} can-model.List List
@parent can-model.static

@description Specifies the type of List that [can-model.findAll findAll]
should return.

@option {Model.List} A Model's List property is the
type of [can-list List] returned
from [can-model.findAll findAll]. For example:

```
Task = Model.extend({
 findAll: "/tasks"
},{})

Task.findAll({}, function(tasks){
 tasks instanceof Task.List //-> true
})
```

Overwrite a Model's `List` property to add custom
behavior to the lists provided to `findAll` like:

```
Task = Model.extend({
 findAll: "/tasks"
},{})
Task.List = Task.List.extend({
 completed: function(){
   var count = 0;
   this.each(function(task){
     if( task.attr("completed") ) count++;
   })
   return count;
 }
})

Task.findAll({}, function(tasks){
 tasks.completed() //-> 3
})
```

When [can-model Model] is extended,
[can-model.List] is extended and set as the extended Model's
`List` property. The extended list's [can-list.Map Map] property
is set to the extended Model.  For example:

```
Task = Model.extend({
 findAll: "/tasks"
},{})
Task.List.Map //-> Task
```