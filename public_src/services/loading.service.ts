import {Injectable} from "@angular/core";

@Injectable()
export class LoadingService {
    private _isLoading: boolean = false;

    constructor() { }

    public isLoading(): boolean {
        return this._isLoading;
    }

    public show(): void {
        this._isLoading = true;
    }

    public hide(): void {
        this._isLoading = false;
    }
}
