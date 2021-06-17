import { NgModule } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { ReactiveFormsModule } from '@angular/forms'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { LoginButtonComponent } from './components/login-button/login-button.component'
import { VarDirective } from './directives/ng-var.directive'
import { LogoutButtonComponent } from './components/logout-button/logout-button.component'
import { PopupComponent } from './components/popup/popup.component'

@NgModule({
  declarations: [
    LoginButtonComponent,
    LogoutButtonComponent,
    PopupComponent,
    VarDirective
    // Don't forget to export new declarations
  ],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
    // Don't forget to export new imports
  ],
  providers: [
    DatePipe
  ],
  exports: [
    // Exports of declared component start here
    LoginButtonComponent,
    LogoutButtonComponent,
    PopupComponent,
    VarDirective,
    // Exports of imported modules start here
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ]
})
export class ThecurveCommonModule { }
