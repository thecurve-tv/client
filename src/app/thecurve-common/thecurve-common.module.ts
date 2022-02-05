import { CommonModule, DatePipe } from '@angular/common'
import { NgModule } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { CarouselComponent } from './components/carousel/carousel.component'
import { FooterComponent } from './components/footer/footer.component'
import { LoginButtonComponent } from './components/login-button/login-button.component'
import { LogoutButtonComponent } from './components/logout-button/logout-button.component'
import { PopupComponent } from './components/popup/popup.component'
import { VarDirective } from './directives/ng-var.directive'

@NgModule({
  declarations: [
    CarouselComponent,
    FooterComponent,
    LoginButtonComponent,
    LogoutButtonComponent,
    PopupComponent,
    VarDirective,
    // Don't forget to export new declarations
  ],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    // Don't forget to export new imports
  ],
  providers: [
    DatePipe,
  ],
  exports: [
    // Exports of declared component start here
    CarouselComponent,
    FooterComponent,
    LoginButtonComponent,
    LogoutButtonComponent,
    PopupComponent,
    VarDirective,
    // Exports of imported modules start here
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
})
export class ThecurveCommonModule { }
