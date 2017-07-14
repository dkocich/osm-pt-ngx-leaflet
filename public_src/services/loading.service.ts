import {Injectable} from "@angular/core";

@Injectable()
export class LoadingService {
    private _isLoading: boolean = false;
    private _statusMessage: string = "Loading...";
    constructor() { }

    public isLoading(): boolean {
        return this._isLoading;
    }

    public getStatus(): string {
        return this._statusMessage;
    }

    public show(message?: string): void {
        this._isLoading = true;
        if (message) {
            this._statusMessage = message;
        } else {
            this._statusMessage = "Loading...";
        }
    }

    public hide(): void {
        this._isLoading = false;
    }
}
