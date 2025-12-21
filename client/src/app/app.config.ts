import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http'; // <--- Import this
import { FormsModule } from '@angular/forms'; // <--- Import this for inputs

import { App } from './app';

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [App]
})

export class AppModule {}

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};