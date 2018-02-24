import { Injectable } from '@angular/core';

@Injectable()
export class LoadService {
  private _isLoading: boolean = false;
  private _statusMessage: string = 'Loading...';
  constructor() {
    //
  }

  public isLoading(): boolean {
    return this._isLoading;
  }

  public getStatus(): string {
    return this._statusMessage;
  }

  public show(message?: string): void {
    this._isLoading = true;
    this._statusMessage = message || 'Loading...';
  }

  public hide(): void {
    this._isLoading = false;
  }
}
