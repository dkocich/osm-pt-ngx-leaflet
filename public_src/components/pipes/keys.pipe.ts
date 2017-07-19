import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "keys", pure: true })
export class KeysPipe implements PipeTransform {
    public transform(value, args: string[]): any {
        const keys = [];
        for (const key in value) {
            keys.push({ key: key, value: value[key] });
        }
        return keys;
    }
}
