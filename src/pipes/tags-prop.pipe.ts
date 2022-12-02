import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tagsProp',
})
export class TagsPropPipe implements PipeTransform {
  transform(valueObj: { tags?: object }, ...args: unknown[]): unknown {
    const keys = [];
    const tagsProp = valueObj.tags;
    for (const key in tagsProp) {
      if (valueObj.hasOwnProperty(key)) {
        keys.push({ key, value: valueObj[key] });
      }
    }
    return keys;
  }
}
