// Core Angular imports
import { Component, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';

// Minimal imports only
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Create a minimal component for testing
@Component({
  selector: 'app-minimal',
  template: '<h1>Angular 20 Minimal App is Running!</h1>',
  standalone: true,
  imports: [CommonModule]
})
export class MinimalComponent {}

// Define minimal routes
const ROUTES: Routes = [{ path: '', component: MinimalComponent }];


@NgModule({
  bootstrap: [MinimalComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot(ROUTES)
  ],
  providers: [],
  declarations: [MinimalComponent]
})
export class AppModule {}
