import { Component } from "@angular/core";
import { TestBed, async } from "@angular/core/testing";
import { EchoPipe } from "../public_src/pipes/echo.pipe";
@Component({
    selector: "test",
    template: `
        <p>{{ text | echo }}</p>
    `
})
class TestComponent {
    text: string;
}
describe("EchoPipe", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [TestComponent, EchoPipe]
        });
    });
    beforeEach(async(() => {
        TestBed.compileComponents();
    }));
    it("works well", async(() => {
        const fixture = TestBed.createComponent(TestComponent);
        fixture.componentInstance.text = "foo";
        fixture.detectChanges();
        const el = fixture.debugElement.nativeElement as HTMLElement;
        expect(el.querySelector("p").textContent).toBe("foo");
    }));
});
