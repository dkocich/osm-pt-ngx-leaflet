import { Pipe, PipeTransform } from "@angular/core";
@Pipe({
  name: "echo"
})
export class EchoPipe implements PipeTransform {
  public transform(value: any): any {
    return value;
  }
}
