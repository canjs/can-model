@property {String} can-model.id id
@parent can-model.static
The name of the id field.  Defaults to `'id'`. Change this if it is something different.

For example, it's common in .NET to use `'Id'`.  Your model might look like:

```
Friend = Model.extend({
 id: "Id"
},{});
```
